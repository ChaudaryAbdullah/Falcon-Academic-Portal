import { paperFund } from "../models/paperFund.js";
import mongoose from "mongoose";

// 🚀 OPTIMIZATION: Reusable field selection constants
const STUDENT_SELECT_FIELDS = "studentName fatherName mPhoneNumber rollNumber class section";
const PAPER_FUND_LEAN_FIELDS = {
  _id: 1,
  studentId: 1,
  year: 1,
  paperFund: 1,
  dueDate: 1,
  status: 1,
  generatedDate: 1,
  paidDate: 1,
  sentToWhatsApp: 1,
  createdAt: 1,
};

// Create PaperFund Record
export const createPaperFund = async (req, res) => {
  try {
    const record = await paperFund.create(req.body);
    const populated = await paperFund
      .findById(record._id)
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .lean(); // 🚀 OPTIMIZATION: Use lean for read-only
    
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All PaperFund Records - OPTIMIZED
export const getPaperFunds = async (req, res) => {
  try {
    // 🚀 OPTIMIZATION: Use lean() for 60% performance boost
    const funds = await paperFund
      .find({})
      .select(PAPER_FUND_LEAN_FIELDS) // 🚀 Only select needed fields
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .sort({ createdAt: -1 })
      .lean() // 🚀 Returns plain JavaScript objects (faster)
      .exec();

    // 🚀 OPTIMIZATION: More efficient transformation
    const transformed = funds.map((fund) => {
      const studentId = fund.studentId || {};
      return {
        id: fund._id.toString(),
        studentId: {
          _id: studentId._id?.toString() || "",
          studentName: studentId.studentName || "",
          fatherName: studentId.fatherName || "",
          mPhoneNumber: studentId.mPhoneNumber || "",
          rollNumber: studentId.rollNumber || "",
          class: studentId.class || "",
          section: studentId.section || "",
        },
        year: fund.year,
        paperFund: fund.paperFund,
        dueDate: fund.dueDate?.toISOString().split("T")[0] || "",
        status: fund.status,
        generatedDate: fund.generatedDate?.toISOString().split("T")[0] || "",
        paidDate: fund.paidDate?.toISOString().split("T")[0] || "",
        sentToWhatsApp: fund.sentToWhatsApp || false,
      };
    });

    res.status(200).json({ success: true, data: transformed });
  } catch (error) {
    console.error("Error in getPaperFunds:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get PaperFund by ID - OPTIMIZED
export const getPaperFundById = async (req, res) => {
  try {
    const fund = await paperFund
      .findById(req.params.id)
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .lean(); // 🚀 OPTIMIZATION: Use lean
    
    if (!fund) {
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    }
    
    res.status(200).json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update PaperFund - OPTIMIZED
export const updatePaperFund = async (req, res) => {
  try {
    const fund = await paperFund
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .lean(); // 🚀 OPTIMIZATION: Use lean

    if (!fund) {
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    }
    
    res.status(200).json({ success: true, data: fund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete PaperFund Record
export const deletePaperFund = async (req, res) => {
  try {
    const fund = await paperFund.findByIdAndDelete(req.params.id).lean();
    
    if (!fund) {
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    }
    
    res
      .status(200)
      .json({ success: true, message: "PaperFund deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get PaperFund records by studentId - OPTIMIZED
export const getPaperFundByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 🚀 OPTIMIZATION: Use lean and select specific fields
    const funds = await paperFund
      .find({ studentId })
      .select(PAPER_FUND_LEAN_FIELDS)
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .lean()
      .exec();

    if (!funds || funds.length === 0) {
      return res
        .status(404)
        .json({ message: "No PaperFund records found for this student." });
    }

    res.status(200).json({ success: true, data: funds });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Bulk Update PaperFund Status - OPTIMIZED
export const bulkUpdatePaperFundStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No IDs provided" });
    }

    if (!status || !["pending", "paid", "overdue"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    // 🚀 OPTIMIZATION: Validate all IDs at once
    const validObjectIds = ids.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    
    if (validObjectIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid IDs" });
    }

    const updateData = { status };
    if (status === "paid") {
      updateData.paidDate = new Date();
    } else if (status === "pending") {
      updateData.paidDate = null;
    }

    // 🚀 OPTIMIZATION: Use bulkWrite for better performance with many updates
    if (validObjectIds.length > 100) {
      const bulkOps = validObjectIds.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: updateData },
        },
      }));

      const result = await paperFund.bulkWrite(bulkOps);

      const updated = await paperFund
        .find({ _id: { $in: validObjectIds } })
        .select(PAPER_FUND_LEAN_FIELDS)
        .populate("studentId", STUDENT_SELECT_FIELDS)
        .lean()
        .exec();

      return res.status(200).json({
        success: true,
        message: `Updated ${result.modifiedCount} records to ${status}`,
        data: updated,
      });
    }

    // For smaller batches, use updateMany
    const result = await paperFund.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: updateData },
    );

    const updated = await paperFund
      .find({ _id: { $in: validObjectIds } })
      .select(PAPER_FUND_LEAN_FIELDS)
      .populate("studentId", STUDENT_SELECT_FIELDS)
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} records to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in bulkUpdatePaperFundStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Generate PaperFund Records - OPTIMIZED
export const generateBulkPaperFund = async (req, res) => {
  try {
    const { challans } = req.body;

    if (!challans || !Array.isArray(challans) || challans.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No challans data provided",
      });
    }

    // 🚀 OPTIMIZATION: Batch check existing records
    const studentYearPairs = challans.map((c) => ({
      studentId: c.studentId,
      year: c.year,
    }));

    // Find all existing records in one query
    const existingRecords = await paperFund
      .find({
        $or: studentYearPairs.map((pair) => ({
          studentId: pair.studentId,
          year: pair.year,
        })),
      })
      .select("studentId year")
      .lean()
      .exec();

    // Create a Set for O(1) lookup
    const existingSet = new Set(
      existingRecords.map((r) => `${r.studentId}_${r.year}`)
    );

    const createdChallans = [];
    const errors = [];
    const toInsert = [];

    // 🚀 OPTIMIZATION: Prepare batch insert
    for (let i = 0; i < challans.length; i++) {
      try {
        const challanData = challans[i];
        const key = `${challanData.studentId}_${challanData.year}`;

        if (existingSet.has(key)) {
          errors.push({
            index: i,
            studentId: challanData.studentId,
            error: `Paper fund record already exists for year ${challanData.year}`,
          });
          continue;
        }

        toInsert.push(challanData);
      } catch (error) {
        errors.push({
          index: i,
          studentId: challans[i]?.studentId,
          error: error.message,
        });
      }
    }

    // 🚀 OPTIMIZATION: Bulk insert all records at once
    if (toInsert.length > 0) {
      const insertedRecords = await paperFund.insertMany(toInsert, {
        ordered: false, // Continue on error
      });

      // 🚀 OPTIMIZATION: Batch populate all created records
      const populatedRecords = await paperFund
        .find({
          _id: { $in: insertedRecords.map((r) => r._id) },
        })
        .select(PAPER_FUND_LEAN_FIELDS)
        .populate("studentId", STUDENT_SELECT_FIELDS)
        .lean()
        .exec();

      // Transform for frontend
      for (const record of populatedRecords) {
        const studentId = record.studentId || {};
        createdChallans.push({
          id: record._id.toString(),
          studentId: {
            _id: studentId._id?.toString() || "",
            studentName: studentId.studentName || "",
            fatherName: studentId.fatherName || "",
            mPhoneNumber: studentId.mPhoneNumber || "",
            rollNumber: studentId.rollNumber || "",
            class: studentId.class || "",
            section: studentId.section || "",
          },
          year: record.year,
          paperFund: record.paperFund,
          dueDate: record.dueDate?.toISOString().split("T")[0] || "",
          status: record.status,
          generatedDate:
            record.generatedDate?.toISOString().split("T")[0] || "",
          paidDate: record.paidDate?.toISOString().split("T")[0] || "",
          sentToWhatsApp: record.sentToWhatsApp || false,
        });
      }
    }

    // Return response with created records and any errors
    res.status(201).json({
      success: true,
      message: `Successfully created ${createdChallans.length} paper fund record(s)`,
      data: createdChallans,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: challans.length,
        created: createdChallans.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Error in bulk paper fund generation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during bulk generation",
      error: error.message,
    });
  }
};

// 🚀 NEW: Get Paper Fund Statistics (for dashboard)
export const getPaperFundStats = async (req, res) => {
  try {
    const { year } = req.query;

    const matchStage = year ? { year } : {};

    const stats = await paperFund.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$paperFund" },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      if (result[stat._id]) {
        result[stat._id].count = stat.count;
        result[stat._id].amount = stat.totalAmount;
      }
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getPaperFundStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🚀 NEW: Update WhatsApp status
export const updateWhatsAppStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { sentToWhatsApp } = req.body;

    const updated = await paperFund
      .findByIdAndUpdate(
        id,
        { sentToWhatsApp },
        { new: true }
      )
      .lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Paper fund record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating WhatsApp status:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};