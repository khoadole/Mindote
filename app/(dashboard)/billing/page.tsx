"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionInfo } from "@/components/billing/subscription-info";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { useTranslation } from "@/lib/i18n-provider";

export default function BillingPage() {
  const { t } = useTranslation();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 bg-white dark:bg-background min-h-screen">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('components.billing.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('components.billing.subtitle')}
          </p>
        </div>

        {/* Current Subscription */}
        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionInfo />
        </Suspense>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('components.billing.availablePlans')}</h2>
          <Suspense fallback={<PlansSkeleton />}>
            <PricingPlans />
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

