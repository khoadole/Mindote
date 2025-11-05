"use client";

import type React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { GlobalSaveIndicator } from "@/components/global-save-indicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/10 overflow-hidden p-4 gap-4">
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

      {/* Sidebar Container - Bo tròn riêng */}
      <div className="relative z-10 content-rounded-lg overflow-hidden shadow-2xl">
        <Sidebar />
      </div>

      {/* Main Content Container - Bo tròn riêng */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 content-rounded-lg bg-background/80 backdrop-blur-xl shadow-2xl">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global cloud save indicator - bottom right */}
      <GlobalSaveIndicator />
    </div>
  );
}
