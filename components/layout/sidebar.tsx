"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Layers,
  Candy as Cards,
  CheckCircle,
  Youtube,
  Settings,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { UpgradePlanModal } from "@/components/modals/upgrade-plan-modal";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BookOpen },
  { name: "Collections", href: "/collections", icon: Layers },
  { name: "Flashcards", href: "/flashcards", icon: Cards },
  { name: "Quiz", href: "/quiz", icon: CheckCircle },
  { name: "YouTube Notes", href: "/youtube", icon: Youtube },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">Mindote</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sidebar-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-900 dark:hover:text-purple-100",
                  isCollapsed && "px-2"
                )}
              >
                <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        {/* Upgrade Plan Button */}
        <Button
          variant="default"
          onClick={() => setIsUpgradeModalOpen(true)}
          className={cn(
            "w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
            isCollapsed && "px-2"
          )}
        >
          <Sparkles className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Upgrade Plan"}
        </Button>

        {/* Settings Link */}
        <Link href="/settings">
          <Button
            variant={pathname === "/settings" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-sidebar-foreground",
              pathname === "/settings"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-900 dark:hover:text-purple-100",
              isCollapsed && "px-2"
            )}
          >
            <Settings className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Settings"}
          </Button>
        </Link>
      </div>

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        open={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
    </div>
  );
}
