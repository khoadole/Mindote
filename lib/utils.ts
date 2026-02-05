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

/**
 * Get avatar URL from Supabase user object
 * Returns Google profile picture for OAuth users
 */
export function getUserAvatarUrl(user: User | null): string | null {
  if (!user) return null;

  // Try different metadata fields for avatar
  return (
    user.user_metadata?.avatar_url || // Google OAuth
    user.user_metadata?.picture || // Some OAuth providers
    null
  );
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: User | null): string {
  if (!user) return "?";

  const displayName = getUserDisplayName(user);
  const parts = displayName.split(" ");
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return displayName.slice(0, 2).toUpperCase();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, locale: string = "vi-VN"): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
