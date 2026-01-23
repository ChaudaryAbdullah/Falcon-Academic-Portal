import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentImage,
  upload,
  getStudentsPaginated,
  passOutStudent,
  strikeOffStudent,
  reactivateStudent,
  getStudentsByStatus,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/paginated", getStudentsPaginated);

//Create a new student with image upload
router.post("/", upload.single("image"), createStudent);

// Get all students
router.get("/", getStudents);

// Get a single student by ID
router.get("/:id", getStudentById);

//  Get student image by ID (optional direct image serving)
router.get("/:id/image", getStudentImage);

//  Update a student with optional image upload
router.put("/:id", upload.single("image"), updateStudent);

//  Delete a student
router.delete("/:id", deleteStudent);

// Pass Out and Strike Off
router.put("/:id/pass-out", passOutStudent);
router.put("/:id/strike-off", strikeOffStudent);
router.put("/:id/reactivate", reactivateStudent);
router.get("/status/:status", getStudentsByStatus);

export default router;
