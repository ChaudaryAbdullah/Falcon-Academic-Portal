// frontend/src/components/CacheStatus.tsx

import { useState, useEffect } from "react";
import { cacheManager } from "../utils/cacheManager";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Trash2, RefreshCw, Database } from "lucide-react";
import { toast } from "sonner";

export function CacheStatus() {
  const [stats, setStats] = useState({ size: 0, keys: [] as string[] });
  const [isOpen, setIsOpen] = useState(false);

  const updateStats = () => {
    const newStats = cacheManager.getStats();
    setStats(newStats);
  };

  useEffect(() => {
    updateStats();
    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    cacheManager.clear();
    updateStats();
    toast.success("All cache cleared");
  };

  const handleClearKey = (key: string) => {
    cacheManager.delete(key);
    updateStats();
    toast.success(`Cache cleared for: ${key}`);
  };

  const formatCacheKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 gap-2"
      >
        <Database className="h-4 w-4" />
        Cache ({stats.size})
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Status
          </CardTitle>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
            ✕
          </Button>
        </div>
        <CardDescription>
          {stats.size} cached item{stats.size !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.size === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No cached data
          </div>
        ) : (
          <>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {stats.keys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {formatCacheKey(key)}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleClearKey(key)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={updateStats}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
