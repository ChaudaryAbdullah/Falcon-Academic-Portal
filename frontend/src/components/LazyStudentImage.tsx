// frontend/src/components/LazyStudentImage.tsx

import React, { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

interface LazyStudentImageProps {
  studentId: string;
  studentName: string;
  imageUrl: string | null | undefined;
  onLoadImage: (id: string) => void;
  className?: string;
  fallbackClassName?: string;
}

export const LazyStudentImage: React.FC<LazyStudentImageProps> = ({
  studentId,
  studentName,
  imageUrl,
  onLoadImage,
  className = "w-12 h-12 object-cover rounded-lg border",
  fallbackClassName = "w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center",
}) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Load image when it becomes visible
            if (!imageUrl && !imageError) {
              onLoadImage(studentId);
            }
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image is visible
        threshold: 0.01,
      },
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [studentId, imageUrl, onLoadImage, imageError]);

  return (
    <div ref={imgRef}>
      {isVisible && imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={`${studentName}'s photo`}
          className={className}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className={fallbackClassName}>
          {isVisible && !imageUrl && !imageError ? (
            <div className="animate-pulse">
              <User className="h-6 w-6 text-gray-400" />
            </div>
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
};
