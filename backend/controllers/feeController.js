import { Fee } from "../models/fee.js";
import mongoose from "mongoose";
import NodeCache from "node-cache";

// Initialize cache with 5-minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ============ OPTIMIZED PAGINATION ============
export const getFees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      month,
      year,
      search,
      whatsapp,
      studentClass,
      section,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build match conditions
    const matchConditions = {};

    if (status && status !== "all") {
      matchConditions.status = status;
    }

    if (month && month !== "all") {
      matchConditions.month = month;
    }

    if (year && year !== "all") {
      matchConditions.year = year.toString();
    }

    if (whatsapp === "sent") {
      matchConditions.sentToWhatsApp = true;
    } else if (whatsapp === "not_sent") {
      matchConditions.sentToWhatsApp = false;
    }

    // Build aggregation pipeline for search and filters
    const pipeline = [];

    // Lookup student data first
    pipeline.push({
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    });

    pipeline.push({ $unwind: "$student" });

    // Apply class/section filters
    if (studentClass && studentClass !== "all") {
      matchConditions["student.class"] = studentClass;
    }

    if (section && section !== "all") {
      matchConditions["student.section"] = section;
    }

    // Search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { "student.studentName": searchRegex },
            { "student.fatherName": searchRegex },
            { "student.rollNumber": searchRegex },
          ],
        },
      });
    }

    // Add match conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Count total documents (before pagination)
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Fee.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;

    // Sort
    const sortOptions = {};
    if (sortBy === "studentName") {
      sortOptions["student.studentName"] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }
    pipeline.push({ $sort: sortOptions });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project only necessary fields (exclude heavy img data)
    pipeline.push({
      $project: {
        _id: 1,
        studentId: {
          _id: "$student._id",
          studentName: "$student.studentName",
          fatherName: "$student.fatherName",
          mPhoneNumber: "$student.mPhoneNumber",
          rollNumber: "$student.rollNumber",
          class: "$student.class",
          section: "$student.section",
          discountCode: "$student.discountCode",
          // Exclude img to reduce payload size
        },
        month: 1,
        year: 1,
        tutionFee: 1,
        remainingBalance: 1,
        examFee: 1,
        miscFee: 1,
        arrears: 1,
        discount: 1,
        totalAmount: 1,
        dueDate: 1,
        status: 1,
        generatedDate: 1,
        paidDate: 1,
        sentToWhatsApp: 1,
      },
    });

    // Execute aggregation
    const fees = await Fee.aggregate(pipeline);

    // Transform data
    const transformedFees = fees.map((fee) => ({
      id: fee._id.toString(),
      studentId: {
        _id: fee.studentId._id.toString(),
        studentName: fee.studentId.studentName,
        fatherName: fee.studentId.fatherName,
        mPhoneNumber: fee.studentId.mPhoneNumber,
        rollNumber: fee.studentId.rollNumber,
        class: fee.studentId.class,
        section: fee.studentId.section,
        discountCode: fee.studentId.discountCode,
      },
      month: fee.month,
      year: fee.year,
      tutionFee: fee.tutionFee,
      remainingBalance: fee.remainingBalance,
      examFee: fee.examFee,
      miscFee: fee.miscFee,
      arrears: fee.arrears,
      discount: fee.discount,
      totalAmount: fee.totalAmount,
      dueDate: fee.dueDate?.toISOString().split("T")[0] || "",
      status: fee.status,
      generatedDate: fee.generatedDate?.toISOString().split("T")[0] || "",
      paidDate: fee.paidDate?.toISOString().split("T")[0] || "",
      sentToWhatsApp: fee.sentToWhatsApp,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      data: transformedFees,
      pagination: {
        currentPage,
        totalPages,
        totalRecords,
        limit: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        startRecord: skip + 1,
        endRecord: Math.min(skip + parseInt(limit), totalRecords),
      },
    });
  } catch (error) {
    console.error("Error in getFees:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ OPTIMIZED FILTERS ============
export const getFilterOptions = async (req, res) => {
  try {
    const cacheKey = "fee_filter_options";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    const [months, years, statuses] = await Promise.all([
      Fee.distinct("month"),
      Fee.distinct("year"),
      Fee.distinct("status"),
    ]);

    const filterOptions = {
      months: months.filter(Boolean).sort(),
      years: years
        .filter(Boolean)
        .map((y) => y.toString())
        .sort((a, b) => Number(b) - Number(a)),
      statuses: statuses.filter(Boolean),
    };

    cache.set(cacheKey, filterOptions);

    res.status(200).json({ success: true, data: filterOptions });
  } catch (error) {
    console.error("Error getting filter options:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ OPTIMIZED STATS ============
export const getChallanStats = async (req, res) => {
  try {
    const cacheKey = "challan_stats";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [overallStats, todayStats, monthStats] = await Promise.all([
      // Overall stats
      Fee.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),

      // Today's generated fees
      Fee.countDocuments({
        generatedDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      }),

      // Current month stats
      Fee.aggregate([
        {
          $match: {
            month: today.toLocaleString("default", { month: "long" }),
            year: today.getFullYear().toString(),
          },
        },
        {
          $group: {
            _id: null,
            totalGenerated: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            collected: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $ne: ["$status", "paid"] }, "$totalAmount", 0],
              },
            },
          },
        },
      ]),
    ]);

    // Process overall stats
    const overall = {
      pending: 0,
      paid: 0,
      overdue: 0,
      totalPendingAmount: 0,
      totalPaidAmount: 0,
      totalOverdueAmount: 0,
    };

    overallStats.forEach((stat) => {
      const status = stat._id;
      overall[status] = stat.count;
      overall[
        `total${status.charAt(0).toUpperCase() + status.slice(1)}Amount`
      ] = stat.totalAmount;
    });

    const stats = {
      overall,
      today: {
        generated: todayStats,
      },
      currentMonth: monthStats[0] || {
        totalGenerated: 0,
        totalAmount: 0,
        collected: 0,
        pending: 0,
      },
    };

    cache.set(cacheKey, stats, 60); // Cache for 1 minute

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error getting challan stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ OPTIMIZED BULK PRINT ============
export const getFeesForPrint = async (req, res) => {
  try {
    const { generatedDate, studentClass, section, feeIds } = req.query;

    const matchConditions = {};

    if (generatedDate) {
      matchConditions.generatedDate = new Date(generatedDate);
    }

    if (feeIds) {
      const ids = feeIds
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(id));
      matchConditions._id = { $in: ids };
    }

    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ];

    if (studentClass) {
      matchConditions["student.class"] = studentClass;
    }

    if (section) {
      matchConditions["student.section"] = section;
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Include img for printing
    pipeline.push({
      $project: {
        _id: 1,
        studentId: {
          _id: "$student._id",
          studentName: "$student.studentName",
          fatherName: "$student.fatherName",
          mPhoneNumber: "$student.mPhoneNumber",
          rollNumber: "$student.rollNumber",
          class: "$student.class",
          section: "$student.section",
          discountCode: "$student.discountCode",
          img: "$student.img",
        },
        month: 1,
        year: 1,
        tutionFee: 1,
        examFee: 1,
        miscFee: 1,
        arrears: 1,
        discount: 1,
        totalAmount: 1,
        dueDate: 1,
        status: 1,
        generatedDate: 1,
      },
    });

    pipeline.push({ $limit: 1000 }); // Safety limit

    const fees = await Fee.aggregate(pipeline);

    const transformedFees = fees.map((fee) => ({
      id: fee._id.toString(),
      studentId: fee.studentId,
      month: fee.month,
      year: fee.year,
      tutionFee: fee.tutionFee,
      examFee: fee.examFee,
      miscFee: fee.miscFee,
      arrears: fee.arrears,
      discount: fee.discount,
      totalAmount: fee.totalAmount,
      dueDate: fee.dueDate?.toISOString().split("T")[0] || "",
      status: fee.status,
      generatedDate: fee.generatedDate?.toISOString().split("T")[0] || "",
    }));

    res.status(200).json({
      success: true,
      data: transformedFees,
      count: transformedFees.length,
    });
  } catch (error) {
    console.error("Error getting fees for print:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ OPTIMIZED PENDING FEES ============
export const getPendingFees = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({
      studentId,
      status: { $in: ["pending", "overdue"] },
    })
      .select(
        "month year tutionFee examFee miscFee totalAmount remainingBalance arrears discount dueDate status",
      )
      .sort({ year: 1, month: 1 })
      .lean();

    const totalOutstanding = fees.reduce(
      (sum, fee) => sum + (fee.remainingBalance || fee.totalAmount),
      0,
    );

    res.status(200).json({
      success: true,
      data: fees,
      totalOutstanding,
    });
  } catch (error) {
    console.error("Error getting pending fees:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ KEEP EXISTING FUNCTIONS ============
// These can stay as-is or be similarly optimized

export const createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    const populatedFee = await Fee.findById(fee._id).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );

    // Invalidate cache
    cache.flushAll();

    res.status(201).json({ success: true, data: populatedFee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generateBulkFees = async (req, res) => {
  try {
    const { challans } = req.body;

    if (!challans || !Array.isArray(challans) || challans.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No challans provided",
      });
    }

    const createdChallans = [];
    const errors = [];

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < challans.length; i += batchSize) {
      const batch = challans.slice(i, i + batchSize);

      const batchPromises = batch.map(async (challanData) => {
        try {
          const existingChallan = await Fee.findOne({
            studentId: challanData.studentId._id,
            month: challanData.month,
            year: challanData.year,
          });

          if (existingChallan) {
            errors.push({
              studentId: challanData.studentId._id,
              message: `Fee challan already exists for ${challanData.month} ${challanData.year}`,
            });
            return null;
          }

          const feeData = {
            studentId: challanData.studentId._id,
            month: challanData.month,
            year: challanData.year,
            tutionFee: challanData.tutionFee || 0,
            examFee: challanData.examFee || 0,
            miscFee: challanData.miscFee || 0,
            arrears: challanData.arrears || 0,
            discount: challanData.discount || 0,
            dueDate: new Date(challanData.dueDate),
            status: challanData.status || "pending",
            generatedDate: new Date(challanData.generatedDate || new Date()),
            sentToWhatsApp: challanData.sentToWhatsApp || false,
          };

          const newFee = await Fee.create(feeData);
          return newFee;
        } catch (error) {
          errors.push({
            studentId: challanData.studentId?._id || "unknown",
            message: error.message,
          });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      createdChallans.push(...batchResults.filter(Boolean));
    }

    // Populate all at once
    const populated = await Fee.find({
      _id: { $in: createdChallans.map((c) => c._id) },
    }).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );

    // Invalidate cache
    cache.flushAll();

    res.status(201).json({
      success: true,
      message: `Generated ${createdChallans.length} fee challans`,
      data: populated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );
    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );

    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });

    // Invalidate cache
    cache.flushAll();

    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });

    // Invalidate cache
    cache.flushAll();

    res
      .status(200)
      .json({ success: true, message: "Fee record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeeByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId })
      .populate(
        "studentId",
        "img studentName fatherName mPhoneNumber rollNumber class section",
      )
      .sort({ year: -1, month: -1 });

    if (!fees || fees.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee record found for this student." });
    }

    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const bulkUpdateFeeStatus = async (req, res) => {
  try {
    const { feeIds, status } = req.body;

    if (!feeIds || !Array.isArray(feeIds) || feeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fee IDs provided",
      });
    }

    if (!status || !["pending", "paid", "overdue"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided",
      });
    }

    const validObjectIds = [];
    const invalidIds = [];

    for (const id of feeIds) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          validObjectIds.push(new mongoose.Types.ObjectId(id));
        } else {
          invalidIds.push(id);
        }
      } catch (error) {
        console.error(`Error converting ID ${id}:`, error);
        invalidIds.push(id);
      }
    }

    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fee IDs provided",
        invalidIds: invalidIds,
      });
    }

    const updateData = { status: status };

    if (status === "paid") {
      updateData.paidDate = new Date();
    } else if (status === "pending") {
      updateData.paidDate = null;
    }

    const result = await Fee.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No fee records found with the provided IDs",
      });
    }

    const updatedFees = await Fee.find({
      _id: { $in: validObjectIds },
    }).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );

    // Invalidate cache
    cache.flushAll();

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} fee records to ${status}`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      data: updatedFees,
      invalidIds: invalidIds.length > 0 ? invalidIds : undefined,
    });
  } catch (error) {
    console.error("Error in bulkUpdateFeeStatus:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const updateWhatsAppStatus = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { sentToWhatsApp } = req.body;

    const fee = await Fee.findByIdAndUpdate(
      feeId,
      { sentToWhatsApp: sentToWhatsApp },
      { new: true },
    ).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section discountCode",
    );

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: fee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW REPORT ENDPOINTS

// Generate Class & Section Report - FIXED VERSION
export const getClassSectionReport = async (req, res) => {
  try {
    const { reportType, class: studentClass, section, month, year } = req.query;

    // Build the aggregation pipeline
    const pipeline = [
      // First, lookup student data
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
    ];

    // Build match conditions
    let matchConditions = {};

    // Add year filter
    if (year && year !== "all") {
      matchConditions.year = year.toString();
    }

    // Add month filter
    if (month && month !== "all") {
      matchConditions.month = month;
    }

    // Add class and section filters based on report type
    if (reportType === "class-section" && studentClass && section) {
      matchConditions["student.class"] = studentClass;
      matchConditions["student.section"] = section;
    } else if (reportType === "class-all" && studentClass) {
      matchConditions["student.class"] = studentClass;
    }
    // For "all-students", no additional class/section filters

    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Group by student to aggregate all their fee records
    pipeline.push(
      {
        $group: {
          _id: "$studentId",
          studentInfo: { $first: "$student" },
          totalFee: { $sum: "$totalAmount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $ne: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
          lastPayment: {
            $max: {
              $cond: [{ $eq: ["$status", "paid"] }, "$paidDate", null],
            },
          },
          records: { $push: "$$ROOT" },
        },
      },
      // Project the final structure
      {
        $project: {
          _id: 1,
          studentId: "$studentInfo._id",
          studentName: "$studentInfo.studentName",
          fatherName: "$studentInfo.fatherName",
          class: "$studentInfo.class",
          section: "$studentInfo.section",
          rollNumber: "$studentInfo.rollNumber",
          totalFee: 1,
          paidAmount: 1,
          pendingAmount: 1,
          lastPayment: {
            $cond: [
              { $ne: ["$lastPayment", null] },
              { $dateToString: { format: "%Y-%m-%d", date: "$lastPayment" } },
              "",
            ],
          },
          status: {
            $cond: [{ $eq: ["$pendingAmount", 0] }, "paid", "pending"],
          },
        },
      },
      // Sort results
      {
        $sort: {
          class: 1,
          section: 1,
          studentName: 1,
        },
      },
    );

    const reportData = await Fee.aggregate(pipeline);

    // Calculate summary statistics
    const summary = {
      totalStudents: reportData.length,
      totalExpected: reportData.reduce(
        (sum, record) => sum + (record.totalFee || 0),
        0,
      ),
      totalCollected: reportData.reduce(
        (sum, record) => sum + (record.paidAmount || 0),
        0,
      ),
      totalPending: reportData.reduce(
        (sum, record) => sum + (record.pendingAmount || 0),
        0,
      ),
    };

    // Calculate collection percentage
    summary.collectionPercentage =
      summary.totalExpected > 0
        ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: reportData,
      summary: summary,
    });
  } catch (error) {
    console.error("Error generating class section report:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Generate Individual Student Report
export const getStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId })
      .populate(
        "studentId",
        "img studentName fatherName mPhoneNumber rollNumber class section",
      )
      .sort({ year: -1, month: -1 });

    if (!fees || fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No fee records found for this student",
      });
    }

    const totalFee = fees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const paidAmount = fees
      .filter((fee) => fee.status === "paid")
      .reduce((sum, fee) => sum + fee.totalAmount, 0);
    const pendingAmount = totalFee - paidAmount;

    const paymentHistory = fees.map((fee) => ({
      month: fee.month,
      year: fee.year,
      amount: fee.totalAmount,
      dueDate: fee.dueDate?.toISOString().split("T")[0] || "",
      paidDate: fee.paidDate?.toISOString().split("T")[0] || "",
      status: fee.status,
      challanId: fee._id,
    }));

    res.status(200).json({
      success: true,
      data: {
        student: fees[0].studentId,
        summary: {
          totalFee,
          paidAmount,
          pendingAmount,
          totalRecords: fees.length,
          paidRecords: fees.filter((fee) => fee.status === "paid").length,
          pendingRecords: fees.filter((fee) => fee.status !== "paid").length,
        },
        paymentHistory,
      },
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate Summary Report
export const getSummaryReport = async (req, res) => {
  try {
    const { year } = req.query;

    let matchConditions = {};
    if (year && year !== "all") {
      matchConditions.year = year.toString();
    }

    const pipeline = [
      ...(Object.keys(matchConditions).length > 0
        ? [{ $match: matchConditions }]
        : []),
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $ne: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
          totalStudents: { $addToSet: "$studentId" },
          paidStudents: {
            $addToSet: {
              $cond: [{ $eq: ["$status", "paid"] }, "$studentId", null],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalExpected: 1,
          totalCollected: 1,
          totalPending: 1,
          totalStudents: { $size: "$totalStudents" },
          paidStudents: {
            $size: {
              $filter: {
                input: "$paidStudents",
                cond: { $ne: ["$$this", null] },
              },
            },
          },
          collectionPercentage: {
            $cond: [
              { $gt: ["$totalExpected", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalCollected", "$totalExpected"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ];

    const summaryResult = await Fee.aggregate(pipeline);
    const summary = summaryResult[0] || {
      totalExpected: 0,
      totalCollected: 0,
      totalPending: 0,
      totalStudents: 0,
      paidStudents: 0,
      collectionPercentage: 0,
    };

    // Get monthly breakdown
    const monthlyPipeline = [
      ...(Object.keys(matchConditions).length > 0
        ? [{ $match: matchConditions }]
        : []),
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          expected: { $sum: "$totalAmount" },
          collected: {
            $sum: {
              $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $ne: ["$status", "paid"] }, "$totalAmount", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          expected: 1,
          collected: 1,
          pending: 1,
          collectionPercentage: {
            $cond: [
              { $gt: ["$expected", 0] },
              {
                $round: [
                  {
                    $multiply: [{ $divide: ["$collected", "$expected"] }, 100],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { year: -1, month: -1 },
      },
    ];

    const monthlyData = await Fee.aggregate(monthlyPipeline);

    res.status(200).json({
      success: true,
      data: {
        summary,
        monthlyBreakdown: monthlyData,
      },
    });
  } catch (error) {
    console.error("Error generating summary report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Available Years from Fee Records
export const getAvailableYears = async (req, res) => {
  try {
    const years = await Fee.distinct("year");

    // Sort years in descending order and ensure they're strings
    const sortedYears = years
      .filter((year) => year) // Remove any null/undefined values
      .map((year) => year.toString())
      .sort((a, b) => Number(b) - Number(a));

    res.status(200).json({
      success: true,
      data: sortedYears,
    });
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Generate Daily Report
export const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required",
      });
    }

    // Parse the date and create start and end of day
    const reportDate = new Date(date);
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all paid fees for the specified date
    const pipeline = [
      {
        $match: {
          status: "paid",
          paidDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: "$student",
      },
      {
        $project: {
          studentId: "$student._id",
          studentName: "$student.studentName",
          rollNumber: "$student.rollNumber",
          class: "$student.class",
          section: "$student.section",
          amount: "$totalAmount",
          challanId: "$_id",
          paymentTime: "$paidDate",
          month: "$month",
          year: "$year",
        },
      },
      {
        $sort: {
          paymentTime: 1, // Sort by payment time ascending
        },
      },
    ];

    const dailyTransactions = await Fee.aggregate(pipeline);

    // Calculate summary statistics
    const totalCollected = dailyTransactions.reduce(
      (sum, transaction) => sum + (transaction.amount || 0),
      0,
    );

    // Get total expected for the day (all pending fees that were due on or before this date)
    const expectedPipeline = [
      {
        $match: {
          dueDate: { $lte: endOfDay },
          status: { $ne: "paid" },
        },
      },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalAmount" },
        },
      },
    ];

    const expectedResult = await Fee.aggregate(expectedPipeline);
    const totalExpected = expectedResult[0]?.totalExpected || 0;

    // Format the response
    const reportData = {
      date: date,
      totalExpected: totalExpected,
      totalCollected: totalCollected,
      totalPending: totalExpected,
      totalTransactions: dailyTransactions.length,
      students: dailyTransactions.map((transaction) => ({
        studentId: transaction.studentId,
        studentName: transaction.studentName,
        rollNumber: transaction.rollNumber,
        class: transaction.class,
        section: transaction.section,
        amount: transaction.amount,
        challanId: transaction.challanId.toString(),
        paymentTime: transaction.paymentTime.toISOString(),
        month: transaction.month,
        year: transaction.year,
      })),
    };

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating daily report:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get Daily Collection Summary for a Date Range (optional - for dashboard widgets)
export const getDailyCollectionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date parameters are required",
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          status: "paid",
          paidDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidDate" },
          },
          totalCollected: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          date: "$_id",
          totalCollected: 1,
          transactionCount: 1,
          _id: 0,
        },
      },
    ];

    const dailySummary = await Fee.aggregate(pipeline);

    // Calculate total for the period
    const periodTotal = dailySummary.reduce(
      (sum, day) => sum + day.totalCollected,
      0,
    );

    const totalTransactions = dailySummary.reduce(
      (sum, day) => sum + day.transactionCount,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        dailySummary,
        periodTotal,
        totalTransactions,
        averagePerDay:
          dailySummary.length > 0
            ? Math.round(periodTotal / dailySummary.length)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error generating daily collection summary:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Get Today's Collection Summary (for dashboard)
export const getTodayCollectionSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's collections
    const todayPipeline = [
      {
        $match: {
          status: "paid",
          paidDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$totalAmount" },
          transactionCount: { $sum: 1 },
          students: { $addToSet: "$studentId" },
        },
      },
    ];

    const todayResult = await Fee.aggregate(todayPipeline);
    const todayData = todayResult[0] || {
      totalCollected: 0,
      transactionCount: 0,
      students: [],
    };

    // Get yesterday's collections for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const yesterdayPipeline = [
      {
        $match: {
          status: "paid",
          paidDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$totalAmount" },
        },
      },
    ];

    const yesterdayResult = await Fee.aggregate(yesterdayPipeline);
    const yesterdayTotal = yesterdayResult[0]?.totalCollected || 0;

    // Calculate percentage change
    const percentageChange =
      yesterdayTotal > 0
        ? Math.round(
            ((todayData.totalCollected - yesterdayTotal) / yesterdayTotal) *
              100,
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        date: today.toISOString().split("T")[0],
        totalCollected: todayData.totalCollected,
        transactionCount: todayData.transactionCount,
        uniqueStudents: todayData.students.length,
        yesterdayTotal: yesterdayTotal,
        percentageChange: percentageChange,
        averagePerTransaction:
          todayData.transactionCount > 0
            ? Math.round(todayData.totalCollected / todayData.transactionCount)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error generating today's collection summary:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Submit Partial Payment
export const submitPartialPayment = async (req, res) => {
  try {
    const {
      studentId,
      selectedFeeIds,
      partialAmount,
      lateFees = {},
    } = req.body;

    // Validation
    if (
      !studentId ||
      !selectedFeeIds ||
      !Array.isArray(selectedFeeIds) ||
      selectedFeeIds.length === 0 ||
      !partialAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Student ID, fee IDs array, and partial amount are required",
      });
    }

    const amount = parseFloat(partialAmount);
    if (amount <= 0 || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Partial amount must be a valid number greater than 0",
      });
    }

    // Convert string IDs to ObjectIds if needed
    const validObjectIds = [];
    for (const id of selectedFeeIds) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          validObjectIds.push(new mongoose.Types.ObjectId(id));
        }
      } catch (error) {
        console.error(`Invalid fee ID: ${id}`);
      }
    }

    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fee IDs provided",
      });
    }

    // Get selected fees first
    const selectedFees = await Fee.find({
      _id: { $in: validObjectIds },
      studentId: studentId,
      status: { $in: ["pending", "overdue"] },
    });

    // Sort manually to ensure proper FIFO (oldest first)
    selectedFees.sort((a, b) => {
      // First sort by year
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      // Then sort by month (convert month names to numbers)
      const months = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
      };

      const monthA = months[a.month] || 0;
      const monthB = months[b.month] || 0;
      if (monthA !== monthB) {
        return monthA - monthB;
      }

      // Finally sort by creation date as fallback
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    if (selectedFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid unpaid fees found for this student",
      });
    }

    // Calculate total outstanding amount including late fees
    let totalOutstanding = 0;
    const feeCalculations = [];

    for (const fee of selectedFees) {
      const feeIdString = fee._id.toString();
      const lateFee = lateFees[feeIdString] || 0;

      // Get current balance - if remainingBalance exists and is not null, use it; otherwise use totalAmount
      let currentBalance;
      if (fee.remainingBalance !== null && fee.remainingBalance !== undefined) {
        currentBalance = fee.remainingBalance;
      } else {
        currentBalance = fee.totalAmount;
      }

      const totalRequired = currentBalance + lateFee;
      totalOutstanding += totalRequired;

      feeCalculations.push({
        fee,
        lateFee,
        currentBalance,
        totalRequired,
        feeIdString,
      });
    }

    if (amount > totalOutstanding) {
      return res.status(400).json({
        success: false,
        message: `Partial amount (Rs. ${amount}) cannot exceed total outstanding amount (Rs. ${totalOutstanding})`,
        totalOutstanding: totalOutstanding,
      });
    }

    let remainingAmount = amount;
    const updatedFees = [];
    const paymentDetails = [];

    // Process payments in FIFO order (oldest first)
    for (const {
      fee,
      lateFee,
      currentBalance,
      totalRequired,
      feeIdString,
    } of feeCalculations) {
      if (remainingAmount <= 0) break;

      const paymentForThisFee = Math.min(remainingAmount, totalRequired);
      const newRemainingBalance = Math.max(
        0,
        totalRequired - paymentForThisFee,
      );
      const newStatus = newRemainingBalance <= 0 ? "paid" : "pending";

      // Prepare update data
      const updateData = {
        status: newStatus,
        remainingBalance: newRemainingBalance,
      };

      // Add late fee to miscFee if applicable
      if (lateFee > 0) {
        updateData.miscFee = fee.miscFee + lateFee;
        // Recalculate totalAmount with the late fee
        updateData.totalAmount =
          fee.tutionFee + fee.examFee + updateData.miscFee - fee.discount;
      }

      // Set payment date if fully paid
      if (newStatus === "paid") {
        updateData.paidDate = new Date();
        updateData.remainingBalance = 0;
      }

      // Update the fee record
      const updatedFee = await Fee.findByIdAndUpdate(fee._id, updateData, {
        new: true,
        runValidators: true,
      }).populate(
        "studentId",
        "img studentName fatherName mPhoneNumber rollNumber class section",
      );

      if (!updatedFee) {
        throw new Error(`Failed to update fee record ${fee._id}`);
      }

      updatedFees.push(updatedFee);

      paymentDetails.push({
        feeId: fee._id.toString(),
        month: fee.month,
        year: fee.year,
        originalAmount: fee.totalAmount,
        currentBalance: currentBalance,
        paidAmount: paymentForThisFee,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        lateFeeAdded: lateFee,
      });

      remainingAmount -= paymentForThisFee;
    }

    // Log the transaction for audit purposes
    console.log(
      `Partial payment processed: Student ${studentId}, Amount: ${amount}, Fees updated: ${updatedFees.length}`,
    );

    res.status(200).json({
      success: true,
      message: `Partial payment of Rs. ${amount} processed successfully`,
      data: {
        updatedFees,
        paymentDetails,
        totalPaid: amount,
        totalOutstanding: totalOutstanding,
        remainingAmount: totalOutstanding - amount,
      },
    });
  } catch (error) {
    console.error("Error processing partial payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing partial payment",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Please try again later",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// helper function to get partial payment summary
export const getPartialPaymentSummary = async (req, res) => {
  try {
    const { studentId, selectedFeeIds } = req.body;

    if (!studentId || !selectedFeeIds || !Array.isArray(selectedFeeIds)) {
      return res.status(400).json({
        success: false,
        message: "Student ID and fee IDs array are required",
      });
    }

    // Convert string IDs to ObjectIds
    const validObjectIds = selectedFeeIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const fees = await Fee.find({
      _id: { $in: validObjectIds },
      studentId: studentId,
      status: { $in: ["pending", "overdue"] },
    }).populate(
      "studentId",
      "img studentName fatherName mPhoneNumber rollNumber class section",
    );

    const summary = fees.map((fee) => ({
      id: fee._id.toString(),
      month: fee.month,
      year: fee.year,
      totalAmount: fee.totalAmount,
      remainingBalance: fee.remainingBalance || fee.totalAmount,
      status: fee.status,
      tutionFee: fee.tutionFee,
      examFee: fee.examFee,
      miscFee: fee.miscFee,
      discount: fee.discount,
    }));

    const totalOutstanding = summary.reduce(
      (sum, fee) => sum + fee.remainingBalance,
      0,
    );

    res.status(200).json({
      success: true,
      data: {
        student: fees[0]?.studentId,
        fees: summary,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error("Error getting partial payment summary:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============ GET ALL FEES (FOR INTERNAL OPERATIONS) ============
// This endpoint returns all fees without pagination for:
// - Submit Fee tab (needs to see all pending fees)
// - Generate Fee tab (needs to check existing challans)
// - Print operations (needs specific sets of challans)

export const getAllFeesInternal = async (req, res) => {
  try {
    const { status, studentId, excludeImages = "true" } = req.query;

    // Build match conditions
    const matchConditions = {};

    if (status && status !== "all") {
      matchConditions.status = status;
    }

    if (studentId) {
      matchConditions.studentId = new mongoose.Types.ObjectId(studentId);
    }

    // Use aggregation for performance
    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
    ];

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Project based on excludeImages flag
    if (excludeImages === "true") {
      pipeline.push({
        $project: {
          _id: 1,
          studentId: {
            _id: "$student._id",
            studentName: "$student.studentName",
            fatherName: "$student.fatherName",
            mPhoneNumber: "$student.mPhoneNumber",
            rollNumber: "$student.rollNumber",
            class: "$student.class",
            section: "$student.section",
            discountCode: "$student.discountCode",
            // Exclude img
          },
          month: 1,
          year: 1,
          tutionFee: 1,
          remainingBalance: 1,
          examFee: 1,
          miscFee: 1,
          arrears: 1,
          discount: 1,
          totalAmount: 1,
          dueDate: 1,
          status: 1,
          generatedDate: 1,
          paidDate: 1,
          sentToWhatsApp: 1,
        },
      });
    } else {
      // Include images for print
      pipeline.push({
        $project: {
          _id: 1,
          studentId: {
            _id: "$student._id",
            studentName: "$student.studentName",
            fatherName: "$student.fatherName",
            mPhoneNumber: "$student.mPhoneNumber",
            rollNumber: "$student.rollNumber",
            class: "$student.class",
            section: "$student.section",
            discountCode: "$student.discountCode",
            img: "$student.img",
          },
          month: 1,
          year: 1,
          tutionFee: 1,
          remainingBalance: 1,
          examFee: 1,
          miscFee: 1,
          arrears: 1,
          discount: 1,
          totalAmount: 1,
          dueDate: 1,
          status: 1,
          generatedDate: 1,
          paidDate: 1,
          sentToWhatsApp: 1,
        },
      });
    }

    // Sort by creation date
    pipeline.push({ $sort: { createdAt: -1 } });

    // Safety limit (max 50,000 records)
    pipeline.push({ $limit: 50000 });

    const fees = await Fee.aggregate(pipeline);

    // Transform data
    const transformedFees = fees.map((fee) => ({
      id: fee._id.toString(),
      studentId: {
        _id: fee.studentId._id.toString(),
        studentName: fee.studentId.studentName,
        fatherName: fee.studentId.fatherName,
        mPhoneNumber: fee.studentId.mPhoneNumber,
        rollNumber: fee.studentId.rollNumber,
        class: fee.studentId.class,
        section: fee.studentId.section,
        discountCode: fee.studentId.discountCode,
        img: fee.studentId.img || null,
      },
      month: fee.month,
      year: fee.year,
      tutionFee: fee.tutionFee,
      remainingBalance: fee.remainingBalance,
      examFee: fee.examFee,
      miscFee: fee.miscFee,
      arrears: fee.arrears,
      discount: fee.discount,
      totalAmount: fee.totalAmount,
      dueDate: fee.dueDate?.toISOString().split("T")[0] || "",
      status: fee.status,
      generatedDate: fee.generatedDate?.toISOString().split("T")[0] || "",
      paidDate: fee.paidDate?.toISOString().split("T")[0] || "",
      sentToWhatsApp: fee.sentToWhatsApp,
    }));

    res.status(200).json({
      success: true,
      data: transformedFees,
      count: transformedFees.length,
    });
  } catch (error) {
    console.error("Error in getAllFeesInternal:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET FEES FOR SPECIFIC STUDENTS ============
// Optimized endpoint for checking existing challans when generating fees
export const getFeesForStudents = async (req, res) => {
  try {
    const { studentIds, month, year } = req.body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: "studentIds array is required",
      });
    }

    const objectIds = studentIds.map((id) => new mongoose.Types.ObjectId(id));

    const matchConditions = {
      studentId: { $in: objectIds },
    };

    if (month) {
      matchConditions.month = month;
    }

    if (year) {
      matchConditions.year = year.toString();
    }

    // Use lean for better performance
    const fees = await Fee.find(matchConditions)
      .select(
        "studentId month year status totalAmount remainingBalance generatedDate"
      )
      .lean();

    // Create a map for quick lookup
    const feeMap = {};
    fees.forEach((fee) => {
      const key = `${fee.studentId}-${fee.month}-${fee.year}`;
      feeMap[key] = {
        id: fee._id.toString(),
        studentId: fee.studentId.toString(),
        month: fee.month,
        year: fee.year,
        status: fee.status,
        totalAmount: fee.totalAmount,
        remainingBalance: fee.remainingBalance,
        generatedDate: fee.generatedDate?.toISOString().split("T")[0] || "",
      };
    });

    res.status(200).json({
      success: true,
      data: feeMap,
      count: fees.length,
    });
  } catch (error) {
    console.error("Error in getFeesForStudents:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET UNIQUE GENERATED DATES ============
// For print dropdowns
export const getGeneratedDates = async (req, res) => {
  try {
    const cacheKey = "generated_dates";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    const dates = await Fee.distinct("generatedDate");

    // Format and sort dates
    const formattedDates = dates
      .filter(Boolean)
      .map((date) => new Date(date).toISOString().split("T")[0])
      .sort((a, b) => new Date(b) - new Date(a));

    cache.set(cacheKey, formattedDates, 300); // Cache for 5 minutes

    res.status(200).json({
      success: true,
      data: formattedDates,
    });
  } catch (error) {
    console.error("Error getting generated dates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};