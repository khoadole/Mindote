"use client";

import { useEffect, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { CloudSaveIndicator } from "@/components/ui/cloud-save-indicator";
import { cn } from "@/lib/utils";

/**
 * Global save indicator that tracks ALL mutations in the app
 * Shows "Saving..." when any mutation is pending
 * Shows "Saved" when all mutations complete
 */
export function GlobalSaveIndicator({ className }: { className?: string }) {
  const isMutating = useIsMutating(); // Number of pending mutations
  const [lastSaved, setLastSaved] = useState<Date>();
  const [status, setStatus] = useState<"saved" | "saving">("saved");

  useEffect(() => {
    if (isMutating > 0) {
      setStatus("saving");
    } else if (isMutating === 0 && status === "saving") {
      setStatus("saved");
      setLastSaved(new Date());
    }
  }, [isMutating, status]);

  // Don't show if never saved anything
  if (!lastSaved && status === "saved") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "border rounded-lg shadow-lg px-3 py-2",
        className
      )}
    >
      <CloudSaveIndicator status={status} lastSaved={lastSaved} showText />
    </div>
  );
}
