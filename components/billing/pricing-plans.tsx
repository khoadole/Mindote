"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  createOrUpdateSubscription,
  getUserSubscriptions,
} from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$7.99",
    period: "per month",
    variantId: parseInt(
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_MONTHLY || "1087650"
    ),
    features: [
      "Unlimited AI word fills",
      "Unlimited reading generation",
      "Advanced analytics & insights",
      "Early access to new features",
      "Priority support",
      "All core features included",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$71.88",
    pricePerMonth: "$5.99",
    period: "per year",
    variantId: parseInt(
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_YEARLY || "1087727"
    ),
    savings: "Save 25%",
    popular: true,
    features: [
      "Everything in Monthly",
      "Priority support",
      "Early access to beta features",
      "Exclusive community access",
      "Annual savings guarantee",
    ],
  },
];

interface ConfirmDialogState {
  open: boolean;
  targetPlan: (typeof PLANS)[0] | null;
  isUpgrade: boolean;
}

export function PricingPlans() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlanVariantId, setCurrentPlanVariantId] = useState<
    number | null
  >(null);
  const [activeSubscription, setActiveSubscription] = useState<any | null>(
    null
  );
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    targetPlan: null,
    isUpgrade: false,
  });
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    checkCurrentSubscription();

    // Lắng nghe event từ SubscriptionInfo khi subscription được cập nhật
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      console.log("[PricingPlans] Received subscription-updated event");
      const subs = event.detail?.subscriptions || [];

      // Filter active subscriptions
      const now = new Date();
      const activeSubscriptions = subs.filter((sub: any) => {
        if (sub.status === "active" || sub.status === "on_trial") {
          return true;
        }
        if (sub.status === "cancelled" && sub.endsAt) {
          return new Date(sub.endsAt) > now;
        }
        return false;
      });

      if (activeSubscriptions[0]?.plan?.variantId) {
        setCurrentPlanVariantId(activeSubscriptions[0].plan.variantId);
        setActiveSubscription(activeSubscriptions[0]);
      } else {
        setCurrentPlanVariantId(null);
        setActiveSubscription(null);
      }
      setSubscriptionsLoading(false);
    };

    window.addEventListener(
      "subscription-updated",
      handleSubscriptionUpdate as EventListener
    );

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
          `[PricingPlans] Retry ${retries}/${maxRetries} - checking for new subscription...`
        );
        await checkCurrentSubscription();

        if (retries >= maxRetries) {
          clearInterval(retryInterval);
        }
      }, 3000); // Check every 3 seconds

      return () => {
        clearInterval(retryInterval);
        window.removeEventListener(
          "subscription-updated",
          handleSubscriptionUpdate as EventListener
        );
      };
    }

    return () => {
      window.removeEventListener(
        "subscription-updated",
        handleSubscriptionUpdate as EventListener
      );
    };
  }, [searchParams]);

  const checkCurrentSubscription = async () => {
    try {
      const subscriptions = await getUserSubscriptions();

      // Filter active subscriptions (including cancelled but not yet expired)
      const now = new Date();
      const activeSubscriptions = subscriptions.filter((sub: any) => {
        if (sub.status === "active" || sub.status === "on_trial") {
          return true;
        }
        // Include cancelled subscriptions that haven't expired yet
        if (sub.status === "cancelled" && sub.endsAt) {
          return new Date(sub.endsAt) > now;
        }
        return false;
      });

      // Get the first active subscription (should be only one now)
      if (activeSubscriptions[0]?.plan?.variantId) {
        setCurrentPlanVariantId(activeSubscriptions[0].plan.variantId);
        setActiveSubscription(activeSubscriptions[0]);
      } else {
        // Reset state if no active subscription found
        setCurrentPlanVariantId(null);
        setActiveSubscription(null);
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!activeSubscription) return "";
    const endDate = activeSubscription.renewsAt || activeSubscription.endsAt;
    if (!endDate) return "";
    return formatDistanceToNow(new Date(endDate));
  };

  const getCurrentPlanName = () => {
    if (!currentPlanVariantId) return "";
    const plan = PLANS.find((p) => p.variantId === currentPlanVariantId);
    return plan?.name || "Current Plan";
  };

  const handlePlanClick = (plan: (typeof PLANS)[0]) => {
    // If current plan, do nothing
    if (currentPlanVariantId === plan.variantId) return;

    // If no active subscription (free user), go straight to checkout
    if (!activeSubscription) {
      handleSubscribe(plan.id, plan.variantId);
      return;
    }

    // User has active subscription - show confirmation dialog
    const isUpgrade = plan.id === "yearly";
    setConfirmDialog({
      open: true,
      targetPlan: plan,
      isUpgrade,
    });
  };

  const handleConfirmSwitch = async () => {
    if (!confirmDialog.targetPlan) return;
    setConfirmDialog({ open: false, targetPlan: null, isUpgrade: false });
    await handleSubscribe(
      confirmDialog.targetPlan.id,
      confirmDialog.targetPlan.variantId
    );
  };

  const handleSubscribe = async (planId: string, variantId: number) => {
    try {
      setLoadingPlan(planId);

      const result = await createOrUpdateSubscription(variantId, false);

      if (result.type === "url" && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Failed to process subscription");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getConfirmDialogContent = () => {
    if (!confirmDialog.targetPlan) return { title: "", description: "" };

    const remainingTime = getRemainingTime();
    const currentPlanName = getCurrentPlanName();
    const targetPlanName = confirmDialog.targetPlan.name;

    if (confirmDialog.isUpgrade) {
      // Monthly → Yearly (Upgrade)
      return {
        title: "Nâng cấp lên " + targetPlanName + "?",
        description: `Bạn đang sử dụng gói ${currentPlanName} (còn ${remainingTime}).

Nếu nâng cấp lên ${targetPlanName}:
• Gói ${currentPlanName} sẽ bị hủy ngay
• Gói ${targetPlanName} sẽ bắt đầu ngay lập tức
• Phần tiền còn lại sẽ được Lemon Squeezy tự động tính vào thanh toán

Bạn có chắc muốn nâng cấp?`,
      };
    } else {
      // Yearly → Monthly (Downgrade)
      return {
        title: "Chuyển sang " + targetPlanName + "?",
        description: `Bạn đang sử dụng gói ${currentPlanName} (còn ${remainingTime}).

Nếu chuyển sang ${targetPlanName}:
• Gói ${currentPlanName} sẽ bị hủy ngay
• Gói ${targetPlanName} sẽ bắt đầu ngay lập tức
• Bạn sẽ mất thời gian còn lại của gói ${currentPlanName}

Bạn có chắc muốn chuyển?`,
      };
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular
                ? "border-purple-500 shadow-lg shadow-purple-500/20"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {plan.savings && (
                  <Badge
                    variant="secondary"
                    className="text-green-600 dark:text-green-400"
                  >
                    {plan.savings}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.pricePerMonth && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Only {plan.pricePerMonth} per month
                  </p>
                )}
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan)}
                disabled={
                  loadingPlan === plan.id ||
                  currentPlanVariantId === plan.variantId
                }
                className={`w-full ${
                  currentPlanVariantId === plan.variantId
                    ? "bg-green-600 hover:bg-green-700"
                    : plan.popular
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    : ""
                }`}
              >
                {currentPlanVariantId === plan.variantId ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Current Plan
                  </>
                ) : loadingPlan === plan.id ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              {confirmDialog.isUpgrade ? "Nâng cấp" : "Chuyển gói"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
