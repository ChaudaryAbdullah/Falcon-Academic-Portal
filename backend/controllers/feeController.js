import { Fee } from "../models/fee.js";

// Create Fee Record
export const createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get All Fee Records
export const getFees = async (req, res) => {
  try {
    // Populate student info on each fee record
    const fees = await Fee.find({})
      .populate("studentId", "studentName fatherName phoneNumber") // fetch only needed fields
      .exec();

    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Fee by ID
export const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate("studentId");
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
    });
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

    const fees = await Fee.find({ studentId });

    if (!fees || fees.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee record found for this student." });
    }

    res.status(200).json(fees);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
