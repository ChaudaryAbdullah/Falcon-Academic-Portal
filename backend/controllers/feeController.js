import { Fee } from "../models/fee.js";
import { StudentDiscount } from "../models/studentDiscount.js";
import mongoose from "mongoose";

// Create Fee Record
export const createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    const populatedFee = await Fee.findById(fee._id).populate(
      "studentId",
      "studentName fatherName fPhoneNumber rollNumber"
    );
    res.status(201).json({ success: true, data: populatedFee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Fee Records
export const getFees = async (req, res) => {
  try {
    const fees = await Fee.find({})
      .populate("studentId", "studentName fatherName fPhoneNumber rollNumber")
      .sort({ createdAt: -1 });

    // Transform data to match frontend expectations
    const transformedFees = fees.map((fee) => ({
      id: fee._id.toString(),
      studentId: {
        _id: fee.studentId._id.toString(),
        studentName: fee.studentId.studentName,
        fatherName: fee.studentId.fatherName,
        fPhoneNumber: fee.studentId.fPhoneNumber,
        rollNumber: fee.studentId.rollNumber,
      },
      month: fee.month,
      year: fee.year,
      tutionFee: fee.tutionFee,
      paperFund: fee.paperFund,
      examFee: fee.examFee,
      miscFee: fee.miscFee,
      arrears: fee.arrears,
      discount: fee.discount,
      totalAmount: fee.totalAmount,
      dueDate: fee.dueDate?.toISOString().split("T")[0] || "",
      status: fee.status,
      generatedDate: fee.generatedDate?.toISOString().split("T")[0] || "",
      sentToWhatsApp: fee.sentToWhatsApp,
    }));

    res.status(200).json({ success: true, data: transformedFees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Calculate arrears for a student
const calculateArrears = async (studentId, currentMonth, currentYear) => {
  try {
    // Find all unpaid fees for this student
    const unpaidFees = await Fee.find({
      studentId: studentId,
      status: { $in: ["pending", "overdue"] },
      $or: [
        { year: { $lt: currentYear } },
        {
          year: currentYear,
          month: {
            $in: getMonthsBefore(currentMonth),
          },
        },
      ],
    });

    // Calculate total arrears
    const totalArrears = unpaidFees.reduce((sum, fee) => {
      return sum + (fee.totalAmount - fee.discount);
    }, 0);

    return Math.max(0, totalArrears);
  } catch (error) {
    console.error("Error calculating arrears:", error);
    return 0;
  }
};

// Helper function to get months before current month
const getMonthsBefore = (currentMonth) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentIndex = months.indexOf(currentMonth);
  return months.slice(0, currentIndex);
};

// Get student discount
const getStudentDiscount = async (studentId) => {
  try {
    const discountRecord = await StudentDiscount.findOne({ studentId });
    return discountRecord ? discountRecord.discount : 0;
  } catch (error) {
    console.error("Error fetching student discount:", error);
    return 0;
  }
};

// Generate Bulk Fee Challans with Discounts and Arrears
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

    for (const challanData of challans) {
      try {
        // Check if challan already exists
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
          continue;
        }

        // Calculate arrears for this student
        const arrears = await calculateArrears(
          challanData.studentId._id,
          challanData.month,
          challanData.year
        );

        // Get student discount
        const discount = await getStudentDiscount(challanData.studentId._id);

        // Create new fee challan with arrears and discount
        const feeData = {
          studentId: challanData.studentId._id,
          month: challanData.month,
          year: challanData.year,
          tutionFee: challanData.tutionFee || 0,
          paperFund: challanData.paperFund || 0,
          examFee: challanData.examFee || 0,
          miscFee: challanData.miscFee || 0,
          arrears: arrears,
          discount: discount,
          dueDate: new Date(challanData.dueDate),
          status: challanData.status || "pending",
          generatedDate: new Date(challanData.generatedDate || new Date()),
          sentToWhatsApp: challanData.sentToWhatsApp || false,
        };

        const newFee = await Fee.create(feeData);
        const populatedFee = await Fee.findById(newFee._id).populate(
          "studentId",
          "studentName fatherName fPhoneNumber rollNumber"
        );

        createdChallans.push(populatedFee);
      } catch (error) {
        errors.push({
          studentId: challanData.studentId?._id || "unknown",
          message: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Generated ${createdChallans.length} fee challans`,
      data: createdChallans,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Fee by ID
export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate(
      "studentId",
      "studentName fatherName fPhoneNumber rollNumber"
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

// Update Fee
export const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("studentId", "studentName fatherName fPhoneNumber rollNumber");

    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    res.status(200).json({ success: true, data: fee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete Fee Record
export const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee)
      return res
        .status(404)
        .json({ success: false, message: "Fee record not found" });
    res
      .status(200)
      .json({ success: true, message: "Fee record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get fee record by studentId
export const getFeeByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const fees = await Fee.find({ studentId }).populate(
      "studentId",
      "studentName fatherName fPhoneNumber rollNumber"
    );

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

// Bulk Update Fee Status
export const bulkUpdateFeeStatus = async (req, res) => {
  try {
    const { feeIds, status } = req.body;

    console.log("Received feeIds:", feeIds);
    console.log("Received status:", status);

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

    // Convert string IDs to ObjectIds, filtering out invalid ones
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

    console.log("Valid ObjectIds:", validObjectIds);
    console.log("Invalid IDs:", invalidIds);

    if (validObjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fee IDs provided",
        invalidIds: invalidIds,
      });
    }

    const updateData = { status: status };

    // If marking as paid, also update the payment date
    if (status === "paid") {
      updateData.paidDate = new Date();
    } else if (status === "pending") {
      // If marking as pending, clear the payment date
      updateData.paidDate = null;
    }

    // Update the fees
    const result = await Fee.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: updateData }
    );

    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No fee records found with the provided IDs",
      });
    }

    // Get the updated fees to return
    const updatedFees = await Fee.find({
      _id: { $in: validObjectIds },
    }).populate("studentId", "studentName fatherName fPhoneNumber rollNumber");

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

// Update fee sent to WhatsApp status
export const updateWhatsAppStatus = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { sentToWhatsApp } = req.body;

    const fee = await Fee.findByIdAndUpdate(
      feeId,
      { sentToWhatsApp: sentToWhatsApp },
      { new: true }
    ).populate("studentId", "studentName fatherName fPhoneNumber rollNumber");

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
