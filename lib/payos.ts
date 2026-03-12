import crypto from "node:crypto";

// ─── Plan definitions ─────────────────────────────────────────────────────────

export const PAYOS_PLANS = {
  monthly: {
    amount: 79000,            // VND
    description: "MINDOTE MONTHLY", // max 25 chars, ASCII only for bank display
    variantId: 99001,         // synthetic variantId in plans table
    durationMonths: 1,
    displayPrice: "79.000₫",
    displayPricePerMonth: null,
  },
  yearly: {
    amount: 469000,           // VND
    description: "MINDOTE YEARLY",
    variantId: 99002,
    durationMonths: 12,
    displayPrice: "469.000₫",
    displayPricePerMonth: "~39.083₫",
  },
} as const;

export type PayOSPlanType = keyof typeof PAYOS_PLANS;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayOSPaymentLinkResponse {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId: string | null;
  counterAccountBankName: string | null;
  counterAccountName: string | null;
  counterAccountNumber: string | null;
  virtualAccountName: string | null;
  virtualAccountNumber: string | null;
}

export interface PayOSWebhookPayload {
  code: string;
  desc: string;
  success: boolean;
  data: PayOSWebhookData;
  signature: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a unique 9-digit order code.
 * Format: last 7 digits of current ms timestamp + 2 random digits.
 * Collision probability is negligible for typical traffic.
 */
export function generateOrderCode(): number {
  const ts = Date.now() % 10000000;              // last 7 digits of timestamp
  const rand = Math.floor(Math.random() * 100);  // 00–99
  return ts * 100 + rand;
}

/**
 * Computes HMAC-SHA256 checksum for PayOS payment link creation.
 * Only uses: amount, cancelUrl, description, orderCode, returnUrl (sorted alphabetically).
 */
export function computePaymentChecksum(params: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}): string {
  const message = [
    `amount=${params.amount}`,
    `cancelUrl=${params.cancelUrl}`,
    `description=${params.description}`,
    `orderCode=${params.orderCode}`,
    `returnUrl=${params.returnUrl}`,
  ].join("&");

  return crypto
    .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY!)
    .update(message)
    .digest("hex");
}

/**
 * Verifies a PayOS webhook signature against the payload's `data` object.
 * Signature is HMAC-SHA256 of all `data` fields sorted alphabetically,
 * with null values represented as the literal string "null".
 */
export function verifyWebhookSignature(payload: PayOSWebhookPayload): boolean {
  const { data, signature } = payload;

  if (!signature || !process.env.PAYOS_CHECKSUM_KEY) return false;

  // Build sorted key=value string from data object, null → "null"
  const message = Object.keys(data)
    .sort()
    .map((k) => {
      const val = (data as unknown as Record<string, unknown>)[k];
      return `${k}=${val === null || val === undefined ? "null" : val}`;
    })
    .join("&");

  const computed = crypto
    .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    // Buffers of different length throw — signature is definitely invalid
    return false;
  }
}

// ─── PayOS REST API calls ─────────────────────────────────────────────────────

const PAYOS_API_BASE = "https://api-merchant.payos.vn";

function payosHeaders() {
  return {
    "Content-Type": "application/json",
    "x-client-id": process.env.PAYOS_CLIENT_ID!,
    "x-api-key": process.env.PAYOS_API_KEY!,
  };
}

/**
 * Creates a PayOS payment link.
 * Returns the checkout URL and payment link metadata.
 */
export async function createPaymentLink(params: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerEmail?: string;
}): Promise<PayOSPaymentLinkResponse> {
  const { orderCode, amount, description, returnUrl, cancelUrl, buyerName, buyerEmail } = params;

  const signature = computePaymentChecksum({ amount, cancelUrl, description, orderCode, returnUrl });

  const body: Record<string, unknown> = {
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
    signature,
  };

  if (buyerName)  body.buyerName  = buyerName;
  if (buyerEmail) body.buyerEmail = buyerEmail;

  const res = await fetch(`${PAYOS_API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: payosHeaders(),
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (json.code !== "00") {
    throw new Error(
      `PayOS API error [${json.code}]: ${json.desc || json.message || "Unknown error"}`
    );
  }

  return json.data as PayOSPaymentLinkResponse;
}

/**
 * Cancels an existing PayOS payment link (if still PENDING).
 */
export async function cancelPaymentLink(orderCode: string): Promise<void> {
  const res = await fetch(`${PAYOS_API_BASE}/v2/payment-requests/${orderCode}/cancel`, {
    method: "POST",
    headers: payosHeaders(),
    body: JSON.stringify({ cancellationReason: "User cancelled" }),
  });

  const json = await res.json();

  if (json.code !== "00") {
    throw new Error(
      `PayOS cancel error [${json.code}]: ${json.desc || "Unknown error"}`
    );
  }
}

/**
 * Validates that required PayOS env vars are present.
 * Call at startup or before any PayOS API call.
 */
export function assertPayOSConfig() {
  const required = ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing PayOS env variables: ${missing.join(", ")}`);
  }
}
