"use server";

import {
  getSubscription,
  listProducts,
  listPrices,
  getProduct,
  createCheckout,
  type Variant,
  updateSubscription,
  cancelSubscription as lsCancel,
  getPrice,
} from "@lemonsqueezy/lemonsqueezy.js";
import { revalidatePath, unstable_noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { configureLemonSqueezy, getAppURL } from "@/lib/lemonsqueezy";
import { getUserId } from "@/lib/server-auth";
import { webhookHasData, webhookHasMeta } from "@/lib/typeguards";

/**
 * Sync plans from Lemon Squeezy to database
 */
export async function syncPlans() {
  configureLemonSqueezy();

  // Fetch all the variants from the database
  const productVariants = await prisma.plan.findMany();

  // Helper function to add a variant
  async function _addVariant(variant: {
    name: string;
    description?: string;
    price: string;
    interval?: string;
    intervalCount?: number;
    isUsageBased: boolean;
    productId: number;
    productName?: string;
    variantId: number;
    trialInterval?: string;
    trialIntervalCount?: number;
    sort?: number;
  }) {
    console.log(`Syncing variant ${variant.name} with the database...`);

    // Sync the variant with the plan in the database
    await prisma.plan.upsert({
      where: { variantId: variant.variantId },
      update: {
        productId: variant.productId,
        productName: variant.productName,
        name: variant.name,
        description: variant.description,
        price: variant.price,
        isUsageBased: variant.isUsageBased,
        interval: variant.interval ?? undefined,
        intervalCount: variant.intervalCount ?? undefined,
        trialInterval: variant.trialInterval ?? undefined,
        trialIntervalCount: variant.trialIntervalCount ?? undefined,
        sort: variant.sort,
      },
      create: {
        variantId: variant.variantId,
        productId: variant.productId,
        productName: variant.productName,
        name: variant.name,
        description: variant.description,
        price: variant.price,
        isUsageBased: variant.isUsageBased,
        interval: variant.interval ?? undefined,
        intervalCount: variant.intervalCount ?? undefined,
        trialInterval: variant.trialInterval ?? undefined,
        trialIntervalCount: variant.trialIntervalCount ?? undefined,
        sort: variant.sort,
      },
    });

    console.log(`${variant.name} synced with the database...`);
  }

  // Fetch products from the Lemon Squeezy store
  const products = await listProducts({
    filter: { storeId: process.env.LEMON_SQUEEZY_STORE_ID! },
    include: ["variants"],
  });

  // Loop through all the variants
  const allVariants = products.data?.included as Variant["data"][] | undefined;

  if (allVariants) {
    for (const v of allVariants) {
      const variant = v.attributes;

      // Skip draft variants
      if (variant.status === "draft") {
        continue;
      }

      // Fetch the Product name
      const productName =
        (await getProduct(variant.product_id)).data?.data.attributes.name ?? "";

      // Fetch the Price object
      const variantPriceObject = await listPrices({
        filter: {
          variantId: v.id,
        },
      });

      const currentPriceObj = variantPriceObject.data?.data.at(0);
      const isUsageBased =
        currentPriceObj?.attributes.usage_aggregation !== null;
      const interval = currentPriceObj?.attributes.renewal_interval_unit;
      const intervalCount =
        currentPriceObj?.attributes.renewal_interval_quantity;
      const trialInterval = currentPriceObj?.attributes.trial_interval_unit;
      const trialIntervalCount =
        currentPriceObj?.attributes.trial_interval_quantity;

      const price = isUsageBased
        ? currentPriceObj?.attributes.unit_price_decimal
        : currentPriceObj?.attributes.unit_price;

      const priceString = price !== null ? price?.toString() ?? "" : "";

      const isSubscription =
        currentPriceObj?.attributes.category === "subscription";

      // If not a subscription, skip it
      if (!isSubscription) {
        continue;
      }

      await _addVariant({
        name: variant.name,
        description: variant.description,
        price: priceString,
        interval: interval ?? undefined,
        intervalCount: intervalCount ?? undefined,
        isUsageBased,
        productId: variant.product_id,
        productName,
        variantId: parseInt(v.id) as number,
        trialInterval: trialInterval ?? undefined,
        trialIntervalCount: trialIntervalCount ?? undefined,
        sort: variant.sort,
      });
    }
  }

  return productVariants;
}

/**
 * Get user subscriptions from database
 */
export async function getUserSubscriptions() {
  // Bypass Next.js cache to always fetch fresh data
  unstable_noStore();
  
  const userId = await getUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions;
}

/**
 * Create a checkout URL for a variant
 */
export async function getCheckoutURL(variantId: number, embed = false) {
  configureLemonSqueezy();

  const userId = await getUserId();

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, id: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const checkout = await createCheckout(
    process.env.LEMON_SQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: {
        embed,
        media: false,
        logo: !embed,
      },
      checkoutData: {
        email: user.email ?? undefined,
        custom: {
          user_id: user.id,
        },
      },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: `${getAppURL()}/billing?checkout=success`,
        receiptButtonText: "Go to Dashboard",
        receiptThankYouNote: "Thank you for subscribing to Mindote Premium!",
      },
    }
  );

  return checkout.data?.data.attributes.url;
}

