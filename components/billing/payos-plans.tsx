"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import { createPayOSPayment } from "@/app/actions/payos";
import { getUserSubscriptions } from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n-provider";
import { formatDistanceToNow } from "date-fns";

// ─── Plan definitions (mirrors PAYOS_PLANS in lib/payos.ts) ──────────────────

const PAYOS_UI_PLANS = [
  {
    id: "monthly" as const,
    price: "79.000₫",
    period: "components.billing.perMonth",
    pricePerMonth: null,
    savings: null,
    popular: false,
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
    id: "yearly" as const,
    price: "469.000₫",
    period: "components.billing.perYear",
    pricePerMonth: "~39.083₫",
    savings: "components.billing.payosSave",
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
] as const;

type PayOSPlanId = (typeof PAYOS_UI_PLANS)[number]["id"];

// ─── Component ────────────────────────────────────────────────────────────────

export function PayOSPlans() {
  const [loadingPlan, setLoadingPlan] = useState<PayOSPlanId | null>(null);
  const [activePayOSSub, setActivePayOSSub] = useState<any | null>(null);
  const [subsLoading, setSubsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    checkPayOSSubscription();

    // Sync with SubscriptionInfo when subscription data changes
    const handleSubUpdate = (event: CustomEvent) => {
      const subs: any[] = event.detail?.subscriptions || [];
      resolveActivePayOSSub(subs);
    };

    window.addEventListener("subscription-updated", handleSubUpdate as EventListener);

    // Poll after PayOS checkout redirect
    const isFromPayOS =
      searchParams.get("checkout") === "success" &&
      searchParams.get("provider") === "payos";

    if (isFromPayOS) {
      router.refresh();
      let retries = 0;
      const interval = setInterval(async () => {
        retries++;
        await checkPayOSSubscription();
        if (retries >= 5) clearInterval(interval);
      }, 3000);

      return () => {
        clearInterval(interval);
        window.removeEventListener("subscription-updated", handleSubUpdate as EventListener);
      };
    }

    return () => {
      window.removeEventListener("subscription-updated", handleSubUpdate as EventListener);
    };
  }, [searchParams]);

  async function checkPayOSSubscription() {
    try {
      const subs = await getUserSubscriptions();
      resolveActivePayOSSub(subs);
    } catch (err) {
      console.error("[PayOSPlans] Failed to load subscriptions:", err);
    } finally {
      setSubsLoading(false);
    }
  }

  function resolveActivePayOSSub(subs: any[]) {
    const now = new Date();
    const active = subs.find(
      (s) =>
        s.provider === "payos" &&
        s.status === "active" &&
        s.endsAt &&
        new Date(s.endsAt) > now
    );
    setActivePayOSSub(active || null);
  }

  async function handleSelectPlan(planId: PayOSPlanId) {
    try {
      setLoadingPlan(planId);
      const { checkoutUrl } = await createPayOSPayment(planId);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("[PayOSPlans] Payment error:", err);
      toast({
        title: t("components.billing.error"),
        description: err.message || t("components.billing.failedToCheckout"),
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  }

  // Is the user's current active PayOS plan on this plan id?
  function isCurrentPlan(planId: PayOSPlanId): boolean {
    if (!activePayOSSub) return false;
    return activePayOSSub.plan?.interval === (planId === "monthly" ? "month" : "year");
  }

  function getRemainingTime(): string {
    if (!activePayOSSub?.endsAt) return "";
    return formatDistanceToNow(new Date(activePayOSSub.endsAt));
  }

  return (
    <div className="space-y-4">
      {/* Active PayOS subscription notice */}
      {activePayOSSub && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-sm text-blue-700 dark:text-blue-400">
          {t("components.billing.payosActiveNotice", {
            time: getRemainingTime(),
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {PAYOS_UI_PLANS.map((plan) => {
          const current = isCurrentPlan(plan.id);

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col min-h-[480px] ${
                plan.popular ? "border-purple-500 shadow-lg shadow-purple-500/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {t("components.billing.mostPopular")}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {plan.id === "monthly"
                      ? t("components.billing.monthly")
                      : t("components.billing.yearly")}
                  </span>
                  {plan.savings && (
                    <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                      {t(plan.savings)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{t(plan.period)}</span>
                  </div>
                  {plan.pricePerMonth && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("components.billing.payosOnlyPerMonth", {
                        price: plan.pricePerMonth,
                      })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("components.billing.payosOneTimeNote")}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((featureKey) => {
                    const featureText = t(`components.billing.features.${featureKey}`);
                    const highlighted =
                      featureKey.includes("ai") ||
                      featureKey.includes("unlimited") ||
                      featureKey.includes("advanced_vocabulary");

                    return (
                      <li key={featureKey} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className={`text-sm ${highlighted ? "font-semibold" : ""}`}>
                          {featureText}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan !== null || subsLoading}
                  className={`w-full ${
                    current
                      ? "bg-green-600 hover:bg-green-700"
                      : plan.popular
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      : ""
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      {t("components.billing.processingPayos")}
                    </>
                  ) : subsLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {t("components.billing.processing")}
                    </>
                  ) : current ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {t("components.billing.payosRenew")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("components.billing.payosPayNow")}
                    </>
                  )}
                </Button>

                {/* Payment method hint */}
                <p className="text-center text-xs text-muted-foreground">
                  {t("components.billing.payosPaymentMethods")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
