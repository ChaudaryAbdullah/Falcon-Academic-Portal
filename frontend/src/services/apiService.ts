// frontend/src/services/apiService.ts

import axios, { type AxiosInstance } from "axios";
import { cacheManager } from "../utils/cacheManager";

const BACKEND = import.meta.env.VITE_BACKEND;

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  students: 5 * 60 * 1000, // 5 minutes
  teachers: 5 * 60 * 1000, // 5 minutes
  feeStructures: 10 * 60 * 1000, // 10 minutes (changes less frequently)
  studentDiscounts: 5 * 60 * 1000, // 5 minutes
  feeChallans: 2 * 60 * 1000, // 2 minutes (changes frequently)
  paperFundChallans: 2 * 60 * 1000, // 2 minutes
  subjects: 15 * 60 * 1000, // 15 minutes (rarely changes)
  exams: 10 * 60 * 1000, // 10 minutes
  results: 5 * 60 * 1000, // 5 minutes
};

interface FetchOptions {
  forceRefresh?: boolean;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BACKEND,
      withCredentials: true,
      timeout: 800000, // 8 min timeout
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message);
        throw error;
      },
    );
  }

  /**
   * Generic fetch with caching
   */
  private async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    options: FetchOptions = {},
  ): Promise<T> {
    const { forceRefresh = false } = options;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cacheManager.get<T>(key);
      if (cached !== null) {
        console.log(`Cache hit: ${key}`);
        return cached;
      }
    }

    console.log(`Cache miss: ${key}, fetching...`);

    try {
      const data = await fetchFn();
      cacheManager.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails but we have stale cache, return it
      const staleCache = cacheManager.get<T>(key);
      if (staleCache !== null) {
        console.warn(`Fetch failed, returning stale cache for: ${key}`);
        return staleCache;
      }
      throw error;
    }
  }

  /**
   * Strip heavy data (like images) for lighter caching
   */
  //   private stripHeavyData<T extends Record<string, any>>(
  //     data: T[],
  //     fieldsToRemove: string[] = ["img"],
  //   ): T[] {
  //     return data.map((item) => {
  //       const stripped = { ...item };
  //       fieldsToRemove.forEach((field) => {
  //         if (field in stripped) {
  //           delete stripped[field];
  //         }
  //       });
  //       return stripped;
  //     });
  //   }

  // ============ STUDENTS ============
  async getStudents(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "students",
      async () => {
        const res = await this.api.get("/api/students");
        return res.data.data || [];
      },
      CACHE_TTL.students,
      options,
    );
  }

  // For when you need students with images (not cached to avoid size issues)
  async getStudentsWithImages(): Promise<any[]> {
    const res = await this.api.get("/api/students");
    return res.data.data || [];
  }

  async createStudent(data: any): Promise<any> {
    const res = await this.api.post("/api/students", data);
    cacheManager.delete("students");
    return res.data;
  }

  async updateStudent(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/students/${id}`, data);
    cacheManager.delete("students");
    return res.data;
  }

  async deleteStudent(id: string): Promise<any> {
    const res = await this.api.delete(`/api/students/${id}`);
    cacheManager.delete("students");
    return res.data;
  }

  // ============ TEACHERS ============
  async getTeachers(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "teachers",
      async () => {
        const res = await this.api.get("/api/teachers");
        return res.data.data || [];
      },
      CACHE_TTL.teachers,
      options,
    );
  }

  async createTeacher(data: any): Promise<any> {
    const res = await this.api.post("/api/teachers", data);
    cacheManager.delete("teachers");
    return res.data;
  }

  async updateTeacher(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/teachers/${id}`, data);
    cacheManager.delete("teachers");
    return res.data;
  }

  async deleteTeacher(id: string): Promise<any> {
    const res = await this.api.delete(`/api/teachers/${id}`);
    cacheManager.delete("teachers");
    return res.data;
  }

  // ============ FEE STRUCTURES ============
  async getFeeStructures(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "feeStructures",
      async () => {
        const res = await this.api.get("/api/fee-structures");
        return res.data || [];
      },
      CACHE_TTL.feeStructures,
      options,
    );
  }

  async createFeeStructure(data: any): Promise<any> {
    const res = await this.api.post("/api/fee-structures", data);
    cacheManager.delete("feeStructures");
    return res.data;
  }

  async updateFeeStructure(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/fee-structures/${id}`, data);
    cacheManager.delete("feeStructures");
    return res.data;
  }

  async deleteFeeStructure(id: string): Promise<any> {
    const res = await this.api.delete(`/api/fee-structures/${id}`);
    cacheManager.delete("feeStructures");
    return res.data;
  }

  // ============ STUDENT DISCOUNTS ============
  async getStudentDiscounts(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "studentDiscounts",
      async () => {
        const res = await this.api.get("/api/student-discounts");
        return res.data || [];
      },
      CACHE_TTL.studentDiscounts,
      options,
    );
  }

  async createStudentDiscount(data: any): Promise<any> {
    const res = await this.api.post("/api/student-discounts", data);
    cacheManager.delete("studentDiscounts");
    return res.data;
  }

  async updateStudentDiscount(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/student-discounts/${id}`, data);
    cacheManager.delete("studentDiscounts");
    return res.data;
  }

  async deleteStudentDiscount(id: string): Promise<any> {
    const res = await this.api.delete(`/api/student-discounts/${id}`);
    cacheManager.delete("studentDiscounts");
    return res.data;
  }

  // ============ FEE CHALLANS ============
  async getFeeChallans(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "feeChallans",
      async () => {
        const res = await this.api.get("/api/fees");
        return res.data.data || [];
      },
      CACHE_TTL.feeChallans,
      options,
    );
  }

  async createFeeChallan(data: any): Promise<any> {
    const res = await this.api.post("/api/fees", data);
    cacheManager.delete("feeChallans");
    return res.data;
  }

  async updateFeeChallan(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/fees/${id}`, data);
    cacheManager.delete("feeChallans");
    return res.data;
  }

  async deleteFeeChallan(id: string): Promise<any> {
    const res = await this.api.delete(`/api/fees/${id}`);
    cacheManager.delete("feeChallans");
    return res.data;
  }

  // ============ PAPER FUND CHALLANS ============
  async getPaperFundChallans(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "paperFundChallans",
      async () => {
        const res = await this.api.get("/api/paperFund");
        return res.data.data || [];
      },
      CACHE_TTL.paperFundChallans,
      options,
    );
  }

  async createPaperFundChallan(data: any): Promise<any> {
    const res = await this.api.post("/api/paperFund", data);
    cacheManager.delete("paperFundChallans");
    return res.data;
  }

  async updatePaperFundChallan(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/paperFund/${id}`, data);
    cacheManager.delete("paperFundChallans");
    return res.data;
  }

  async deletePaperFundChallan(id: string): Promise<any> {
    const res = await this.api.delete(`/api/paperFund/${id}`);
    cacheManager.delete("paperFundChallans");
    return res.data;
  }

  // ============ SUBJECTS ============
  async getSubjects(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "subjects",
      async () => {
        const res = await this.api.get("/api/subjects", {
          params: { isActive: true },
        });
        return res.data.data || [];
      },
      CACHE_TTL.subjects,
      options,
    );
  }

  async createSubject(data: any): Promise<any> {
    const res = await this.api.post("/api/subjects", data);
    cacheManager.delete("subjects");
    return res.data;
  }

  async updateSubject(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/subjects/${id}`, data);
    cacheManager.delete("subjects");
    return res.data;
  }

  async deleteSubject(id: string): Promise<any> {
    const res = await this.api.delete(`/api/subjects/${id}`);
    cacheManager.delete("subjects");
    return res.data;
  }

  // ============ EXAMS ============
  async getExams(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "exams",
      async () => {
        const res = await this.api.get("/api/exams", {
          params: { isActive: true },
        });
        return res.data.data || [];
      },
      CACHE_TTL.exams,
      options,
    );
  }

  async createExam(data: any): Promise<any> {
    const res = await this.api.post("/api/exams", data);
    cacheManager.delete("exams");
    return res.data;
  }

  async updateExam(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/exams/${id}`, data);
    cacheManager.delete("exams");
    return res.data;
  }

  async deleteExam(id: string): Promise<any> {
    const res = await this.api.delete(`/api/exams/${id}`);
    cacheManager.delete("exams");
    return res.data;
  }

  // ============ RESULTS ============
  async getResults(options: FetchOptions = {}): Promise<any[]> {
    return this.fetchWithCache(
      "results",
      async () => {
        const res = await this.api.get("/api/results");
        return res.data.data || [];
      },
      CACHE_TTL.results,
      options,
    );
  }

  async createResult(data: any): Promise<any> {
    const res = await this.api.post("/api/results", data);
    cacheManager.delete("results");
    return res.data;
  }

  async updateResult(id: string, data: any): Promise<any> {
    const res = await this.api.put(`/api/results/${id}`, data);
    cacheManager.delete("results");
    return res.data;
  }

  async deleteResult(id: string): Promise<any> {
    const res = await this.api.delete(`/api/results/${id}`);
    cacheManager.delete("results");
    return res.data;
  }

  // ============ UTILITY METHODS ============

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    cacheManager.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Get the axios instance for custom requests
   */
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default ApiService;