/**
 * Create a checkout URL for a new subscription or schedule a plan change
 * If user has an active subscription, the new plan will be scheduled to start
 * after the current plan ends (subscription stacking)
 */
export async function createOrUpdateSubscription(variantId: number, embed = false) {
  const userId = await getUserId();

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  // Always create a checkout URL to ensure payment is processed
  // If user has an existing subscription, the webhook will handle:
  // 1. Scheduling the new subscription to start after current one ends
  // 2. Canceling the renewal of the current subscription
  const url = await getCheckoutURL(variantId, embed);
  return { type: "url", url };
}

/**
 * Store webhook event in database
 */
export async function storeWebhookEvent(eventName: string, body: any) {
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      eventName,
      body,
      processed: false,
    },
  });

  return webhookEvent.id;
}

/**
 * Process a webhook event from the database
 */
export async function processWebhookEvent(webhookEventId: string) {
  configureLemonSqueezy();

  const webhookEvent = await prisma.webhookEvent.findUnique({
    where: { id: webhookEventId },
  });

  if (!webhookEvent) {
    throw new Error(`Webhook event #${webhookEventId} not found.`);
  }

  let processingError = "";
  try {
    const eventBody = webhookEvent.body as any;

    if (!webhookHasMeta(eventBody)) {
      processingError = "Event body is missing the 'meta' property.";
    } else if (webhookHasData(eventBody)) {
      if (eventBody.meta.event_name.startsWith("subscription_")) {
        // Save subscription events
        const attributes = eventBody.data.attributes;
        const variantId = attributes.variant_id as string;

        // Get the plan from the database
        const plan = await prisma.plan.findFirst({
          where: { variantId: parseInt(variantId, 10) },
        });

        if (!plan) {
          processingError = `Plan with variantId ${variantId} not found.`;
        } else {
          // Get the price data from Lemon Squeezy
          const priceId = attributes.first_subscription_item.price_id;
          const priceData = await getPrice(priceId);

          if (priceData.error) {
            processingError = `Failed to get the price data for subscription ${eventBody.data.id}.`;
          } else {
            const isUsageBased =
              attributes.first_subscription_item.is_usage_based;
            const price = isUsageBased
              ? priceData.data?.data.attributes.unit_price_decimal
              : priceData.data?.data.attributes.unit_price;

            const userId = eventBody.meta.custom_data?.user_id;

            if (!userId) {
              processingError = "No user_id in custom_data.";
            } else {
              // First, save the subscription with status from Lemon Squeezy
              const updateData = {
                lemonSqueezyId: eventBody.data.id,
                orderId: attributes.order_id as number,
                name: attributes.user_name as string,
                email: attributes.user_email as string,
                status: attributes.status as string,
                statusFormatted: attributes.status_formatted as string,
                startsAt: null as string | null,
                renewsAt: attributes.renews_at as string | null,
                endsAt: attributes.ends_at as string | null,
                trialEndsAt: attributes.trial_ends_at as string | null,
                price: price?.toString() ?? "",
                isPaused: attributes.pause !== null,
                subscriptionItemId: attributes.first_subscription_item.id,
                isUsageBased:
                  attributes.first_subscription_item.is_usage_based ?? false,
                userId: userId,
                planId: plan.id,
              };

              // Create or update subscription in the database
              await prisma.subscription.upsert({
                where: { lemonSqueezyId: updateData.lemonSqueezyId },
                update: updateData,
                create: updateData,
              });
              console.log(
                `✅ Subscription ${updateData.lemonSqueezyId} saved for user ${userId}`
              );


            }
          }
        }
      }
    }
  } catch (error: any) {
    processingError = error.message || "Unknown error during processing";
    console.error("Error processing webhook:", error);
  }

  // Update the webhook event in the database
  await prisma.webhookEvent.update({
    where: { id: webhookEventId },
    data: {
      processed: true,
      processingError: processingError || null,
    },
  });

  // Revalidate billing page to show updated subscription
  revalidatePath("/billing");
}



