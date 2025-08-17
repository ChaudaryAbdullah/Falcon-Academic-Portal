import express from "express";
import {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  deleteFee,
  getFeeByStudentId,
  generateBulkFees,
  bulkUpdateFeeStatus,
  updateWhatsAppStatus,
} from "../controllers/feeController.js";

const router = express.Router();

// Basic CRUD operations
router.post("/", createFee);
router.get("/", getFees);
router.get("/:id", getFeeById);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

// Student specific routes
router.get("/student/:studentId", getFeeByStudentId);

// Bulk operations
router.post("/generate-bulk", generateBulkFees);
router.patch("/bulk-update", bulkUpdateFeeStatus);

// WhatsApp status update
router.patch("/:feeId/whatsapp", updateWhatsAppStatus);

export default router;
