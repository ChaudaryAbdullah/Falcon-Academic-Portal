import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentImage,
  upload,
} from "../controllers/studentController.js";

const router = express.Router();

// POST /api/students - Create a new student with image upload
router.post("/", upload.single("image"), createStudent);

// GET /api/students - Get all students
router.get("/", getStudents);

// GET /api/students/:id - Get a single student by ID
router.get("/:id", getStudentById);

// GET /api/students/:id/image - Get student image by ID (optional direct image serving)
router.get("/:id/image", getStudentImage);

// PUT /api/students/:id - Update a student with optional image upload
router.put("/:id", upload.single("image"), updateStudent);

// DELETE /api/students/:id - Delete a student
router.delete("/:id", deleteStudent);

export default router;
