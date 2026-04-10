"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const IDLE_FRAMES = [
  "/mascot/idle/idle_1.png",
  "/mascot/idle/idle_2.png",
  "/mascot/idle/idle_3.png",
  "/mascot/idle/idle_4.png",
] as const;

interface ChatbotMascotProps {
  size?: number;
  className?: string;
  alt?: string;
  animated?: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
}

function randomDelay(minDelayMs: number, maxDelayMs: number) {
  const span = Math.max(0, maxDelayMs - minDelayMs);
  return minDelayMs + Math.floor(Math.random() * (span + 1));
}

export function ChatbotMascot({
  size = 28,
  className,
  alt = "Mindote AI Mascot",
  animated = true,
  minDelayMs = 300,
  maxDelayMs = 700,
}: ChatbotMascotProps) {
  const [frameIndex, setFrameIndex] = useState(() =>
    animated ? Math.floor(Math.random() * IDLE_FRAMES.length) : 0
  );

  useEffect(() => {
    if (!animated) {
      setFrameIndex(0);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setFrameIndex((prev) => (prev + 1) % IDLE_FRAMES.length);
        scheduleNext();
      }, randomDelay(minDelayMs, maxDelayMs));
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [animated, minDelayMs, maxDelayMs]);

  return (
    <Image
      src={IDLE_FRAMES[frameIndex]}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-cover", className)}
      priority={false}
    />
  );
}
