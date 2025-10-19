import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  getSubjectsByClass,
  updateSubject,
  deleteSubject,
  permanentlyDeleteSubject,
  bulkCreateSubjects,
  assignSubjectsToClass,
  getClassSubjects,
  getAllClassSubjectMappings,
  removeSubjectFromClass,
  deleteClassSubjectMapping,
} from "../controllers/subjectController.js";

const router = express.Router();

// Subject CRUD
router.post("/", createSubject);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.get("/class/:class", getSubjectsByClass);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);
router.delete("/:id/permanent", permanentlyDeleteSubject);

// Bulk Operations
router.post("/bulk-create", bulkCreateSubjects);

// Class Subject Mapping
router.post("/assign-to-class", assignSubjectsToClass);
router.get("/class-mapping", getClassSubjects);
router.get("/all-mappings", getAllClassSubjectMappings);
router.post("/remove-from-class", removeSubjectFromClass);
router.delete("/mapping/:id", deleteClassSubjectMapping);

export default router;
