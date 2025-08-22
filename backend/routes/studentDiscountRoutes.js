import express from "express";
import {
  createOrUpdateDiscount,
  getAllDiscounts,
  getDiscountByStudent,
  deleteDiscount,
} from "../controllers/studentDiscountController.js";

const router = express.Router();

// POST or PUT: add/update discount
router.post("/", createOrUpdateDiscount);

// GET all discounts
router.get("/", getAllDiscounts);

// GET discount by studentId
router.get("/:studentId", getDiscountByStudent);

// DELETE discount by discount document ID
router.delete("/:id", deleteDiscount);

export default router;
