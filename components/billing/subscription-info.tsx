"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function SubscriptionInfo() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Helper function to translate interval
  const getIntervalText = (interval: string) => {
    if (interval === 'month') return t('components.billing.perMonth');
    if (interval === 'year') return t('components.billing.perYear');
    return interval;
  };

  // Helper function to translate status
  const getStatusText = (status: string) => {
    if (status === 'active' || status === 'Active') return t('components.billing.active');
    if (status === 'paused' || status === 'Paused') return t('components.billing.paused');
    if (status === 'cancelled' || status === 'Cancelled') return t('components.billing.cancelled');
    if (status === 'on_trial' || status === 'On Trial') return t('components.billing.onTrial');
    return status;
  };

  useEffect(() => {
    loadSubscriptions();

    // Auto-refresh khi vừa thanh toán xong (check URL params hoặc referrer)
    const isFromCheckout =
      document.referrer.includes("lemonsqueezy") ||
      searchParams.get("checkout") === "success";

    if (isFromCheckout) {
      // Force router refresh to bypass Next.js Router Cache
      router.refresh();
      // Retry loading a few times to wait for webhook processing
      let retries = 0;
      const maxRetries = 5;
      const retryInterval = setInterval(async () => {
        retries++;
        console.log(
          `[Billing] Retry ${retries}/${maxRetries} - checking for new subscription...`
        );
        await loadSubscriptions();

        if (retries >= maxRetries) {
          clearInterval(retryInterval);
        }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(retryInterval);
    }
  }, [searchParams]);

  const loadSubscriptions = async () => {
    try {
      // Use fetch API with cache: 'no-store' to bypass all Next.js caching
      const response = await fetch('/api/subscriptions', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      const data = await response.json();
      const subs = data.subscriptions || [];
      setSubscriptions(subs);
      console.log("[Billing] Loaded subscriptions:", subs.length);

      // Emit custom event để đồng bộ với PricingPlans component
      window.dispatchEvent(
        new CustomEvent("subscription-updated", {
          detail: { subscriptions: subs },
        })
      );
    } catch (error: any) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Force router refresh to bypass Next.js Router Cache
    router.refresh();
    await loadSubscriptions();
    toast({
      title: t('components.billing.refreshed'),
      description: t('components.billing.subscriptionStatusUpdated'),
    });
  };

  const handleManageBilling = async (subscriptionId: string) => {
    try {
      setActionLoading(true);
      const urls = await getSubscriptionURLs(subscriptionId);
      if (urls?.customer_portal) {
        window.open(urls.customer_portal, "_blank");
      }
    } catch (error: any) {
      toast({
        title: t('components.billing.error'),
        description: t('components.billing.failedToOpenPortal'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm(t('components.billing.cancelConfirm'))) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelSub(subscriptionId);
      toast({
        title: t('components.billing.success'),
        description: t('components.billing.subscriptionCancelled'),
      });
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: t('components.billing.error'),
        description: error.message || t('components.billing.failedToCancel'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePauseSubscription = async (
    subscriptionId: string,
    isPaused: boolean
  ) => {
    try {
      setActionLoading(true);
      if (isPaused) {
        await unpauseSubscription(subscriptionId);
        toast({
          title: t('components.billing.success'),
          description: t('components.billing.subscriptionResumed'),
        });
      } else {
        await pauseSubscription(subscriptionId);
        toast({
          title: t('components.billing.success'),
          description: t('components.billing.subscriptionPaused'),
        });
      }
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: t('components.billing.error'),
        description: error.message || t('components.billing.failedToUpdate'),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Filter active subscriptions (including cancelled but not yet expired)
  const now = new Date();
  console.log("[Billing] All subscriptions:", subscriptions);
  console.log("[Billing] Current time:", now.toISOString());
  
  const activeSubscription = subscriptions.find((sub) => {
    console.log("[Billing] Checking sub:", sub.id, "status:", sub.status, "endsAt:", sub.endsAt);
    if (sub.status === "active" || sub.status === "on_trial") {
      console.log("[Billing] Found active subscription:", sub.id);
      return true;
    }
    // Include cancelled subscriptions that haven't expired yet
    if (sub.status === "cancelled" && sub.endsAt) {
      const isValid = new Date(sub.endsAt) > now;
      console.log("[Billing] Cancelled sub valid:", isValid, "endsAt:", sub.endsAt);
      return isValid;
    }
    return false;
  });
  
  console.log("[Billing] Active subscription found:", activeSubscription ? activeSubscription.id : "none");

  if (!activeSubscription) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('components.billing.currentSubscription')}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {t('components.billing.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('components.billing.noActiveSubscription')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('components.billing.noActiveSubscriptionDesc')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('components.billing.justPaidHint')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/50 bg-green-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {activeSubscription.plan.productName || t('components.billing.premiumPlan')}
            </span>
            <Badge variant="default" className="bg-green-600 dark:bg-green-500">
              {t('components.billing.active')}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger disabled={actionLoading}>
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-primary/10 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem
                  onClick={() =>
                    handleManageBilling(activeSubscription.lemonSqueezyId)
                  }
                  className="hover:bg-primary/10 focus:bg-primary/10 text-foreground dark:text-white cursor-pointer"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('components.billing.manageBilling')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleCancelSubscription(activeSubscription.lemonSqueezyId)
                  }
                  className="text-primary hover:bg-primary/10 focus:bg-primary/10 hover:text-white focus:text-white cursor-pointer"
                >
                  {t('components.billing.cancelSubscription')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('components.billing.status')}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  activeSubscription.status === "active"
                    ? "default"
                    : activeSubscription.status === "on_trial"
                    ? "secondary"
                    : "outline"
                }
                className={
                  activeSubscription.status === "active"
                    ? "bg-green-600 dark:bg-green-500"
                    : ""
                }
              >
                {getStatusText(activeSubscription.statusFormatted)}
              </Badge>
              {activeSubscription.isPaused && (
                <Badge variant="outline">{t('components.billing.paused')}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t('components.billing.price')}</p>
            <p className="text-2xl font-bold">
              ${(parseInt(activeSubscription.price) / 100).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /{activeSubscription.plan.interval === 'month' ? t('components.billing.month') : t('components.billing.year')}
              </span>
            </p>
          </div>
        </div>

        {activeSubscription.renewsAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-green-500" />
            <span>
              <strong>{t('components.billing.renews')}:</strong>{" "}
              {format(new Date(activeSubscription.renewsAt), "PPP")} (
              {t('components.billing.inTime', { time: formatDistanceToNow(new Date(activeSubscription.renewsAt)) })}
              )
            </span>
          </div>
        )}

        {activeSubscription.endsAt &&
          activeSubscription.status === "cancelled" && (
            <div className="flex items-center gap-2 text-sm text-orange-500">
              <AlertCircle className="h-4 w-4" />
              <span>
                <strong>{t('components.billing.expires')}:</strong>{" "}
                {format(new Date(activeSubscription.endsAt), "PPP")}
              </span>
            </div>
          )}

        {activeSubscription.trialEndsAt &&
          activeSubscription.status === "on_trial" && (
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <AlertCircle className="h-4 w-4" />
              <span>
                <strong>{t('components.billing.trialEnds')}:</strong>{" "}
                {format(
                  new Date(activeSubscription.trialEndsAt),
                  "PPP"
                )}
              </span>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
