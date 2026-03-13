"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  cn,
  getUserDisplayName,
  getUserAvatarUrl,
  getUserInitials,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Home,
  Layers,
  Candy as Cards,
  CheckCircle,
  Settings,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  FileText,
  Crown,
  GraduationCap,
  Dumbbell,
  LogOut,
  ChevronsUpDown,
  BookOpenText,
  PenLine,
} from "lucide-react";
import { DictionaryModal } from "@/components/modals/dictionary-modal";

import { useAuth } from "@/lib/auth";
import { getUserSubscriptions } from "@/app/actions/lemonsqueezy";
import { useTranslation } from "@/lib/i18n-provider";

// Navigation grouped by sections
const studySection = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
    color: "text-indigo-400",
  },
  {
    name: "Reading",
    href: "/reading",
    icon: FileText,
    color: "text-amber-400",
    badge: "NEW",
  },
  {
    name: "Writing",
    href: "/writing",
    icon: PenLine,
    color: "text-purple-400",
    badge: "NEW",
  },
  {
    name: "Practice",
    icon: Dumbbell,
    color: "text-pink-400",
    isGroup: true,
    children: [
      {
        name: "Flashcards",
        href: "/flashcards",
        icon: Cards,
        color: "text-pink-400",
      },
      {
        name: "Quiz",
        href: "/quiz",
        icon: CheckCircle,
        color: "text-green-400",
      },
    ],
  },
];

const librarySection = [
  {
    name: "Collections",
    href: "/collections",
    icon: Layers,
    color: "text-blue-400",
    badge: "AI",
  },
  {
    name: "Vocabulary",
    href: "/vocabulary",
    icon: GraduationCap,
    color: "text-teal-400",
  },
];

const accountSection = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-gray-400",
  },
];

interface SidebarProps {
  className?: string;
  onMobileClose?: () => void;
}

