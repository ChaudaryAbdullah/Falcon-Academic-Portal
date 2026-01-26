import { useEffect, useState, useCallback, useRef } from "react";
import { apiService } from "../services/apiService";

/**
 * Hook for paginated data fetching with built-in optimization
 * @param fetchFn - Async function to fetch data
 * @param pageSize - Items per page
 * @param dependencies - Dependencies array for refetch
 */
export function usePaginatedData<T>(
  fetchFn: (page: number, limit: number) => Promise<T[]>,
  pageSize: number = 50,
  dependencies: any[] = [],
) {
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (page: number) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFn(page, pageSize);
        setData(result);
        setTotal(result.length);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFn, pageSize],
  );

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    refetch: () => fetchData(currentPage),
    total,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Hook for monitoring API request performance
 * Logs cache hits/misses and request times
 */
export function useApiMetrics() {
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
  });

  const requestStartTime = useRef(0);

  const logRequest = useCallback(
    (isCacheHit: boolean, responseTime: number) => {
      setMetrics((prev) => {
        const newTotal = prev.totalRequests + 1;
        const newCacheHits = prev.cacheHits + (isCacheHit ? 1 : 0);
        const newMisses = prev.cacheMisses + (isCacheHit ? 0 : 1);
        const newAvgTime =
          (prev.averageResponseTime * prev.totalRequests + responseTime) /
          newTotal;

        return {
          totalRequests: newTotal,
          cacheHits: newCacheHits,
          cacheMisses: newMisses,
          averageResponseTime: Math.round(newAvgTime),
        };
      });
    },
    [],
  );

  return {
    metrics,
    logRequest,
    cacheHitRate: metrics.totalRequests
      ? ((metrics.cacheHits / metrics.totalRequests) * 100).toFixed(2) + "%"
      : "0%",
  };
}
