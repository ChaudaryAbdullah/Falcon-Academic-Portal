import express from "express";
import {
  createResult,
  getAllResults,
  bulkCreateResults,
  updateResult,
  bulkUpdateResults,
  getResultsByExamAndClass,
  getStudentResults,
  getResultById,
  calculatePositions,
  publishResults,
  unpublishResults,
  getClassPerformanceReport,
  getSubjectWisePerformance,
  getTopPerformers,
  deleteResult,
  bulkDeleteResults,
  calculateResults,
} from "../controllers/resultController.js";

const router = express.Router();

// Bulk operations (must come before /:id routes)
router.post("/bulk", bulkCreateResults);
router.post("/bulk-update", bulkUpdateResults);
router.post("/bulk-delete", bulkDeleteResults);

// Calculation and publishing routes
router.post(
  "/calculate-positions",

  calculatePositions
);
router.post("/publish", publishResults);
router.post("/unpublish", unpublishResults);

// Report routes (must come before /:id)
router.get("/exam-class", getResultsByExamAndClass);
router.get("/class-performance", getClassPerformanceReport);
router.get("/subject-performance", getSubjectWisePerformance);
router.get("/top-performers", getTopPerformers);

// Student-specific routes (must come before generic /:id)
router.get("/student/:studentId", getStudentResults);

// Generic CRUD routes (these should come LAST)
router.get("/", getAllResults);
router.post("/", createResult);
router.get("/:id", getResultById);
router.put("/:id", updateResult);
router.delete("/:id", deleteResult);

router.post("/calculate", calculateResults);
export default router;
