"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getCheckoutURL,
  getUserSubscriptions,
} from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "7.99",
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

export function PricingPlans() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlanVariantId, setCurrentPlanVariantId] = useState<
    number | null
  >(null);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkCurrentSubscription();
  }, []);

  const checkCurrentSubscription = async () => {
    try {
      const subscriptions = await getUserSubscriptions();
      const activeSub = subscriptions.find(
        (sub: any) => sub.status === "active" || sub.status === "on_trial"
      );
      if (activeSub?.plan?.variantId) {
        setCurrentPlanVariantId(activeSub.plan.variantId);
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, variantId: number) => {
    try {
      setLoadingPlan(planId);

      const checkoutUrl = await getCheckoutURL(variantId, false);

      if (!checkoutUrl) {
        throw new Error("Failed to create checkout URL");
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  };

  return (
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
              onClick={() => handleSubscribe(plan.id, plan.variantId)}
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
  );
}
