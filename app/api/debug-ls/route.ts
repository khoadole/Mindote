import { NextResponse } from "next/server";
import { listProducts, listPrices, configureLemonSqueezy } from "@/lib/lemonsqueezy"; // Adjust import if needed, likely from @lemonsqueezy/lemonsqueezy.js directly or via local lib
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Ensure config is loaded
    if (!process.env.LEMON_SQUEEZY_API_KEY) {
        return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }
    lemonSqueezySetup({ apiKey: process.env.LEMON_SQUEEZY_API_KEY });

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    
    // Fetch products and variants
    const response = await fetch(`https://api.lemonsqueezy.com/v1/products?filter[store_id]=${storeId}&include=variants`, {
        headers: {
            Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
            Accept: "application/vnd.api+json"
        }
    });
    
    const data = await response.json();
    
    // Also fetch prices to check category
    const variants = data.included || [];
    const debugInfo = [];

    for (const v of variants) {
        if (v.type !== "variants") continue;
        
        // Fetch price for this variant
        const priceResp = await fetch(`https://api.lemonsqueezy.com/v1/prices?filter[variant_id]=${v.id}`, {
             headers: {
                Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
                Accept: "application/vnd.api+json"
            }
        });
        const priceData = await priceResp.json();
        const price = priceData.data?.[0]?.attributes;

        debugInfo.push({
            id: v.id,
            name: v.attributes.name,
            status: v.attributes.status,
            price_category: price?.category, // This is the suspect!
            price_unit: price?.unit_price,
            renewal_interval: price?.renewal_interval_unit
        });
    }

    return NextResponse.json({
        count: debugInfo.length,
        variants: debugInfo
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
