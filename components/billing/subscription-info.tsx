"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  CheckCircle2,
  Loader2,
  RefreshCw,
  Crown,
} from "lucide-react";
import {
  getUserSubscriptions,
  getSubscriptionURLs,
  cancelSubscription as cancelSub,
  pauseSubscription,
  unpauseSubscription,
} from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

export function SubscriptionInfo() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadSubscriptions();

    // Auto-refresh khi vừa thanh toán xong (check URL params hoặc referrer)
    const isFromCheckout =
      document.referrer.includes("lemonsqueezy") ||
      searchParams.get("checkout") === "success";

    if (isFromCheckout) {
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
      const subs = await getUserSubscriptions();
      setSubscriptions(subs);
      console.log("[Billing] Loaded subscriptions:", subs.length);
    } catch (error: any) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptions();
    toast({
      title: "Refreshed",
      description: "Subscription status updated",
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
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelSub(subscriptionId);
      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
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
          title: "Success",
          description: "Subscription resumed successfully",
        });
      } else {
        await pauseSubscription(subscriptionId);
        toast({
          title: "Success",
          description: "Subscription paused successfully",
        });
      }
      await loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
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

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active" || sub.status === "on_trial"
  );

  if (activeSubscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Subscription</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No Active Subscription
            </h3>
            <p className="text-muted-foreground mb-4">
              You're currently on the free plan. Upgrade to unlock unlimited
              features!
            </p>
            <p className="text-xs text-muted-foreground">
              Just paid? Click refresh or wait a moment for your subscription to
              activate.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeSubscriptions.map((subscription) => (
        <Card
          key={subscription.id}
          className="border-green-500/50 bg-green-500/5"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {subscription.plan.productName || "Premium Plan"}
                </span>
                <Badge variant="default" className="bg-green-600 dark:bg-green-500">
                  Active
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
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={actionLoading}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        handleManageBilling(subscription.lemonSqueezyId)
                      }
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handlePauseSubscription(
                          subscription.lemonSqueezyId,
                          subscription.isPaused
                        )
                      }
                    >
                      {subscription.isPaused ? "Resume" : "Pause"} Subscription
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleCancelSubscription(subscription.lemonSqueezyId)
                      }
                      className="text-destructive"
                    >
                      Cancel Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      subscription.status === "active"
                        ? "default"
                        : subscription.status === "on_trial"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      subscription.status === "active" ? "bg-green-600 dark:bg-green-500" : ""
                    }
                  >
                    {subscription.statusFormatted}
                  </Badge>
                  {subscription.isPaused && (
                    <Badge variant="outline">Paused</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">
                  ${(parseInt(subscription.price) / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.plan.interval}
                  </span>
                </p>
              </div>
            </div>

            {subscription.renewsAt && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-green-500" />
                <span>
                  <strong>Renews:</strong>{" "}
                  {format(new Date(subscription.renewsAt), "MMMM d, yyyy")} (
                  {formatDistanceToNow(new Date(subscription.renewsAt), {
                    addSuffix: true,
                  })}
                  )
                </span>
              </div>
            )}

            {subscription.endsAt && subscription.status === "cancelled" && (
              <div className="flex items-center gap-2 text-sm text-orange-500">
                <AlertCircle className="h-4 w-4" />
                <span>
                  <strong>Expires:</strong>{" "}
                  {format(new Date(subscription.endsAt), "MMMM d, yyyy")}
                </span>
              </div>
            )}

            {subscription.trialEndsAt && subscription.status === "on_trial" && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <AlertCircle className="h-4 w-4" />
                <span>
                  <strong>Trial ends:</strong>{" "}
                  {format(new Date(subscription.trialEndsAt), "MMMM d, yyyy")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
