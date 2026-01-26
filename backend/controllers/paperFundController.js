import { paperFund } from "../models/paperFund.js";
import mongoose from "mongoose";

// Create PaperFund Record
export const createPaperFund = async (req, res) => {
  try {
    const record = await paperFund.create(req.body);
    const populated = await paperFund
      .findById(record._id)
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      );
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All PaperFund Records - OPTIMIZED
export const getPaperFunds = async (req, res) => {
  try {
    const funds = await paperFund
      .find({})
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const transformed = funds.map((fund) => ({
      id: fund._id.toString(),
      studentId: {
        _id: fund.studentId._id.toString(),
        studentName: fund.studentId.studentName,
        fatherName: fund.studentId.fatherName,
        mPhoneNumber: fund.studentId.mPhoneNumber,
        rollNumber: fund.studentId.rollNumber,
        class: fund.studentId.class,
        section: fund.studentId.section,
      },
      year: fund.year,
      paperFund: fund.paperFund,
      dueDate: fund.dueDate?.toISOString().split("T")[0] || "",
      status: fund.status,
      generatedDate: fund.generatedDate?.toISOString().split("T")[0] || "",
      paidDate: fund.paidDate?.toISOString().split("T")[0] || "",
      sentToWhatsApp: fund.sentToWhatsApp,
    }));

    res.status(200).json({ success: true, data: transformed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get PaperFund by ID
export const getPaperFundById = async (req, res) => {
  try {
    const fund = await paperFund
      .findById(req.params.id)
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      );
    if (!fund)
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    res.status(200).json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update PaperFund
export const updatePaperFund = async (req, res) => {
  try {
    const fund = await paperFund
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      );

    if (!fund)
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    res.status(200).json({ success: true, data: fund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete PaperFund Record
export const deletePaperFund = async (req, res) => {
  try {
    const fund = await paperFund.findByIdAndDelete(req.params.id);
    if (!fund)
      return res
        .status(404)
        .json({ success: false, message: "PaperFund record not found" });
    res
      .status(200)
      .json({ success: true, message: "PaperFund deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get PaperFund records by studentId
export const getPaperFundByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const funds = await paperFund
      .find({ studentId })
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      );

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

// Bulk Update PaperFund Status
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

    const validObjectIds = ids.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validObjectIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid IDs" });
    }

    const updateData = { status };
    if (status === "paid") updateData.paidDate = new Date();
    else if (status === "pending") updateData.paidDate = null;

    const result = await paperFund.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: updateData },
    );

    const updated = await paperFund
      .find({ _id: { $in: validObjectIds } })
      .populate(
        "studentId",
        "studentName fatherName mPhoneNumber rollNumber class section",
      );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} records to ${status}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Generate PaperFund Records
export const generateBulkPaperFund = async (req, res) => {
  try {
    const { challans } = req.body;

    if (!challans || !Array.isArray(challans) || challans.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No challans data provided",
      });
    }

    const createdChallans = [];
    const errors = [];

    for (let i = 0; i < challans.length; i++) {
      try {
        const challanData = challans[i];

        // Check if a paper fund record already exists for this student and year
        const existingRecord = await paperFund.findOne({
          studentId: challanData.studentId,
          year: challanData.year,
        });

        if (existingRecord) {
          errors.push({
            index: i,
            studentId: challanData.studentId,
            error: `Paper fund record already exists for year ${challanData.year}`,
          });
          continue;
        }

        // Create new paper fund record
        const newRecord = await paperFund.create(challanData);

        // Populate the student data for response
        const populatedRecord = await paperFund
          .findById(newRecord._id)
          .populate(
            "studentId",
            "studentName fatherName mPhoneNumber rollNumber class section",
          );

        // Transform to match frontend format
        const transformedRecord = {
          id: populatedRecord._id.toString(),
          studentId: {
            _id: populatedRecord.studentId._id.toString(),
            studentName: populatedRecord.studentId.studentName,
            fatherName: populatedRecord.studentId.fatherName,
            mPhoneNumber: populatedRecord.studentId.mPhoneNumber,
            rollNumber: populatedRecord.studentId.rollNumber,
            class: populatedRecord.studentId.class,
            section: populatedRecord.studentId.section || "",
          },
          year: populatedRecord.year,
          paperFund: populatedRecord.paperFund,
          dueDate: populatedRecord.dueDate?.toISOString().split("T")[0] || "",
          status: populatedRecord.status,
          generatedDate:
            populatedRecord.generatedDate?.toISOString().split("T")[0] || "",
          paidDate: populatedRecord.paidDate?.toISOString().split("T")[0] || "",
          sentToWhatsApp: populatedRecord.sentToWhatsApp,
        };

        createdChallans.push(transformedRecord);
      } catch (error) {
        errors.push({
          index: i,
          studentId: challans[i]?.studentId,
          error: error.message,
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
