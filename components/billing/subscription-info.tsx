"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  MoreVertical,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Crown,
  Clock,
} from "lucide-react";
import {
  getSubscriptionURLs,
  cancelSubscription as cancelSub,
  pauseSubscription,
  unpauseSubscription,
} from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { useTranslation } from "@/lib/i18n-provider";

import { enUS, vi, de, es, fr, it, ja, ko, pt, zhCN } from "date-fns/locale";

const locales: Record<string, any> = {
  en: enUS,
  vi: vi,
  de: de,
  es: es,
  fr: fr,
  it: it,
  ja: ja,
  ko: ko,
  pt: pt,
  zh: zhCN,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a subscription price based on provider.
 * - LemonSqueezy: price in cents → "$X.XX"
 * - PayOS: price in VND → "XX.XXX₫"
 */
function formatPrice(price: string, provider: string): string {
  const amount = parseInt(price, 10);
  if (isNaN(amount)) return price;

  if (provider === "payos") {
    return amount.toLocaleString("vi-VN") + "₫";
  }

  return "$" + (amount / 100).toFixed(2);
}

function isPayOS(sub: any): boolean {
  return sub?.provider === "payos";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubscriptionInfo() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const locale = locales[language] || enUS;

  const getIntervalText = (interval: string) => {
    if (interval === "month") return t("components.billing.perMonth");
    if (interval === "year") return t("components.billing.perYear");
    return interval;
  };

  const getStatusText = (status: string) => {
    if (status === "active" || status === "Active") return t("components.billing.active");
    if (status === "paused" || status === "Paused") return t("components.billing.paused");
    if (status === "cancelled" || status === "Cancelled") return t("components.billing.cancelled");
    if (status === "on_trial" || status === "On Trial") return t("components.billing.onTrial");
    return status;
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
        setUserName(
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          null
        );
      }
    };

    loadUserProfile();
    loadSubscriptions();

    const isFromCheckout =
      document.referrer.includes("lemonsqueezy") ||
      searchParams.get("checkout") === "success";

    if (isFromCheckout) {
      router.refresh();
      let retries = 0;
      const maxRetries = 5;
      const retryInterval = setInterval(async () => {
        retries++;
        await loadSubscriptions();
        if (retries >= maxRetries) clearInterval(retryInterval);
      }, 3000);

      return () => clearInterval(retryInterval);
    }
  }, [searchParams]);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch("/api/subscriptions", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" },
      });

      if (!response.ok) throw new Error("Failed to fetch subscriptions");

      const data = await response.json();
      const subs = data.subscriptions || [];
      setSubscriptions(subs);

      window.dispatchEvent(
        new CustomEvent("subscription-updated", { detail: { subscriptions: subs } })
      );
    } catch (error: any) {
      console.error("[SubscriptionInfo] Load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    router.refresh();
    await loadSubscriptions();
    toast({
      title: t("components.billing.refreshed"),
      description: t("components.billing.subscriptionStatusUpdated"),
    });
  };

  // ── LemonSqueezy-specific actions ──────────────────────────────────────────

  const handleManageBilling = async (subscriptionId: string) => {
    try {
      setActionLoading(true);
      const urls = await getSubscriptionURLs(subscriptionId);
      if (urls?.customer_portal) window.open(urls.customer_portal, "_blank");
    } catch {
      toast({
        title: t("components.billing.error"),
        description: t("components.billing.failedToOpenPortal"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm(t("components.billing.cancelConfirm"))) return;
    try {
      setActionLoading(true);
      await cancelSub(subscriptionId);
      toast({
        title: t("components.billing.success"),
        description: t("components.billing.subscriptionCancelled"),
      });
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: t("components.billing.error"),
        description: error.message || t("components.billing.failedToCancel"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseSubscription = async (subscriptionId: string, isPaused: boolean) => {
    try {
      setActionLoading(true);
      if (isPaused) {
        await unpauseSubscription(subscriptionId);
        toast({ title: t("components.billing.success"), description: t("components.billing.subscriptionResumed") });
      } else {
        await pauseSubscription(subscriptionId);
        toast({ title: t("components.billing.success"), description: t("components.billing.subscriptionPaused") });
      }
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: t("components.billing.error"),
        description: error.message || t("components.billing.failedToUpdate"),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const now = new Date();

  const activeSubscription = subscriptions.find((sub) => {
    if (sub.status === "active" || sub.status === "on_trial") {
      // PayOS: also gate on endsAt (no automatic status update from their side)
      if (sub.provider === "payos" && sub.endsAt) {
        return new Date(sub.endsAt) > now;
      }
      return true;
    }
    // LemonSqueezy cancelled-but-not-yet-expired
    if (sub.status === "cancelled" && sub.endsAt) {
      return new Date(sub.endsAt) > now;
    }
    return false;
  });

  if (!activeSubscription) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("components.billing.currentSubscription")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {t("components.billing.refresh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("components.billing.noActiveSubscription")}</h3>
            <p className="text-muted-foreground mb-4">{t("components.billing.noActiveSubscriptionDesc")}</p>
            <p className="text-xs text-muted-foreground">{t("components.billing.justPaidHint")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const payos = isPayOS(activeSubscription);
  const priceFormatted = formatPrice(activeSubscription.price, activeSubscription.provider);

  return (
    <Card className="border-green-500/50 bg-green-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {userAvatar && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={userName || "User"} />
                <AvatarFallback>{userName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
            )}
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {activeSubscription.plan.productName || t("components.billing.premiumPlan")}
            </span>
            <Badge variant="default" className="bg-green-600 dark:bg-green-500">
              {t("components.billing.active")}
            </Badge>
            {payos && (
              <Badge variant="outline" className="text-xs">PayOS</Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            {/* LemonSqueezy-only management menu */}
            {!payos && (
              <DropdownMenu>
                <DropdownMenuTrigger disabled={actionLoading}>
                  <span className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-primary/10 cursor-pointer">
                    <MoreVertical className="h-4 w-4" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50">
                  <DropdownMenuItem
                    onClick={() => handleManageBilling(activeSubscription.lemonSqueezyId)}
                    className="hover:bg-primary/10 focus:bg-primary/10 text-foreground cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("components.billing.manageBilling")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handlePauseSubscription(activeSubscription.lemonSqueezyId, activeSubscription.isPaused)}
                    className="text-foreground hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
                  >
                    {activeSubscription.isPaused
                      ? t("components.billing.resumeSubscription")
                      : t("components.billing.pauseSubscription")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCancelSubscription(activeSubscription.lemonSqueezyId)}
                    className="text-foreground hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
                  >
                    {t("components.billing.cancelSubscription")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status + Price row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t("components.billing.status")}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  activeSubscription.status === "active"
                    ? "default"
                    : activeSubscription.status === "on_trial"
                    ? "secondary"
                    : "outline"
                }
                className={activeSubscription.status === "active" ? "bg-green-600 dark:bg-green-500" : ""}
              >
                {payos ? t("components.billing.active") : getStatusText(activeSubscription.statusFormatted)}
              </Badge>
              {!payos && activeSubscription.isPaused && (
                <Badge variant="outline">{t("components.billing.paused")}</Badge>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("components.billing.price")}</p>
            <p className="text-2xl font-bold">
              {priceFormatted}
              <span className="text-sm font-normal text-muted-foreground">
                /{activeSubscription.plan.interval === "month"
                  ? t("components.billing.month")
                  : t("components.billing.year")}
              </span>
            </p>
          </div>
        </div>

        {/* LemonSqueezy: renews at */}
        {!payos && activeSubscription.renewsAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-green-500" />
            <span>
              <strong>{t("components.billing.renews")}:</strong>{" "}
              {format(new Date(activeSubscription.renewsAt), "PPP", { locale })}{" "}
              ({t("components.billing.inTime", {
                time: formatDistanceToNow(new Date(activeSubscription.renewsAt), { locale }),
              })})
            </span>
          </div>
        )}

        {/* PayOS: access until */}
        {payos && activeSubscription.endsAt && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>
              <strong>{t("components.billing.payosAccessUntil")}:</strong>{" "}
              {format(new Date(activeSubscription.endsAt), "PPP", { locale })}{" "}
              ({t("components.billing.inTime", {
                time: formatDistanceToNow(new Date(activeSubscription.endsAt), { locale }),
              })})
            </span>
          </div>
        )}

        {/* LemonSqueezy cancelled but not expired */}
        {!payos && activeSubscription.endsAt && activeSubscription.status === "cancelled" && (
          <div className="flex items-center gap-2 text-sm text-orange-500">
            <AlertCircle className="h-4 w-4" />
            <span>
              <strong>{t("components.billing.expires")}:</strong>{" "}
              {format(new Date(activeSubscription.endsAt), "PPP", { locale })}
            </span>
          </div>
        )}

        {/* LemonSqueezy trial */}
        {!payos && activeSubscription.trialEndsAt && activeSubscription.status === "on_trial" && (
          <div className="flex items-center gap-2 text-sm text-blue-500">
            <AlertCircle className="h-4 w-4" />
            <span>
              <strong>{t("components.billing.trialEnds")}:</strong>{" "}
              {format(new Date(activeSubscription.trialEndsAt), "PPP", { locale })}
            </span>
          </div>
        )}

        {/* PayOS: informational note about one-time payment */}
        {payos && (
          <p className="text-xs text-muted-foreground">
            {t("components.billing.payosOneTimeNote")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
