"use client";

import { Suspense, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionInfo } from "@/components/billing/subscription-info";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { PayOSPlans } from "@/components/billing/payos-plans";
import { useTranslation } from "@/lib/i18n-provider";

export default function BillingPage() {
  const { t } = useTranslation();
  const [paymentTab, setPaymentTab] = useState<"international" | "vietnam">("international");

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 bg-white dark:bg-background min-h-full">
      <div className="space-y-4">
        {/* Current Subscription */}
        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionInfo />
        </Suspense>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-2">{t("components.billing.availablePlans")}</h2>

          {/* Payment method tab switcher */}
          <div className="flex gap-2 mb-6 p-1 rounded-lg bg-muted w-fit">
            <button
              onClick={() => setPaymentTab("international")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                paymentTab === "international"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("components.billing.tabInternational")}
            </button>
            <button
              onClick={() => setPaymentTab("vietnam")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                paymentTab === "vietnam"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("components.billing.tabVietnam")}
            </button>
          </div>

          <Suspense fallback={<PlansSkeleton />}>
            {paymentTab === "international" ? <PricingPlans /> : <PayOSPlans />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function PlansSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
