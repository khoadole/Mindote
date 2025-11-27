"use client";

import type React from "react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { GlobalSaveIndicator } from "@/components/global-save-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-2xl md:border md:border-border
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
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 rounded-none md:rounded-3xl bg-background md:bg-background/80 md:backdrop-blur-xl shadow-none md:shadow-2xl md:border md:border-border">
        <Topbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global cloud save indicator - bottom right */}
      <GlobalSaveIndicator />
    </div>
  );
}
