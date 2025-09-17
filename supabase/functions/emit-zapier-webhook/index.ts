import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: "LEAD_CREATED" | "BOOKING_CONFIRMED";
  idempotency_key: string;
  emitted_at: string;
  env: "prod" | "dev";
  source: {
    channel: "META" | "UI_DIRECT" | "REENGAGE" | "GG_LOCAL";
    utms: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
    };
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: "CA" | "TX" | "NY";
    postal_code: string;
  };
  service: {
    service_type: "Standard" | "Deep" | "Move-In/Out" | "Commercial";
    frequency: "One-time" | "Weekly" | "Bi-Weekly" | "Monthly";
    sqft_tier: "1000-1500" | "1501-2500" | "2501-3500" | "3501-4500" | "4501+";
    sqft_exact: number;
    bedrooms: number;
    bathrooms: number;
    addons: string[];
    notes: string;
  };
  schedule?: {
    service_date: string;
    time_window: string;
  };
  pricing?: {
    currency: "USD";
    labor_basis_per_hr_team: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  stripe?: {
    checkout_mode?: "payment" | "subscription";
    checkout_session_id?: string;
    payment_intent_id?: string;
    subscription_id?: string;
  };
  metadata?: {
    booking_id?: string;
    manage_link?: string;
    ghl_contact_id?: string;
    hcp_customer_id?: string;
    hcp_job_id?: string;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ZAPIER-WEBHOOK] ${step}${detailsStr}`);
};

async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  headers: Record<string, string>,
  maxRetries = 3
): Promise<{ success: boolean; response?: any; error?: string }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logStep(`Sending webhook attempt ${attempt}/${maxRetries}`, { 
        url, 
        type: payload.type, 
        idempotency_key: payload.idempotency_key 
      });

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      logStep(`Webhook response`, { 
        status: response.status, 
        statusText: response.statusText,
        attempt
      });

      if (response.ok) {
        const responseText = await response.text();
        return { success: true, response: responseText };
      }

      // Retry on 429 (rate limit) or 5xx (server errors)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          logStep(`Retrying after backoff`, { backoffMs, attempt });
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
      }

      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      };

    } catch (error) {
      logStep(`Webhook attempt ${attempt} failed`, { error: error.message });
      
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook emitter started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const zapierUrl = Deno.env.get("ZAPIER_CATCH_HOOK_URL");

    if (!zapierUrl) {
      throw new Error("ZAPIER_CATCH_HOOK_URL not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload: WebhookPayload = await req.json();

    logStep("Payload received", { 
      type: payload.type, 
      idempotency_key: payload.idempotency_key 
    });

    // Validate required fields
    if (!payload.customer?.email && !payload.customer?.phone) {
      throw new Error("Either customer email or phone is required");
    }
    if (!payload.address?.state) {
      throw new Error("Address state is required");
    }
    if (!payload.service?.service_type) {
      throw new Error("Service type is required");
    }

    // Additional validation for BOOKING_CONFIRMED
    if (payload.type === "BOOKING_CONFIRMED") {
      if (!payload.schedule?.service_date) {
        throw new Error("Service date is required for BOOKING_CONFIRMED");
      }
      if (!payload.pricing?.total) {
        throw new Error("Pricing total is required for BOOKING_CONFIRMED");
      }
      if (!payload.stripe?.payment_intent_id && !payload.stripe?.subscription_id) {
        throw new Error("Either payment_intent_id or subscription_id is required for BOOKING_CONFIRMED");
      }
    }

    // Check idempotency
    const { data: existingEvent } = await supabase
      .from("webhook_idempotency")
      .select("id")
      .eq("idempotency_key", payload.idempotency_key)
      .single();

    if (existingEvent) {
      logStep("Event already processed", { idempotency_key: payload.idempotency_key });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Event already processed",
        idempotency_key: payload.idempotency_key
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Store idempotency key
    await supabase
      .from("webhook_idempotency")
      .insert({
        idempotency_key: payload.idempotency_key,
        event_type: payload.type,
        payload: payload
      });

    // Send webhook
    const webhookHeaders = {
      "Content-Type": "application/json",
    };

    const result = await sendWebhookWithRetry(zapierUrl, payload, webhookHeaders);

    if (result.success) {
      logStep("Webhook sent successfully", { idempotency_key: payload.idempotency_key });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Webhook sent successfully",
        idempotency_key: payload.idempotency_key,
        response: result.response
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Webhook failed after retries", { 
        error: result.error,
        idempotency_key: payload.idempotency_key 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error,
        idempotency_key: payload.idempotency_key
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook emitter", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});