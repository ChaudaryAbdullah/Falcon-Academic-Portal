// frontend/src/services/apiService.ts

import axios, { type AxiosInstance } from "axios";
import { cacheManager, CACHE_KEYS, CACHE_TTL } from "../utils/cacheManager";

const BACKEND = import.meta.env.VITE_BACKEND;

interface FetchOptions {
  useCache?: boolean;
  cacheTTL?: number;
  forceRefresh?: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BACKEND,
      withCredentials: true,
    });
  }

  // Generic fetch with caching
  private async fetchWithCache<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    options: FetchOptions = {},
  ): Promise<T> {
    const {
      useCache = true,
      cacheTTL = CACHE_TTL.MEDIUM,
      forceRefresh = false,
    } = options;

    // If force refresh, skip cache check
    if (!forceRefresh && useCache) {
      const cached = cacheManager.get<T>(cacheKey);
      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    console.log(`Cache miss: ${cacheKey}, fetching...`);
    const data = await fetchFn();

    if (useCache) {
      cacheManager.set(cacheKey, data, cacheTTL);
    }

    return data;
  }

  // Students API
  async getStudents(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.STUDENTS,
      async () => {
        const res = await this.api.get("/api/students");
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.MEDIUM },
    );
  }

  async createStudent(data: FormData) {
    const result = await this.api.post("/api/students", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Invalidate students cache
    cacheManager.delete(CACHE_KEYS.STUDENTS);
    return result.data.data;
  }

  async updateStudent(id: string, data: FormData) {
    const result = await this.api.put(`/api/students/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Invalidate students cache
    cacheManager.delete(CACHE_KEYS.STUDENTS);
    return result.data.data;
  }

  async deleteStudent(id: string) {
    await this.api.delete(`/api/students/${id}`);
    cacheManager.delete(CACHE_KEYS.STUDENTS);
  }

  // Teachers API
  async getTeachers(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.TEACHERS,
      async () => {
        const res = await this.api.get("/api/teachers");
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.LONG },
    );
  }

  async createTeacher(data: any) {
    const result = await this.api.post("/api/teachers", data);
    cacheManager.delete(CACHE_KEYS.TEACHERS);
    return result.data.data;
  }

  // Fee Structure API
  async getFeeStructures(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.FEE_STRUCTURE,
      async () => {
        const res = await this.api.get("/api/fee-structures");
        return res.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.VERY_LONG },
    );
  }

  async createFeeStructure(data: any) {
    const result = await this.api.post("/api/fee-structures", data);
    cacheManager.delete(CACHE_KEYS.FEE_STRUCTURE);
    return result.data;
  }

  async updateFeeStructure(id: string, data: any) {
    const result = await this.api.put(`/api/fee-structures/${id}`, data);
    cacheManager.delete(CACHE_KEYS.FEE_STRUCTURE);
    return result.data;
  }

  // Student Discounts API
  async getStudentDiscounts(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.STUDENT_DISCOUNTS,
      async () => {
        const res = await this.api.get("/api/student-discounts");
        return res.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.LONG },
    );
  }

  async createOrUpdateDiscount(data: any) {
    const result = await this.api.post("/api/student-discounts", data);
    cacheManager.delete(CACHE_KEYS.STUDENT_DISCOUNTS);
    return result.data;
  }

  // Fee Challans API
  async getFeeChallans(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.FEE_CHALLANS,
      async () => {
        const res = await this.api.get("/api/fees");
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.SHORT },
    );
  }

  async generateBulkFees(data: any) {
    const result = await this.api.post("/api/fees/generate-bulk", data);
    cacheManager.delete(CACHE_KEYS.FEE_CHALLANS);
    return result.data;
  }

  async updateFeeStatus(data: any) {
    const result = await this.api.patch("/api/fees/bulk-update", data);
    cacheManager.delete(CACHE_KEYS.FEE_CHALLANS);
    return result.data;
  }

  // Paper Fund API
  async getPaperFundChallans(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.PAPER_FUND_CHALLANS,
      async () => {
        const res = await this.api.get("/api/paperFund");
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.SHORT },
    );
  }

  async generateBulkPaperFund(data: any) {
    const result = await this.api.post("/api/paperFund/generate-bulk", data);
    cacheManager.delete(CACHE_KEYS.PAPER_FUND_CHALLANS);
    return result.data;
  }

  // Subjects API
  async getSubjects(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.SUBJECTS,
      async () => {
        const res = await this.api.get("/api/subjects", {
          params: { isActive: true },
        });
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.VERY_LONG },
    );
  }

  async createSubject(data: any) {
    const result = await this.api.post("/api/subjects", data);
    cacheManager.delete(CACHE_KEYS.SUBJECTS);
    return result.data.data;
  }

  // Exams API
  async getExams(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.EXAMS,
      async () => {
        const res = await this.api.get("/api/exams", {
          params: { isActive: true },
        });
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.LONG },
    );
  }

  async createExam(data: any) {
    const result = await this.api.post("/api/exams", data);
    cacheManager.delete(CACHE_KEYS.EXAMS);
    return result.data.data;
  }

  // Results API
  async getResults(options?: FetchOptions) {
    return this.fetchWithCache(
      CACHE_KEYS.RESULTS,
      async () => {
        const res = await this.api.get("/api/results");
        return res.data.data || [];
      },
      { ...options, cacheTTL: CACHE_TTL.SHORT },
    );
  }

  async bulkCreateResults(data: any) {
    const result = await this.api.post("/api/results/bulk", data);
    cacheManager.delete(CACHE_KEYS.RESULTS);
    return result.data;
  }

  // Utility: Clear all cache
  clearAllCache() {
    cacheManager.clear();
  }

  // Utility: Refresh specific cache
  async refreshCache(key: string) {
    const options = { forceRefresh: true };

    switch (key) {
      case CACHE_KEYS.STUDENTS:
        return this.getStudents(options);
      case CACHE_KEYS.TEACHERS:
        return this.getTeachers(options);
      case CACHE_KEYS.FEE_STRUCTURE:
        return this.getFeeStructures(options);
      case CACHE_KEYS.STUDENT_DISCOUNTS:
        return this.getStudentDiscounts(options);
      case CACHE_KEYS.FEE_CHALLANS:
        return this.getFeeChallans(options);
      case CACHE_KEYS.PAPER_FUND_CHALLANS:
        return this.getPaperFundChallans(options);
      case CACHE_KEYS.SUBJECTS:
        return this.getSubjects(options);
      case CACHE_KEYS.EXAMS:
        return this.getExams(options);
      case CACHE_KEYS.RESULTS:
        return this.getResults(options);
      default:
        throw new Error(`Unknown cache key: ${key}`);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
