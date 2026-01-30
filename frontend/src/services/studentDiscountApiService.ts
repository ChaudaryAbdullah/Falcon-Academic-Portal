// frontend/src/services/studentDiscountApiService.ts

import axios from "axios";
import { cacheManager } from "../utils/cacheManager";

const BACKEND = import.meta.env.VITE_BACKEND;

export interface StudentDiscount {
  _id: string;
  studentId: {
    _id: string;
    rollNumber: string;
    studentName: string;
    fatherName: string;
    mPhoneNumber: string;
    class: string;
    section?: string;
  };
  discount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startRecord: number;
  endRecord: number;
}

export interface DiscountApiResponse {
  success: boolean;
  data: StudentDiscount[];
  pagination: PaginationMeta;
}

export interface DiscountStats {
  totalDiscounts: number;
  totalAmount: number;
  averageDiscount: number;
  minDiscount: number;
  maxDiscount: number;
}

class StudentDiscountApiService {
  private baseUrl = `${BACKEND}/api/student-discounts`;
  private cacheTTL = 3 * 60 * 1000; // 3 minutes

  /**
   * Get all discounts (cached) - for client-side filtering
   */
  async getAllDiscounts(forceRefresh = false): Promise<StudentDiscount[]> {
    const cacheKey = "student_discounts";

    // Check cache
    if (!forceRefresh) {
      const cached = cacheManager.get<StudentDiscount[]>(cacheKey);
      if (cached) {
        console.log("✅ Cache hit: student_discounts");
        return cached;
      }
    }

    try {
      console.log("📡 Fetching all discounts from API...");
      const response = await axios.get(this.baseUrl, {
        withCredentials: true,
      });

      const data = response.data || [];
      
      // Cache the results
      cacheManager.set(cacheKey, data, this.cacheTTL);
      
      return data;
    } catch (error) {
      console.error("Error fetching discounts:", error);
      
      // Return stale cache on error
      const staleCache = cacheManager.get<StudentDiscount[]>(cacheKey);
      if (staleCache) {
        console.warn("⚠️ Returning stale cache due to error");
        return staleCache;
      }
      
      throw error;
    }
  }

  /**
   * Get paginated discounts (server-side pagination)
   */
  async getPaginatedDiscounts(
    params: PaginationParams = {}
  ): Promise<DiscountApiResponse> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

    try {
      const response = await axios.get(
        `${this.baseUrl}/paginated?${queryParams.toString()}`,
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching paginated discounts:", error);
      throw error;
    }
  }

  /**
   * Get discount by student ID
   */
  async getDiscountByStudentId(studentId: string): Promise<StudentDiscount | null> {
    const cacheKey = `student_discount_${studentId}`;

    // Check cache
    const cached = cacheManager.get<StudentDiscount>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${studentId}`, {
        withCredentials: true,
      });

      const data = response.data.data;
      
      // Cache the result
      cacheManager.set(cacheKey, data, this.cacheTTL);
      
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get discount statistics
   */
  async getDiscountStats(): Promise<DiscountStats> {
    const cacheKey = "discount_stats";

    // Check cache
    const cached = cacheManager.get<DiscountStats>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/stats`, {
        withCredentials: true,
      });

      const data = response.data.data;
      
      // Cache for 5 minutes
      cacheManager.set(cacheKey, data, 5 * 60 * 1000);
      
      return data;
    } catch (error) {
      console.error("Error fetching discount stats:", error);
      throw error;
    }
  }

  /**
   * Create or update discount
   */
  async createOrUpdateDiscount(
    studentId: string,
    discount: number
  ): Promise<StudentDiscount> {
    try {
      const response = await axios.post(
        this.baseUrl,
        { studentId, discount },
        { withCredentials: true }
      );

      // Clear relevant caches
      this.clearCache();

      return response.data.data || response.data;
    } catch (error) {
      console.error("Error creating/updating discount:", error);
      throw error;
    }
  }

  /**
   * Delete discount
   */
  async deleteDiscount(discountId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${discountId}`, {
        withCredentials: true,
      });

      // Clear relevant caches
      this.clearCache();
    } catch (error) {
      console.error("Error deleting discount:", error);
      throw error;
    }
  }

  /**
   * Bulk create/update discounts
   */
  async bulkCreateDiscounts(
    discounts: Array<{ studentId: string; discount: number }>
  ): Promise<{ success: any[]; failed: any[] }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/bulk`,
        { discounts },
        { withCredentials: true }
      );

      // Clear relevant caches
      this.clearCache();

      return response.data.data;
    } catch (error) {
      console.error("Error bulk creating discounts:", error);
      throw error;
    }
  }

  /**
   * Clear all discount-related caches
   */
  clearCache(): void {
    cacheManager.delete("student_discounts");
    cacheManager.delete("discount_stats");
    cacheManager.invalidateByPrefix("student_discount_");
  }
}

export const studentDiscountApiService = new StudentDiscountApiService();
export default StudentDiscountApiService;