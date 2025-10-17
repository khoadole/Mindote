"use client";

import { Cloud, CloudOff, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveStatus = "saved" | "saving" | "error" | "offline";

interface CloudSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  className?: string;
  showText?: boolean;
}

export function CloudSaveIndicator({
  status,
  lastSaved,
  className,
  showText = true,
}: CloudSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "saved":
        return {
          icon: Check,
          text: "Saved to cloud",
          color: "text-green-600 dark:text-green-400",
        };
      case "saving":
        return {
          icon: Loader2,
          text: "Saving...",
          color: "text-blue-600 dark:text-blue-400",
          animate: true,
        };
      case "error":
        return {
          icon: CloudOff,
          text: "Save failed",
          color: "text-red-600 dark:text-red-400",
        };
      case "offline":
        return {
          icon: CloudOff,
          text: "Offline - will sync later",
          color: "text-gray-600 dark:text-gray-400",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSaved.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity",
        className
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          config.animate && "animate-spin"
        )}
      />
      {showText && (
        <span className={cn("font-medium", config.color)}>
          {config.text}
          {status === "saved" && lastSaved && (
            <span className="ml-1 text-xs opacity-70">
              ({formatLastSaved()})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
