import { FeeStructure } from "../models/feeStructure.js";

// Create new fee structure
export const createFeeStructure = async (req, res) => {
  try {
    const { className, tutionFee, examFee, paperFund, miscFee } = req.body;

    const exists = await FeeStructure.findOne({ className });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Fee structure for this class already exists" });
    }

    const feeStructure = await FeeStructure.create({
      className,
      tutionFee,
      examFee,
      paperFund,
      miscFee,
    });
    console.log(res);
    res.status(201).json(feeStructure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all fee structures
export const getFeeStructures = async (req, res) => {
  try {
    const feeStructures = await FeeStructure.find().sort({ createdAt: -1 });
    res.json(feeStructures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single fee structure by ID
export const getFeeStructureById = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id);
    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }
    res.json(feeStructure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update fee structure
export const updateFeeStructure = async (req, res) => {
  try {
    console.log(req.body);
    const feeStructure = await FeeStructure.findById(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    feeStructure.className = req.body.className;
    feeStructure.tutionFee = req.body.tutionFee;
    feeStructure.examFee = req.body.examFee;
    feeStructure.paperFund = req.body.paperFund;
    feeStructure.miscFee = req.body.miscFee;

    const updatedFeeStructure = await feeStructure.save();
    res.json(updatedFeeStructure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete fee structure
export const deleteFeeStructure = async (req, res) => {
  try {
    const feeStructure = await FeeStructure.findById(req.params.id);

    if (!feeStructure) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    await feeStructure.deleteOne();
    res.json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
