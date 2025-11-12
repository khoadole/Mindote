-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT,
    "variant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT NOT NULL,
    "is_usage_based" BOOLEAN NOT NULL DEFAULT false,
    "interval" TEXT,
    "interval_count" INTEGER,
    "trial_interval" TEXT,
    "trial_interval_count" INTEGER,
    "sort" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "lemon_squeezy_id" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "status_formatted" TEXT NOT NULL,
    "renews_at" TEXT,
    "ends_at" TEXT,
    "trial_ends_at" TEXT,
    "price" TEXT NOT NULL,
    "is_usage_based" BOOLEAN NOT NULL DEFAULT false,
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "subscription_item_id" INTEGER,
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "body" JSONB NOT NULL,
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_variant_id_key" ON "plans"("variant_id");

-- CreateIndex
CREATE INDEX "plans_variant_id_idx" ON "plans"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lemon_squeezy_id_key" ON "subscriptions"("lemon_squeezy_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_lemon_squeezy_id_idx" ON "subscriptions"("lemon_squeezy_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "webhook_events_event_name_idx" ON "webhook_events"("event_name");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
