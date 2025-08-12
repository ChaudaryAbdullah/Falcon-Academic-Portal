import express from "express";
import {
  createFee,
  getFees,
  getFeeById,
  updateFee,
  deleteFee,
  getFeeByStudentId,
} from "../controllers/feeController.js";

const router = express.Router();

router.post("/", createFee);
router.get("/", getFees);
router.get("/:id", getFeeById);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);
router.get("/student/:studentId", getFeeByStudentId);

export default router;
