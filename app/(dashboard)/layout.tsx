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
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden p-0 md:p-6 gap-0 md:gap-6">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" } as React.CSSProperties}
        />
        <div
          className="absolute -bottom-40 left-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" } as React.CSSProperties}
        />
      </div>

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
          rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-2xl
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
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 rounded-none md:rounded-3xl bg-background md:bg-background/80 md:backdrop-blur-xl shadow-none md:shadow-2xl">
        <Topbar onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global cloud save indicator - bottom right */}
      <GlobalSaveIndicator />
    </div>
  );
}
