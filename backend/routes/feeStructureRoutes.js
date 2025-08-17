import express from "express";
import {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
} from "../controllers/feeStructureController.js";

const router = express.Router();

// Routes
router.post("/", createFeeStructure); // Create
router.get("/", getFeeStructures); // Read all
router.get("/:id", getFeeStructureById); // Read one
router.put("/:id", updateFeeStructure); // Update
router.delete("/:id", deleteFeeStructure); // Delete

export default router;
