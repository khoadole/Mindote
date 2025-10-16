"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BillingCycle = "monthly" | "yearly";

export function UpgradePlanModal({
  open,
  onOpenChange,
}: UpgradePlanModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("yearly");

  const plans = {
    monthly: {
      price: "$14.99",
      period: "per month",
      total: "$14.99/month",
      savings: null,
    },
    yearly: {
      price: "$99.99",
      period: "per year",
      total: "$8.33/month",
      savings: "Save 17%",
    },
  };

  const features = [
    "Unlimited collections",
    "Unlimited flashcards",
    "Advanced quiz modes",
    "YouTube transcript import",
    "Export to Anki",
    "Priority support",
    "AI-powered suggestions",
    "Offline access",
  ];

  const handleUpgrade = () => {
    // TODO: Implement payment flow
    console.log(`Upgrading to ${selectedCycle} plan`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Unlock all features and take your learning to the next level
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
                "bg-gradient-to-r from-purple-500 to-pink-500"
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
                "bg-gradient-to-r from-purple-500 to-pink-500"
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
        <Card className="p-6 border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-300">
              {plans[selectedCycle].price}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {plans[selectedCycle].period}
            </div>
            {selectedCycle === "yearly" && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                Billed as {plans[selectedCycle].total}
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg py-6"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Upgrade Now
          </Button>
        </Card>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. 14-day money-back guarantee.
        </p>
      </DialogContent>
    </Dialog>
  );
}
