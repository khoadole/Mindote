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
import { useTranslation } from "@/lib/i18n-provider";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$0",
    period: "forever",
    variantId: 0, // Free plan
    features: [
      "ai_reset_3_times", // AI features reset daily, 3 times
      "create_collections",
      "flashcards_quiz",
      "basic_vocabulary",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$2.99",
    period: "per month",
    variantId: parseInt(
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_MONTHLY || "1087650"
    ),
    features: [
      "unlimited_ai_fills",
      "unlimited_reading",
      "advanced_vocabulary",
      "early_access",
      "priority_support",
      "all_basic_features",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$17.88",
    pricePerMonth: "$1.49",
    period: "per year",
    variantId: parseInt(
      process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_YEARLY || "1087727"
    ),
    savings: "Save 50%",
    popular: true,
    features: [
      "unlimited_ai_fills",
      "unlimited_reading",
      "advanced_vocabulary",
      "early_access",
      "priority_support",
      "all_basic_features",
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
  const { t } = useTranslation();
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
        // Set to 0 (Basic plan) for free users
        setCurrentPlanVariantId(0);
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
        // Set to 0 (Basic plan) for free users
        setCurrentPlanVariantId(0);
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
    if (!currentPlanVariantId) return t('components.billing.basic');
    const plan = PLANS.find((p) => p.variantId === currentPlanVariantId);
    if (!plan) return t('components.billing.currentPlan');
    if (plan.id === 'basic') return t('components.billing.basic');
    if (plan.id === 'monthly') return t('components.billing.monthly');
    return t('components.billing.yearly');
  };

  const handlePlanClick = (plan: (typeof PLANS)[0]) => {
    // If current plan, do nothing
    if (currentPlanVariantId === plan.variantId) return;

    // If clicking Basic plan (free), do nothing as users can't downgrade to free
    if (plan.id === "basic") return;

    // If no active subscription (free user), go straight to checkout
    if (!activeSubscription || currentPlanVariantId === 0) {
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
        title: t('components.billing.error'),
        description:
          error.message || t('components.billing.failedToCheckout'),
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
    const targetPlanName = confirmDialog.targetPlan.id === 'monthly' 
      ? t('components.billing.monthly') 
      : t('components.billing.yearly');

    if (confirmDialog.isUpgrade) {
      // Monthly → Yearly (Upgrade)
      return {
        title: t('components.billing.upgradeDialog.upgradeTitle', { plan: targetPlanName }),
        description: `${t('components.billing.upgradeDialog.currentPlanInfo', { currentPlan: currentPlanName, remaining: remainingTime })}\n\n${t('components.billing.upgradeDialog.upgradeInfo', { currentPlan: currentPlanName, targetPlan: targetPlanName })}\n\n${t('components.billing.upgradeDialog.confirmUpgrade')}`,
      };
    } else {
      // Yearly → Monthly (Downgrade)
      return {
        title: t('components.billing.upgradeDialog.switchTitle', { plan: targetPlanName }),
        description: `${t('components.billing.upgradeDialog.currentPlanInfo', { currentPlan: currentPlanName, remaining: remainingTime })}\n\n${t('components.billing.upgradeDialog.switchInfo', { currentPlan: currentPlanName, targetPlan: targetPlanName })}\n\n${t('components.billing.upgradeDialog.confirmSwitch')}`,
      };
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col min-h-[550px] ${
              plan.popular
                ? "border-purple-500 shadow-lg shadow-purple-500/20"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {t('components.billing.mostPopular')}
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {plan.id === 'basic' && t('components.billing.basic')}
                  {plan.id === 'monthly' && t('components.billing.monthly')}
                  {plan.id === 'yearly' && t('components.billing.yearly')}
                </span>
                {plan.savings && (
                  <Badge
                    variant="secondary"
                    className="text-green-600 dark:text-green-400"
                  >
                    {t('components.billing.save25')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 space-y-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">
                    {plan.id === 'monthly' && t('components.billing.perMonth')}
                    {plan.id === 'yearly' && t('components.billing.perYear')}
                  </span>
                </div>
                {plan.pricePerMonth && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('components.billing.onlyPerMonth', { price: plan.pricePerMonth })}
                  </p>
                )}
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((featureKey, index) => {
                  const translationKey = `components.billing.features.${featureKey}`;
                  const featureText = t(translationKey);
                  const isHighlightedFeature = featureKey.includes('ai') || featureKey.includes('unlimited') || featureKey.includes('advanced_vocabulary');
                  
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className={`text-sm ${isHighlightedFeature ? 'font-semibold' : ''}`}>
                        {featureText}
                      </span>
                    </li>
                  );
                })}
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
                    {t('components.billing.currentPlan')}
                  </>
                ) : loadingPlan === plan.id ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    {t('components.billing.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('components.billing.getStarted')}
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
            <AlertDialogCancel>{t('components.billing.upgradeDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              {confirmDialog.isUpgrade ? t('components.billing.upgradeDialog.upgrade') : t('components.billing.upgradeDialog.switch')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
