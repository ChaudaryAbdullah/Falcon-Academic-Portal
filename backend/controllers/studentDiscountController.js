import { StudentDiscount } from "../models/studentDiscount.js";

// Create or update discount for a student
export const createOrUpdateDiscount = async (req, res) => {
  try {
    const { studentId, discount } = req.body;

    let discountDoc = await StudentDiscount.findOneAndUpdate(
      { studentId },
      { discount },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("studentId"); // 👈 ensure populate here

    res.status(200).json(discountDoc);
  } catch (error) {
    res.status(500).json({ message: "Error saving discount", error });
  }
};

// Get All Discounts
export const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await StudentDiscount.find().populate("studentId"); // 👈 populate
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching discounts", error });
  }
};

// Get discount by student ID
export const getDiscountByStudent = async (req, res) => {
  try {
    const discount = await StudentDiscount.findOne({
      studentId: req.params.studentId,
    }).populate("studentId");

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }

    res.json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  try {
    const discount = await StudentDiscount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }

    await discount.deleteOne();
    res.json({ message: "Discount deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
