"use client";

import type React from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useRequireAuth } from "@/hooks/use-auth-guard";
import { AuthLoadingSpinner } from "@/components/auth-loading";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";

/**
 * ⚡ PERFORMANCE OPTIMIZED: Dashboard Layout
 *
 * Changes:
 * - Uses client-side auth guard (no middleware blocking)
 * - Shows loading spinner during auth check
 * - Auth state cached by React Query (5min cache)
 *
 * Result: Instant navigation between dashboard pages
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isReadingPracticeFocus = pathname?.startsWith("/reading/practice/");

  // ⚡ Client-side auth check - cached for 5 minutes
  const { isLoading } = useRequireAuth();

  // Show loading spinner during initial auth check
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  if (isReadingPracticeFocus) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <main className="h-full overflow-y-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden p-0 md:p-3 gap-0 md:gap-3">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container - Bo tròn riêng */}
      <div
        className={`
          fixed md:relative z-50 md:z-10
          h-full md:h-auto
          transition-transform duration-300 ease-in-out
          rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-sm md:border md:border-border
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <Sidebar onMobileClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Main Content Container - Bo tròn riêng */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 rounded-none md:rounded-3xl bg-background shadow-none md:shadow-sm md:border md:border-border">
        <Topbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
