-- AlterTable: make lemon_squeezy_id nullable (LemonSqueezy-specific)
ALTER TABLE "subscriptions" ALTER COLUMN "lemon_squeezy_id" DROP NOT NULL;

-- AlterTable: make order_id nullable (LemonSqueezy-specific)
ALTER TABLE "subscriptions" ALTER COLUMN "order_id" DROP NOT NULL;

-- AlterTable: add provider column to track which payment gateway
ALTER TABLE "subscriptions" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'lemonsqueezy';

-- AlterTable: add payos_order_code for PayOS payment tracking
ALTER TABLE "subscriptions" ADD COLUMN "payos_order_code" TEXT;

-- CreateIndex: unique constraint on payos_order_code (NULLs are not considered duplicates in PostgreSQL)
CREATE UNIQUE INDEX "subscriptions_payos_order_code_key" ON "subscriptions"("payos_order_code");

-- CreateIndex: index on provider for efficient filtering
CREATE INDEX "subscriptions_provider_idx" ON "subscriptions"("provider");

-- CreateTable: payos_orders tracks each payment intent from creation to completion
CREATE TABLE "payos_orders" (
    "id" UUID NOT NULL,
    "order_code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_link_id" TEXT,
    "checkout_url" TEXT,
    "webhook_data" JSONB,
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payos_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payos_orders_order_code_key" ON "payos_orders"("order_code");

-- CreateIndex
CREATE INDEX "payos_orders_user_id_idx" ON "payos_orders"("user_id");

-- CreateIndex
CREATE INDEX "payos_orders_order_code_idx" ON "payos_orders"("order_code");

-- CreateIndex
CREATE INDEX "payos_orders_status_idx" ON "payos_orders"("status");

-- AddForeignKey
ALTER TABLE "payos_orders" ADD CONSTRAINT "payos_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: Insert PayOS plan entries (synthetic variantIds 99001, 99002)
-- These are standalone entries not tied to any real LemonSqueezy product.
INSERT INTO "plans" ("id", "product_id", "product_name", "variant_id", "name", "description", "price", "is_usage_based", "interval", "interval_count", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 9001, 'Mindote Premium (VND)', 99001, 'Monthly (VND)', 'Mindote Premium – Monthly subscription via PayOS', '79000', false, 'month', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 9001, 'Mindote Premium (VND)', 99002, 'Yearly (VND)',  'Mindote Premium – Yearly subscription via PayOS',  '469000', false, 'year',  1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("variant_id") DO NOTHING;
