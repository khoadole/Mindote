import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type User } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get display name from Supabase user object
 * Handles both email signup and OAuth providers (Google, etc.)
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest";

  // Try different metadata fields (OAuth providers use different keys)
  const displayName =
    user.user_metadata?.display_name || // Email signup
    user.user_metadata?.full_name || // Google OAuth
    user.user_metadata?.name || // Generic OAuth
    user.email?.split("@")[0] || // Fallback to email prefix
    "User";

  return displayName;
}