export function Sidebar({ className, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [practiceExpanded, setPracticeExpanded] = useState(true);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);

  // ✅ Initialize from cache immediately to avoid blocking render
  const [hasActiveSubscription, setHasActiveSubscription] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mindote-subscription-cache");
        if (cached) {
          const { active, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            return active;
          }
        }
      } catch {}
    }
    return false;
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("mindote-subscription-cache");
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            return false;
          }
        }
      } catch {}
    }
    return true;
  });
  const pathname = usePathname();

  useEffect(() => {
    checkSubscription();

    const handleSubscriptionUpdate = (event: CustomEvent) => {
      const subs = event.detail?.subscriptions || [];
      const now = new Date();
      const active = subs.some((sub: any) => {
        if (sub.status === "active" || sub.status === "on_trial") return true;
        if (sub.status === "cancelled" && sub.endsAt) {
          return new Date(sub.endsAt) > now;
        }
        return false;
      });
      setHasActiveSubscription(active);
      setSubscriptionLoading(false);
      try {
        localStorage.setItem(
          "mindote-subscription-cache",
          JSON.stringify({ active, timestamp: Date.now() }),
        );
      } catch {}
    };

    window.addEventListener(
      "subscription-updated",
      handleSubscriptionUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "subscription-updated",
        handleSubscriptionUpdate as EventListener,
      );
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const subscriptions = await getUserSubscriptions();
      const now = new Date();
      const active = subscriptions.some((sub: any) => {
        if (sub.status === "on_trial") return true;
        if (sub.status === "active") {
          // PayOS subscriptions: also verify endsAt since there's no auto-cancel webhook
          if (sub.provider === "payos" && sub.endsAt) {
            return new Date(sub.endsAt) > now;
          }
          return true;
        }
        // LemonSqueezy cancelled but paid period still running
        if (
          sub.status === "cancelled" &&
          sub.provider === "lemonsqueezy" &&
          sub.endsAt
        ) {
          return new Date(sub.endsAt) > now;
        }
        return false;
      });
      setHasActiveSubscription(active);
      try {
        localStorage.setItem(
          "mindote-subscription-cache",
          JSON.stringify({ active, timestamp: Date.now() }),
        );
      } catch {}
    } catch (error) {
      console.error("Failed to check subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Render a section title
  const renderSectionTitle = (title: string) => {
    if (isCollapsed) return <div className="h-4" />;
    return (
      <div className="px-6 pt-5 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
          {title}
        </span>
      </div>
    );
  };

  // Render a single nav item
  const renderNavItem = (item: any) => {
    // Handle grouped items (Practice)
    if (item.isGroup && item.children) {
      const isGroupActive = item.children.some(
        (child: any) => pathname === child.href,
      );
      return (
        <div key={item.name} className="space-y-1">
          <Button
            variant="ghost"
            onClick={() =>
              !isCollapsed && setPracticeExpanded(!practiceExpanded)
            }
            className={cn(
              "w-full transition-all duration-300 rounded-xl relative overflow-hidden",
              isGroupActive
                ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                : "hover:bg-blue-50 dark:hover:bg-white/[0.03] hover:translate-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
              isCollapsed
                ? "justify-center h-11 w-11 p-0"
                : "justify-start h-11 pl-6",
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-all duration-300 relative z-10",
                isGroupActive ? "text-[#3B82F6]" : item.color,
                !isCollapsed && "mr-3",
              )}
            />
            {!isCollapsed && (
              <>
                <span className="transition-all duration-300 font-medium relative z-10 flex-1 text-left text-[13px]">
                  {t(`sidebar.${item.name.toLowerCase()}`)}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    practiceExpanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </>
            )}
          </Button>

          {/* Children items */}
          {!isCollapsed && practiceExpanded && (
            <div className="ml-4 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700/50 pl-4">
              {item.children.map((child: any) => {
                const isChildActive = pathname === child.href;
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    prefetch={false}
                    onClick={() => onMobileClose?.()}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full transition-all duration-300 rounded-xl relative overflow-hidden justify-start h-10 pl-4",
                        isChildActive
                          ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 hover:bg-[#3B82F6] hover:text-white"
                          : "hover:bg-blue-50 dark:hover:bg-white/[0.03] hover:translate-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
                      )}
                    >
                      <child.icon
                        className={cn(
                          "h-4 w-4 transition-all duration-300 relative z-10 mr-2",
                          isChildActive ? "text-white" : child.color,
                        )}
                      />
                      <span className="transition-all duration-300 font-medium relative z-10 text-[13px] flex items-center gap-2">
                        {t(`sidebar.${child.name.toLowerCase()}`)}
                        {child.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#FFD93D] text-gray-900 rounded">
                            {t("sidebar.new")}
                          </span>
                        )}
                      </span>
                      {isChildActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Collapsed state */}
          {isCollapsed && (
            <div className="space-y-1">
              {item.children.map((child: any) => {
                const isChildActive = pathname === child.href;
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    prefetch={false}
                    onClick={() => onMobileClose?.()}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        "transition-all duration-300 rounded-xl relative overflow-hidden justify-center h-10 w-10 p-0",
                        isChildActive
                          ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 hover:bg-[#3B82F6] hover:text-white"
                          : "hover:bg-blue-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
                      )}
                    >
                      <child.icon
                        className={cn(
                          "h-4 w-4 transition-all duration-300",
                          isChildActive ? "text-white" : child.color,
                        )}
                      />
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular navigation items
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href!}
        prefetch={false}
        onClick={() => onMobileClose?.()}
      >
        <div
          className={cn(
            "group relative transition-all duration-300",
            isCollapsed ? "flex justify-center" : "",
          )}
        >
          <Button
            variant="ghost"
            className={cn(
              "w-full transition-all duration-300 rounded-xl relative overflow-hidden",
              isActive
                ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/30 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white"
                : "hover:bg-blue-50 dark:hover:bg-white/[0.03] hover:translate-x-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200",
              isCollapsed
                ? "justify-center h-11 w-11 p-0"
                : "justify-start h-11 pl-6",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-[#3B82F6]/10",
              )}
            />
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-all duration-300 relative z-10",
                isActive ? "text-white" : item.color,
                !isCollapsed && "mr-3",
              )}
            />
            {!isCollapsed && (
              <span
                className={cn(
                  "transition-all duration-300 font-medium relative z-10 flex items-center gap-2 text-[13px]",
                )}
              >
                {t(`sidebar.${item.name.toLowerCase().replace(/ /g, "")}`)}
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
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" />
            )}
          </Button>
        </div>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300 relative bg-sidebar",
        isCollapsed ? "w-20" : "w-72",
        className,
      )}
    >
      {/* Dark mode background */}
      <div
        className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0 transition-opacity duration-300"
        style={{ backgroundColor: "oklch(0.1 0.02 265)" }}
      />

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
            "flex h-auto py-4 items-center border-b border-sidebar-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-5",
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="relative w-[50px] h-[50px] rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm p-1.5">
                <Image
                  src="/logo.png"
                  alt="Mindote Logo"
                  width={50}
                  height={50}
                  priority
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/10 rounded-xl transition-all",
              isCollapsed ? "w-10 h-10 p-0" : "shrink-0",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation with Sections */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {/* STUDY Section */}
          {renderSectionTitle(t("sidebar.sectionStudy"))}
          <div className="space-y-1">
            {/* Dictionary Lookup Button — First item */}
            <Button
              variant="ghost"
              onClick={() => setDictionaryOpen(true)}
              className={cn(
                "w-full transition-all duration-300 rounded-xl relative overflow-hidden",
                "hover:bg-violet-500/10 dark:hover:bg-violet-500/10 text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-300",
                isCollapsed
                  ? "justify-center h-11 w-11 p-0"
                  : "justify-start h-11 pl-6",
              )}
            >
              <BookOpenText
                className={cn(
                  "h-[18px] w-[18px] transition-all duration-300 relative z-10 text-violet-400",
                  !isCollapsed && "mr-3",
                )}
              />
              {!isCollapsed && (
                <span className="transition-all duration-300 font-medium relative z-10 text-[13px]">
                  {t("sidebar.dictionary")}
                </span>
              )}
            </Button>
            {studySection.map((item) => renderNavItem(item))}
          </div>

          {/* LIBRARY Section */}
          {renderSectionTitle(t("sidebar.sectionLibrary"))}
          <div className="space-y-1">
            {librarySection.map((item) => renderNavItem(item))}
          </div>

          {/* ACCOUNT Section */}
          {renderSectionTitle(t("sidebar.sectionAccount"))}
          <div className="space-y-1">
            {accountSection.map((item) => renderNavItem(item))}
          </div>
        </nav>

        {/* Dictionary Modal */}
        <DictionaryModal
          open={dictionaryOpen}
          onOpenChange={setDictionaryOpen}
        />

        {/* Bottom Section - User Profile */}
        <div className="p-3 border-t border-sidebar-border">
          <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                  "hover:bg-blue-50 dark:hover:bg-white/[0.05] cursor-pointer",
                  isCollapsed ? "justify-center p-2" : "px-3 py-2.5",
                )}
              >
                <Avatar
                  className={cn(
                    "border-2 border-primary/20 shrink-0",
                    isCollapsed ? "h-9 w-9" : "h-9 w-9",
                  )}
                >
                  <AvatarImage
                    src={getUserAvatarUrl(user) || undefined}
                    alt={getUserDisplayName(user)}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getUserDisplayName(user)}
                      </p>
                      {!subscriptionLoading && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {hasActiveSubscription ? "Pro Plan ✦" : "Free Plan"}
                        </p>
                      )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align={isCollapsed ? "center" : "start"}
              sideOffset={8}
              className="w-64 p-2 rounded-xl shadow-xl"
            >
              {/* User info in popover */}
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>

              <div className="h-px bg-border mb-1" />

              {/* Upgrade / Premium button */}
              {!subscriptionLoading && (
                <button
                  onClick={() => {
                    setUserPopoverOpen(false);
                    router.push("/billing");
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    hasActiveSubscription
                      ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      : "text-primary hover:bg-primary/10",
                  )}
                >
                  {hasActiveSubscription ? (
                    <>
                      <Crown className="h-4 w-4" />
                      {t("sidebar.premiumActive")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {t("sidebar.upgradePlan")}
                    </>
                  )}
                </button>
              )}

              <div className="h-px bg-border my-1" />

              {/* Sign out */}
              <button
                onClick={() => {
                  setUserPopoverOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("sidebar.signOut")}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
