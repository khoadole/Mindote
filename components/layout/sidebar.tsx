"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  BookOpen,
  Layers,
  Candy as Cards,
  CheckCircle,
  Youtube,
  Settings,
  Plus,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BookOpen },
  { name: "Collections", href: "/collections", icon: Layers },
  { name: "Flashcards", href: "/flashcards", icon: Cards },
  { name: "Quiz", href: "/quiz", icon: CheckCircle },
  { name: "YouTube Notes", href: "/youtube", icon: Youtube },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const collections = useAppStore((state) => state.collections);

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
          <h1 className="text-xl font-bold text-sidebar-foreground">
            WordFlow
          </h1>
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
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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

      {/* Collections */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-sidebar-foreground">
              Collections
            </h3>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {collections.slice(0, 5).map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full mr-2",
                      collection.color
                    )}
                  />
                  {collection.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
