"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  ChevronRight,
  FileText,
  Crown,
  HelpCircle,
} from "lucide-react";

import { getUserSubscriptions } from "@/app/actions/lemonsqueezy";
import { useTranslation } from "@/lib/i18n-provider";
import { OnboardingModal } from "@/components/modals/onboarding-modal";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BookOpen,
    color: "text-indigo-400",
  },
  {
    name: "Collections",
    href: "/collections",
    icon: Layers,
    color: "text-blue-400",
    badge: "AI",
  },
  {
    name: "Flashcards",
    href: "/flashcards",
    icon: Cards,
    color: "text-pink-400",
  },
  { name: "Quiz", href: "/quiz", icon: CheckCircle, color: "text-green-400" },
  {
    name: "Reading",
    href: "/reading",
    icon: FileText,
    color: "text-amber-400",
    badge: "NEW",
  },
  {
    name: "YouTube Notes",
    href: "/youtube",
    icon: Youtube,
    color: "text-red-400",
  },
];

interface SidebarProps {
  className?: string;
  onMobileClose?: () => void;
}

export function Sidebar({ className, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    checkSubscription();

    // Lắng nghe event khi subscription được cập nhật từ billing page
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      console.log("[Sidebar] Received subscription-updated event");
      const subs = event.detail?.subscriptions || [];
      const now = new Date();

      // Check if there's any active subscription
      const active = subs.some((sub: any) => {
        if (sub.status === "active" || sub.status === "on_trial") {
          return true;
        }
        // Also check cancelled but still valid subscriptions
        if (sub.status === "cancelled" && sub.endsAt) {
          return new Date(sub.endsAt) > now;
        }
        return false;
      });

      setHasActiveSubscription(active);
      setSubscriptionLoading(false);
    };

    window.addEventListener(
      "subscription-updated",
      handleSubscriptionUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "subscription-updated",
        handleSubscriptionUpdate as EventListener
      );
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const subscriptions = await getUserSubscriptions();
      const active = subscriptions.some(
        (sub: any) => sub.status === "active" || sub.status === "on_trial"
      );
      setHasActiveSubscription(active);
    } catch (error) {
      console.error("Failed to check subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300 relative bg-sidebar",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      {/* Dark mode background - absolute positioned */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-300"
        style={{
          backgroundColor: "oklch(0.1 0.02 265)",
        }}
      />

      {/* Gradient overlay for depth - Light mode - REMOVED for pure white */}
      {/* <div
        className="absolute inset-0 pointer-events-none rounded-r-lg dark:opacity-0 opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to bottom, 
            rgb(255, 255, 255), 
            rgb(255, 255, 255), 
            rgba(255, 255, 255, 0.98)
          )`,
        }}
      /> */}

      {/* Gradient overlay for depth - Dark mode */}
      <div
        className="absolute inset-0 pointer-events-none rounded-r-lg dark:opacity-100 opacity-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to bottom, 
            oklch(0.1 0.02 265), 
            oklch(0.1 0.02 265), 
            oklch(0.1 0.02 265 / 0.95)
          )`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Logo */}
        <div
          className={cn(
            "flex h-auto py-4 items-center mb-4 border-b border-sidebar-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {/* Logo Section - Only show when expanded */}
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="relative w-[50px] h-[50px] rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-1.5">
                <Image
                  src="/logo.png"
                  alt="Mindote Logo"
                  width={50}
                  height={50}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Mindote
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("sidebar.tagline")}
                </p>
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-xl transition-all",
              isCollapsed ? "w-10 h-10 p-0" : "shrink-0"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onMobileClose?.()}
              >
                <div
                  className={cn(
                    "group relative transition-all duration-300",
                    isCollapsed ? "flex justify-center" : ""
                  )}
                >
                  {/* Active indicator removed - user request */}

                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full transition-all duration-300 rounded-xl relative overflow-hidden",
                      isActive
                        ? "bg-[#6365EF] text-white shadow-lg shadow-[#6365EF]/30 hover:bg-[#6365EF] hover:text-white dark:hover:bg-[#6365EF] dark:hover:text-white"
                        : "hover:bg-indigo-50 dark:hover:bg-white/[0.03] hover:translate-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
                      isCollapsed
                        ? "justify-center h-12 w-12 p-0"
                        : "justify-start h-12 pl-6"
                    )}
                  >
                    {/* Hover glow effect */}
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        "bg-[#6365EF]/10"
                      )}
                    />

                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300 relative z-10",
                        isActive ? "text-white" : item.color,
                        !isCollapsed && "mr-3"
                      )}
                    />
                    {!isCollapsed && (
                      <span
                        className={cn(
                          "transition-all duration-300 font-medium relative z-10 flex items-center gap-2"
                        )}
                      >
                        {t(
                          `sidebar.${item.name.toLowerCase().replace(/ /g, "")}`
                        )}
                        {item.badge === "AI" ? (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#FFD93D] text-gray-900 rounded">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        ) : (
                          item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFD93D] text-gray-900 rounded">
                              {t("sidebar.new")}
                            </span>
                          )
                        )}
                      </span>
                    )}

                    {/* Active shine effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                    )}
                  </Button>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 space-y-2 border-t border-white/10">
          {/* Help Button */}
          <Button
            variant="ghost"
            onClick={() => setShowOnboarding(true)}
            className={cn(
              "transition-all duration-300 rounded-xl",
              "hover:bg-indigo-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
              isCollapsed
                ? "justify-center h-10 w-10 p-0 mx-auto"
                : "justify-start h-10 w-full"
            )}
          >
            <HelpCircle
              className={cn(
                "h-5 w-5 transition-all duration-300",
                !isCollapsed && "mr-2"
              )}
            />
            {!isCollapsed && (
              <span className="transition-opacity duration-300 font-medium text-sm">
                {t("sidebar.help")}
              </span>
            )}
          </Button>

          {/* Upgrade Plan / Premium Status Button */}
          {!subscriptionLoading && (
            <>
              {hasActiveSubscription ? (
                <Link href="/billing">
                  <Button
                    variant="default"
                    className={cn(
                      "w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500",
                      "hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600",
                      "text-white font-medium shadow-lg shadow-amber-500/30 transition-all duration-300 rounded-xl",
                      "hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40",
                      isCollapsed
                        ? "justify-center h-12 w-12 p-0"
                        : "justify-start h-12"
                    )}
                  >
                    <Crown
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        !isCollapsed && "mr-2"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="transition-opacity duration-300">
                        {t("sidebar.premiumActive")}
                      </span>
                    )}
                  </Button>
                </Link>
              ) : (
                <Link href="/billing">
                  <Button
                    variant="default"
                    className={cn(
                      "w-full bg-gradient-to-r from-[#6365EF] to-[#7C7EF5] hover:from-[#5254E0] hover:to-[#6B6DE6]",
                      "text-white font-medium shadow-lg shadow-[#6365EF]/30 transition-all duration-300 rounded-xl",
                      "hover:scale-105 hover:shadow-xl hover:shadow-[#6365EF]/40",
                      isCollapsed
                        ? "justify-center h-12 w-12 p-0"
                        : "justify-start h-12"
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        !isCollapsed && "mr-2"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="transition-opacity duration-300">
                        {t("sidebar.upgradePlan")}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
            </>
          )}

          {/* Settings Link */}
          <Link href="/settings">
            <Button
              variant="ghost"
              className={cn(
                "w-full transition-all duration-300 rounded-xl",
                pathname === "/settings"
                  ? "bg-[#6365EF] text-white shadow-lg shadow-[#6365EF]/30 hover:bg-[#6365EF] hover:text-white dark:hover:bg-[#6365EF] dark:hover:text-white"
                  : "hover:bg-indigo-50 dark:hover:bg-white/[0.03] hover:translate-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
                isCollapsed
                  ? "justify-center h-12 w-12 p-0"
                  : "justify-start h-12"
              )}
            >
              <Settings
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  !isCollapsed && "mr-3"
                )}
              />
              {!isCollapsed && (
                <span className="transition-opacity duration-300 font-medium">
                  {t("sidebar.settings")}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        forceOpen={true}
      />
    </div>
  );
}
