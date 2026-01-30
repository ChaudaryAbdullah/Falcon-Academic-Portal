import express from "express";
import {
  createOrUpdateDiscount,
  getAllDiscounts,
  getAllDiscountsNoPagination,
  getDiscountByStudent,
  deleteDiscount,
  getDiscountStats,
  bulkCreateDiscounts,
} from "../controllers/studentDiscountController.js";
import { cacheMiddleware } from "../middleware/redisCache.js";

const router = express.Router();

// ============ GET ROUTES (WITH CACHING) ============

// GET all discounts with pagination (cached for 2 minutes)
router.get("/paginated", cacheMiddleware(120), getAllDiscounts);

// GET all discounts without pagination (cached for 3 minutes)
router.get("/", cacheMiddleware(180), getAllDiscountsNoPagination);

// GET discount statistics (cached for 5 minutes)
router.get("/stats", cacheMiddleware(300), getDiscountStats);

// GET discount by student ID (cached for 3 minutes)
router.get("/:studentId", cacheMiddleware(180), getDiscountByStudent);

// ============ POST/PUT/DELETE ROUTES (NO CACHING) ============

// POST: Create or update discount
router.post("/", createOrUpdateDiscount);

// POST: Bulk create/update discounts
router.post("/bulk", bulkCreateDiscounts);

// DELETE: Delete discount by document ID
router.delete("/:id", deleteDiscount);

export default router;