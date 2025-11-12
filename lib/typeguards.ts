/**
 * Type guards for Lemon Squeezy webhook events
 */

export interface WebhookMeta {
  event_name: string;
  custom_data?: {
    user_id?: string;
  };
}

export interface WebhookData {
  meta: WebhookMeta;
  data?: any;
}

/**
 * Type guard to check if an object has a 'meta' property
 */
export function webhookHasMeta(obj: unknown): obj is WebhookData {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "meta" in obj &&
    typeof (obj as any).meta === "object"
  );
}

/**
 * Type guard to check if an object has both 'meta' and 'data' properties
 */
export function webhookHasData(obj: unknown): obj is Required<WebhookData> {
  return (
    webhookHasMeta(obj) &&
    "data" in obj &&
    typeof (obj as any).data === "object"
  );
}
