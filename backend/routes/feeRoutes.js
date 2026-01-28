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
  getClassSectionReport,
  getStudentReport,
  getSummaryReport,
  getAvailableYears,
  getDailyReport,
  getDailyCollectionSummary,
  getTodayCollectionSummary,
  submitPartialPayment,
  getFilterOptions,
  getChallanStats,
  getFeesForPrint,
  getPendingFees,
  // NEW ENDPOINTS
  getAllFeesInternal,
  getFeesForStudents,
  getGeneratedDates,
} from "../controllers/feeController.js";

const router = express.Router();

// ============ OPTIMIZED ROUTES ============

// Get paginated fees with filters (MAIN ENDPOINT - for ViewFee tab)
router.get("/", getFees);

// Get ALL fees for internal operations (Submit Fee, Generate Fee tabs)
// Use with caution - returns all records
router.get("/internal/all", getAllFeesInternal);

// Get fees for specific students (batch checking)
router.post("/internal/students", getFeesForStudents);

// Get unique generated dates (for print dropdowns)
router.get("/internal/dates", getGeneratedDates);

// Get filter options (months, years, statuses)
router.get("/filter-options", getFilterOptions);

// Get challan statistics
router.get("/stats", getChallanStats);

// Get fees for bulk printing (with images)
router.get("/print", getFeesForPrint);

// Get pending fees for a student
router.get("/pending/:studentId", getPendingFees);

// ============ BASIC CRUD OPERATIONS ============
router.post("/", createFee);
router.get("/:id", getFeeById);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

// ============ STUDENT SPECIFIC ROUTES ============
router.get("/student/:studentId", getFeeByStudentId);

// ============ BULK OPERATIONS ============
router.post("/generate-bulk", generateBulkFees);
router.patch("/bulk-update", bulkUpdateFeeStatus);

// ============ WHATSAPP STATUS UPDATE ============
router.patch("/:feeId/whatsapp", updateWhatsAppStatus);

// ============ UTILITY ROUTES ============
router.get("/available-years", getAvailableYears);

// ============ REPORT ROUTES ============
router.get("/reports/class-section", getClassSectionReport);
router.get("/reports/student/:studentId", getStudentReport);
router.get("/reports/summary", getSummaryReport);
router.get("/reports/daily", getDailyReport);
router.get("/reports/daily-summary", getDailyCollectionSummary);
router.get("/reports/today-summary", getTodayCollectionSummary);

// ============ PAYMENT ROUTES ============
router.post("/partial-payment", submitPartialPayment);

export default router;