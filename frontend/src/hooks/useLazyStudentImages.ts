// frontend/src/hooks/useLazyStudentImages.ts

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND;

interface ImageCache {
  [key: string]: string | null;
}

interface UseLazyStudentImagesReturn {
  images: ImageCache;
  loadImages: (ids: string[]) => Promise<void>;
  loadImage: (id: string) => Promise<void>;
  clearCache: () => void;
  isLoading: boolean;
}

export function useLazyStudentImages(): UseLazyStudentImagesReturn {
  const [images, setImages] = useState<ImageCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<ImageCache>({});
  const pendingRequests = useRef<Set<string>>(new Set());

  // Load single image
  const loadImage = useCallback(async (id: string) => {
    // Skip if already cached or currently loading
    if (cacheRef.current[id] || pendingRequests.current.has(id)) {
      return;
    }

    pendingRequests.current.add(id);

    try {
      const response = await axios.get(`${BACKEND}/api/students/${id}/image`, {
        responseType: "blob",
      });

      const imageUrl = URL.createObjectURL(response.data);

      cacheRef.current[id] = imageUrl;
      setImages((prev) => ({ ...prev, [id]: imageUrl }));
    } catch (error) {
      console.error(`Failed to load image for student ${id}:`, error);
      cacheRef.current[id] = null;
      setImages((prev) => ({ ...prev, [id]: null }));
    } finally {
      pendingRequests.current.delete(id);
    }
  }, []);

  // Load multiple images in batch
  const loadImages = useCallback(async (ids: string[]) => {
    // Filter out already cached or pending images
    const idsToLoad = ids.filter(
      (id) => !cacheRef.current[id] && !pendingRequests.current.has(id),
    );

    if (idsToLoad.length === 0) {
      return;
    }

    setIsLoading(true);
    idsToLoad.forEach((id) => pendingRequests.current.add(id));

    try {
      const response = await axios.post(
        `${BACKEND}/api/students/images/batch`,
        { ids: idsToLoad },
        { headers: { "Content-Type": "application/json" } },
      );

      if (response.data.success) {
        const newImages: ImageCache = {};

        Object.entries(response.data.data).forEach(
          ([id, imgData]: [string, any]) => {
            if (imgData && imgData.data) {
              const imageUrl = `data:${imgData.contentType};base64,${imgData.data}`;
              newImages[id] = imageUrl;
              cacheRef.current[id] = imageUrl;
            } else {
              newImages[id] = null;
              cacheRef.current[id] = null;
            }
          },
        );

        // Mark students without images as null
        idsToLoad.forEach((id) => {
          if (!newImages[id]) {
            newImages[id] = null;
            cacheRef.current[id] = null;
          }
        });

        setImages((prev) => ({ ...prev, ...newImages }));
      }
    } catch (error) {
      console.error("Failed to load batch images:", error);
      // Mark all as null on error
      const errorImages: ImageCache = {};
      idsToLoad.forEach((id) => {
        errorImages[id] = null;
        cacheRef.current[id] = null;
      });
      setImages((prev) => ({ ...prev, ...errorImages }));
    } finally {
      idsToLoad.forEach((id) => pendingRequests.current.delete(id));
      setIsLoading(false);
    }
  }, []);

  // Clear cache (useful when component unmounts)
  const clearCache = useCallback(() => {
    // Revoke all blob URLs to free memory
    Object.values(cacheRef.current).forEach((url) => {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    cacheRef.current = {};
    setImages({});
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(cacheRef.current).forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return {
    images,
    loadImages,
    loadImage,
    clearCache,
    isLoading,
  };
}
