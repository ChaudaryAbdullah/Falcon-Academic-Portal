// Add these routes to your paperFund routes file
import express from "express";
import {
  createPaperFund,
  getPaperFunds,
  getPaperFundById,
  updatePaperFund,
  deletePaperFund,
  getPaperFundByStudentId,
  bulkUpdatePaperFundStatus,
  generateBulkPaperFund, // Import the new method
} from "../controllers/paperFundController.js";

const router = express.Router();

// Existing routes
router.post("/", createPaperFund);
router.get("/", getPaperFunds);
router.get("/:id", getPaperFundById);
router.put("/:id", updatePaperFund);
router.delete("/:id", deletePaperFund);
router.get("/student/:studentId", getPaperFundByStudentId);
router.patch("/bulk-update", bulkUpdatePaperFundStatus);

// Add the new bulk generate route
router.post("/generate-bulk", generateBulkPaperFund);

export default router;
