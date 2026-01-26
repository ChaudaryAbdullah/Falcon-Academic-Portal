import express from "express";
import { cacheMiddleware } from "../middleware/cache.js";
import {
  createStudent,
  getStudents,
  getStudentsLight,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentImage,
  getBatchStudentImages,
  upload,
  getStudentsPaginated,
  passOutStudent,
  strikeOffStudent,
  reactivateStudent,
  getStudentsByStatus,
} from "../controllers/studentController.js";

const router = express.Router();

// Paginated endpoint WITHOUT images (fast)
router.get("/paginated", cacheMiddleware(30000), getStudentsPaginated);

// Get all students WITHOUT images (fast)
router.get("/", cacheMiddleware(30000), getStudents);

// Get students with lightweight data (hasImage flag only)
router.get("/light", cacheMiddleware(30000), getStudentsLight);

// Get single student WITH image
router.get("/:id", getStudentById);

// Get student image by ID (direct image serving)
router.get("/:id/image", getStudentImage);

// Batch get multiple student images (for lazy loading)
router.post("/images/batch", getBatchStudentImages);

// Create a new student with image upload
router.post("/", upload.single("image"), createStudent);

// Update a student with optional image upload
router.put("/:id", upload.single("image"), updateStudent);

// Delete a student
router.delete("/:id", deleteStudent);

// Pass Out and Strike Off
router.put("/:id/pass-out", passOutStudent);
router.put("/:id/strike-off", strikeOffStudent);
router.put("/:id/reactivate", reactivateStudent);
router.get("/status/:status", cacheMiddleware(30000), getStudentsByStatus);

export default router;
