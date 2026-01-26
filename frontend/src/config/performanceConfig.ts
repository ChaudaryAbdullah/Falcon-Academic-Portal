/**
 * Performance Configuration
 * Centralized settings for all performance-related optimizations
 */

export const PERFORMANCE_CONFIG = {
  // Caching Configuration
  CACHE: {
    // Cache TTL (Time To Live) in milliseconds
    STUDENTS: 5 * 60 * 1000, // 5 minutes
    TEACHERS: 5 * 60 * 1000, // 5 minutes
    FEE_STRUCTURES: 10 * 60 * 1000, // 10 minutes
    STUDENT_DISCOUNTS: 5 * 60 * 1000, // 5 minutes
    FEE_CHALLANS: 2 * 60 * 1000, // 2 minutes
    PAPER_FUND_CHALLANS: 2 * 60 * 1000, // 2 minutes
    SUBJECTS: 15 * 60 * 1000, // 15 minutes
    EXAMS: 10 * 60 * 1000, // 10 minutes
    RESULTS: 5 * 60 * 1000, // 5 minutes
  },

  // Pagination Configuration
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    TEACHER_PAGE_SIZE: 20,
    STUDENT_PAGE_SIZE: 30,
    FEE_RECORDS_PAGE_SIZE: 25,
    RESULTS_PAGE_SIZE: 10,
  },

  // Debounce Configuration (in milliseconds)
  DEBOUNCE: {
    SEARCH: 300,
    FILTER: 400,
    INPUT: 250,
  },

  // API Request Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Polling Configuration
  POLLING: {
    OVERDUE_CHECK_INTERVAL: 10 * 60 * 1000, // 10 minutes for fee
    PAPER_FUND_CHECK_INTERVAL: 60 * 60 * 1000, // 60 minutes for paper fund
  },

  // Image Loading Configuration
  IMAGES: {
    LAZY_LOAD: true,
    BATCH_SIZE: 10, // Load images in batches of 10
    PLACEHOLDER_COLOR: "#e5e7eb", // Gray-200
  },

  // Performance Monitoring
  MONITORING: {
    ENABLE_METRICS: true,
    LOG_SLOW_REQUESTS: true,
    SLOW_REQUEST_THRESHOLD: 1000, // ms
  },

  // Memory Management
  MEMORY: {
    ENABLE_CACHE_CLEANUP: true,
    MAX_CACHE_SIZE: 100, // Max cache entries
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Get cache TTL for a specific data type
 */
export function getCacheTTL(
  dataType: "students" | "teachers" | "fees" | "results" | "exams",
): number {
  const ttlMap: Record<string, number> = {
    students: PERFORMANCE_CONFIG.CACHE.STUDENTS,
    teachers: PERFORMANCE_CONFIG.CACHE.TEACHERS,
    fees: PERFORMANCE_CONFIG.CACHE.FEE_CHALLANS,
    results: PERFORMANCE_CONFIG.CACHE.RESULTS,
    exams: PERFORMANCE_CONFIG.CACHE.EXAMS,
  };

  return ttlMap[dataType] || PERFORMANCE_CONFIG.CACHE.STUDENTS;
}

/**
 * Get page size for a specific component
 */
export function getPageSize(component: string): number {
  const pageSizeMap: Record<string, number> = {
    teachers: PERFORMANCE_CONFIG.PAGINATION.TEACHER_PAGE_SIZE,
    students: PERFORMANCE_CONFIG.PAGINATION.STUDENT_PAGE_SIZE,
    fees: PERFORMANCE_CONFIG.PAGINATION.FEE_RECORDS_PAGE_SIZE,
    results: PERFORMANCE_CONFIG.PAGINATION.RESULTS_PAGE_SIZE,
  };

  return (
    pageSizeMap[component] || PERFORMANCE_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE
  );
}

export default PERFORMANCE_CONFIG;
