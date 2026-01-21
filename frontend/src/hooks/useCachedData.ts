// frontend/src/hooks/useCachedData.ts

import { useState, useEffect, useCallback } from "react";
import { cacheManager } from "../utils/cacheManager";

interface UseCachedDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  cacheTTL?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseCachedDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export function useCachedData<T>({
  cacheKey,
  fetchFn,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  enabled = true,
  onSuccess,
  onError,
}: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        if (!forceRefresh) {
          const cached = cacheManager.get<T>(cacheKey);
          if (cached) {
            console.log(`Cache hit for: ${cacheKey}`);
            setData(cached);
            setIsLoading(false);
            onSuccess?.(cached);
            return;
          }
        }

        // Fetch from API
        console.log(`Cache miss for: ${cacheKey}, fetching...`);
        const result = await fetchFn();

        // Update cache
        cacheManager.set(cacheKey, result, cacheTTL);

        // Update state
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error);
        console.error(`Error fetching ${cacheKey}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, fetchFn, cacheTTL, enabled, onSuccess, onError],
  );

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheManager.delete(cacheKey);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    error,
    refetch,
    clearCache,
  };
}

// Specialized hooks for common use cases
export function useStudents() {
  return useCachedData({
    cacheKey: "students",
    fetchFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/students`,
        {
          credentials: "include",
        },
      );
      const json = await response.json();
      return json.data || [];
    },
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeachers() {
  return useCachedData({
    cacheKey: "teachers",
    fetchFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/teachers`,
        {
          credentials: "include",
        },
      );
      const json = await response.json();
      return json.data || [];
    },
    cacheTTL: 15 * 60 * 1000, // 15 minutes (teachers change less frequently)
  });
}

export function useFeeStructures() {
  return useCachedData({
    cacheKey: "fee_structure",
    fetchFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/fee-structures`,
        {
          credentials: "include",
        },
      );
      const json = await response.json();
      return json || [];
    },
    cacheTTL: 60 * 60 * 1000, // 1 hour (very stable data)
  });
}