/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  configureLemonSqueezy();

  const userId = await getUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get user subscriptions
  const subscription = await prisma.subscription.findFirst({
    where: {
      lemonSqueezyId: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    throw new Error(`Subscription #${subscriptionId} not found.`);
  }

  const cancelledSub = await lsCancel(subscriptionId);

  if (cancelledSub.error) {
    throw new Error(cancelledSub.error.message);
  }

  // Update the database
  try {
    await prisma.subscription.update({
      where: { lemonSqueezyId: subscriptionId },
      data: {
        status:
          cancelledSub.data?.data.attributes.status ?? subscription.status,
        statusFormatted:
          cancelledSub.data?.data.attributes.status_formatted ??
          subscription.statusFormatted,
        endsAt:
          cancelledSub.data?.data.attributes.ends_at ?? subscription.endsAt,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to cancel Subscription #${subscriptionId} in the database.`
    );
  }

  revalidatePath("/billing");

  return cancelledSub;
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string) {
  configureLemonSqueezy();

  const userId = await getUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      lemonSqueezyId: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    throw new Error(`Subscription #${subscriptionId} not found.`);
  }

  const pausedSub = await updateSubscription(subscriptionId, {
    pause: {
      mode: "void",
    },
  });

  // Update the database
  try {
    await prisma.subscription.update({
      where: { lemonSqueezyId: subscriptionId },
      data: {
        status: pausedSub.data?.data.attributes.status ?? subscription.status,
        statusFormatted:
          pausedSub.data?.data.attributes.status_formatted ??
          subscription.statusFormatted,
        endsAt: pausedSub.data?.data.attributes.ends_at ?? subscription.endsAt,
        isPaused: pausedSub.data?.data.attributes.pause !== null,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to pause Subscription #${subscriptionId} in the database.`
    );
  }

  revalidatePath("/billing");

  return pausedSub;
}

/**
 * Unpause a subscription
 */
export async function unpauseSubscription(subscriptionId: string) {
  configureLemonSqueezy();

  const userId = await getUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      lemonSqueezyId: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    throw new Error(`Subscription #${subscriptionId} not found.`);
  }

  const unpausedSub = await updateSubscription(subscriptionId, {
    pause: null as any,
  });

  // Update the database
  try {
    await prisma.subscription.update({
      where: { lemonSqueezyId: subscriptionId },
      data: {
        status: unpausedSub.data?.data.attributes.status ?? subscription.status,
        statusFormatted:
          unpausedSub.data?.data.attributes.status_formatted ??
          subscription.statusFormatted,
        endsAt:
          unpausedSub.data?.data.attributes.ends_at ?? subscription.endsAt,
        isPaused: unpausedSub.data?.data.attributes.pause !== null,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to unpause Subscription #${subscriptionId} in the database.`
    );
  }

  revalidatePath("/billing");

  return unpausedSub;
}

/**
 * Get subscription URLs (customer portal, update payment method)
 */
export async function getSubscriptionURLs(subscriptionId: string) {
  configureLemonSqueezy();

  const subscription = await getSubscription(subscriptionId);

  if (subscription.error) {
    throw new Error(subscription.error.message);
  }

  return subscription.data?.data.attributes.urls;
}

/**
 * Change subscription plan
 */
export async function changePlan(subscriptionId: string, newVariantId: number) {
  configureLemonSqueezy();

  const userId = await getUserId();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get user subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      lemonSqueezyId: subscriptionId,
      userId,
    },
  });

  if (!subscription) {
    throw new Error(`Subscription #${subscriptionId} not found.`);
  }

  // Get the new plan details
  const newPlan = await prisma.plan.findFirst({
    where: { variantId: newVariantId },
  });

  if (!newPlan) {
    throw new Error(`Plan with variantId #${newVariantId} not found.`);
  }

  // Update subscription in Lemon Squeezy
  const updatedSub = await updateSubscription(subscription.lemonSqueezyId, {
    variantId: newPlan.variantId,
  });

  if (updatedSub.error) {
    throw new Error(updatedSub.error.message);
  }

  // Update database
  try {
    await prisma.subscription.update({
      where: { lemonSqueezyId: subscription.lemonSqueezyId },
      data: {
        planId: newPlan.id,
        price: newPlan.price,
        endsAt: updatedSub.data?.data.attributes.ends_at ?? subscription.endsAt,
        renewsAt:
          updatedSub.data?.data.attributes.renews_at ?? subscription.renewsAt,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to update Subscription #${subscription.lemonSqueezyId} in the database.`
    );
  }

  revalidatePath("/billing");

  return updatedSub;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription() {
  const userId = await getUserId();

  if (!userId) {
    return false;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["active", "on_trial"],
      },
    },
  });

  return !!subscription;
}
