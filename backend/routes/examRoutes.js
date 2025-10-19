import express from "express";
import {
  createExam,
  getAllExams,
  getExamById,
  getExamsByClass,
  updateExam,
  updateExamStatus,
  deleteExam,
  permanentlyDeleteExam,
  getExamStatistics,
  getAvailableAcademicYears,
} from "../controllers/examController.js";

const router = express.Router();

// Exam CRUD
router.post("/", createExam);
router.get("/", getAllExams);
router.get("/academic-years", getAvailableAcademicYears);
router.get("/:id", getExamById);
router.get("/:id/statistics", getExamStatistics);
router.get("/class/:class", getExamsByClass);
router.put("/:id", updateExam);
router.patch("/:id/status", updateExamStatus);
router.delete("/:id", deleteExam);
router.delete("/:id/permanent", permanentlyDeleteExam);

export default router;
