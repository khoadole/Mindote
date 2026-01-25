"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCheckoutURL } from "@/app/actions/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BillingCycle = "monthly" | "yearly";

// Variant IDs from Lemon Squeezy
const VARIANT_IDS = {
  monthly: parseInt(
    process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_MONTHLY || "1087650"
  ),
  yearly: parseInt(
    process.env.NEXT_PUBLIC_LEMON_SQUEEZY_VARIANT_ID_YEARLY || "1087727"
  ),
};

export function UpgradePlanModal({
  open,
  onOpenChange,
}: UpgradePlanModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("yearly");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset loading state when modal closes
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);

  // Reset loading state when component unmounts (e.g., user navigates back)
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  const plans = {
    monthly: {
      price: "$5.99",
      period: "per month",
      savings: null,
      variantId: VARIANT_IDS.monthly,
    },
    yearly: {
      price: "$2.99",
      period: "per month",
      savings: "Save 50%",
      annualPrice: "$35.88",
      variantId: VARIANT_IDS.yearly,
    },
  };

  const features = [
    "Unlimited AI word fills",
    "Unlimited reading generation",
    "Advanced analytics & insights",
    "Early access to new features",
    "No daily AI limits",
    "All core features included",
  ];

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);

      const variantId = plans[selectedCycle].variantId;

      // Show toast notification for better UX
      toast({
        title: "Redirecting to checkout...",
        description: "Please wait while we prepare your checkout session.",
      });

      // Get checkout URL from Lemon Squeezy
      const checkoutUrl = await getCheckoutURL(variantId, false);

      if (!checkoutUrl) {
        throw new Error("Failed to create checkout URL");
      }

      // Show success toast before redirecting
      toast({
        title: "Checkout ready!",
        description: "Redirecting you to the payment page...",
      });

      // Close modal before redirecting
      onOpenChange(false);

      // Small delay to ensure modal closes smoothly and toast is visible
      setTimeout(() => {
        // Redirect to Lemon Squeezy checkout
        window.location.href = checkoutUrl;
      }, 500);
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-[#3B82F6]" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Get unlimited AI features and advanced tools to accelerate your
            vocabulary learning
          </DialogDescription>
        </DialogHeader>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center gap-2 my-6">
          <Button
            variant={selectedCycle === "monthly" ? "default" : "outline"}
            onClick={() => setSelectedCycle("monthly")}
            className={cn(
              "flex-1 max-w-[180px]",
              selectedCycle === "monthly" &&
                "bg-[#3B82F6] hover:bg-[#2563EB]"
            )}
          >
            Monthly
          </Button>
          <Button
            variant={selectedCycle === "yearly" ? "default" : "outline"}
            onClick={() => setSelectedCycle("yearly")}
            className={cn(
              "flex-1 max-w-[180px] relative",
              selectedCycle === "yearly" &&
                "bg-[#3B82F6] hover:bg-[#2563EB]"
            )}
          >
            Yearly
            {plans.yearly.savings && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                {plans.yearly.savings}
              </span>
            )}
          </Button>
        </div>

        {/* Pricing Card */}
        <Card className="p-6 border-2 border-[#3B82F6]/30 dark:border-[#3B82F6]/50 bg-gradient-to-br from-[#3B82F6]/5 via-[#3B82F6]/10 to-[#FFD93D]/10 dark:from-[#3B82F6]/10 dark:to-[#FFD93D]/10">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-[#3B82F6] dark:text-[#60A5FA]">
              {plans[selectedCycle].price}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {plans[selectedCycle].period}
            </div>
            {selectedCycle === "yearly" && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Billed annually at {plans.yearly.annualPrice}
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-[#3B82F6] dark:text-[#60A5FA] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] hover:from-[#2563EB] hover:to-[#3B82F6] text-white text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Upgrade Now
              </>
            )}
          </Button>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
