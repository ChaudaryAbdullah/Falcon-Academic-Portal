import { StudentDiscount } from "../models/studentDiscount.js";

// ============ GET ALL DISCOUNTS WITH PAGINATION ============
export const getAllDiscounts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery = {};
    if (search) {
      // We need to search in populated student fields
      // First get matching student IDs
      const { Student } = await import("../models/student.js");
      const matchingStudents = await Student.find({
        $or: [
          { studentName: { $regex: search, $options: "i" } },
          { fatherName: { $regex: search, $options: "i" } },
          { rollNumber: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const studentIds = matchingStudents.map((s) => s._id);

      searchQuery = {
        $or: [
          { studentId: { $in: studentIds } },
          { discount: !isNaN(search) ? parseFloat(search) : -1 },
        ],
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [discounts, total] = await Promise.all([
      StudentDiscount.find(searchQuery)
        .lean()
        .populate("studentId", "rollNumber studentName fatherName mPhoneNumber class section")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      StudentDiscount.countDocuments(searchQuery),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: discounts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords: total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        startRecord: skip + 1,
        endRecord: Math.min(skip + limitNum, total),
      },
    });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discounts",
      error: error.message,
    });
  }
};

// ============ GET ALL DISCOUNTS (NO PAGINATION - FOR CACHING) ============
export const getAllDiscountsNoPagination = async (req, res) => {
  try {
    const discounts = await StudentDiscount.find()
      .lean()
      .populate("studentId", "rollNumber studentName fatherName mPhoneNumber class section")
      .sort({ createdAt: -1 });

    res.status(200).json(discounts);
  } catch (error) {
    console.error("Error fetching discounts:", error);
    res.status(500).json({
      message: "Error fetching discounts",
      error: error.message,
    });
  }
};

// ============ CREATE OR UPDATE DISCOUNT ============
export const createOrUpdateDiscount = async (req, res) => {
  try {
    const { studentId, discount } = req.body;

    // Validation
    if (!studentId || discount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Student ID and discount amount are required",
      });
    }

    if (isNaN(discount) || discount < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount must be a valid positive number",
      });
    }

    // Check if student exists
    const { Student } = await import("../models/student.js");
    const studentExists = await Student.findById(studentId);
    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Create or update discount
    let discountDoc = await StudentDiscount.findOneAndUpdate(
      { studentId },
      { discount },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("studentId", "rollNumber studentName fatherName mPhoneNumber class section");

    res.status(200).json({
      success: true,
      data: discountDoc,
      message: "Discount saved successfully",
    });
  } catch (error) {
    console.error("Error saving discount:", error);
    res.status(500).json({
      success: false,
      message: "Error saving discount",
      error: error.message,
    });
  }
};

// ============ GET DISCOUNT BY STUDENT ID ============
export const getDiscountByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const discount = await StudentDiscount.findOne({ studentId })
      .populate("studentId", "rollNumber studentName fatherName mPhoneNumber class section")
      .lean();

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount not found for this student",
      });
    }

    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    console.error("Error fetching discount:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discount",
      error: error.message,
    });
  }
};

// ============ DELETE DISCOUNT ============
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await StudentDiscount.findById(id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount not found",
      });
    }

    await discount.deleteOne();

    res.status(200).json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discount:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting discount",
      error: error.message,
    });
  }
};

// ============ GET DISCOUNT STATISTICS ============
export const getDiscountStats = async (req, res) => {
  try {
    const [stats] = await StudentDiscount.aggregate([
      {
        $group: {
          _id: null,
          totalDiscounts: { $sum: 1 },
          totalAmount: { $sum: "$discount" },
          averageDiscount: { $avg: "$discount" },
          minDiscount: { $min: "$discount" },
          maxDiscount: { $max: "$discount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats || {
        totalDiscounts: 0,
        totalAmount: 0,
        averageDiscount: 0,
        minDiscount: 0,
        maxDiscount: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching discount stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// ============ BULK CREATE DISCOUNTS ============
export const bulkCreateDiscounts = async (req, res) => {
  try {
    const { discounts } = req.body;

    if (!Array.isArray(discounts) || discounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of discounts",
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const item of discounts) {
      try {
        const discountDoc = await StudentDiscount.findOneAndUpdate(
          { studentId: item.studentId },
          { discount: item.discount },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).populate("studentId");

        results.success.push(discountDoc);
      } catch (error) {
        results.failed.push({
          studentId: item.studentId,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${discounts.length} discounts`,
      data: results,
    });
  } catch (error) {
    console.error("Error in bulk create:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk discounts",
      error: error.message,
    });
  }
};