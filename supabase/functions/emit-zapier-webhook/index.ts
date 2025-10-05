import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  booking_id: string;
  timestamp: string;
  source: string;
  state: "CA" | "TX" | "NY";
  service_type: string;
  sq_ft_range: string;
  frequency: string;
  discount_applied: boolean;
  discount_rate: number;
  price_before_discount: number;
  price_after_discount: number;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  job_details: {
    bedrooms: number;
    bathrooms: number;
    notes: string;
    preferred_date: string;
    preferred_time_window: string;
    est_duration_hours: number;
    labor_rate_per_hour: number;
    labor_cost_total: number;
  };
  payment: {
    payment_method: string;
    payment_status: string;
    transaction_id: string;
    amount_paid: number;
  };
  marketing: {
    campaign: string;
    ad_id: string;
    utm_source: string;
    utm_campaign: string;
  };
  ltv_metrics: {
    expected_ltv: number;
    expected_recurring_frequency: string;
    customer_segment: string;
    ltv_score: string;
  };
  referral_program: {
    referral_code: string;
    referral_link: string;
    referral_incentive: string;
    referral_tracking_id: string;
  };
  system_meta: {
    origin: string;
    environment: string;
    version: string;
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
        booking_id: payload.booking_id
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

    const zapierUrl = "https://hooks.zapier.com/hooks/catch/24603039/um6me4v/";
    const payload: WebhookPayload = await req.json();

    logStep("Payload received", { 
      booking_id: payload.booking_id,
      customer_email: payload.customer.email
    });

    // Validate required fields
    if (!payload.customer?.email && !payload.customer?.phone) {
      throw new Error("Either customer email or phone is required");
    }
    if (!payload.address?.state) {
      throw new Error("Address state is required");
    }
    if (!payload.service_type) {
      throw new Error("Service type is required");
    }

    // Send webhook
    const webhookHeaders = {
      "Content-Type": "application/json",
    };

    const result = await sendWebhookWithRetry(zapierUrl, payload, webhookHeaders);

    if (result.success) {
      logStep("Webhook sent successfully", { booking_id: payload.booking_id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Webhook sent successfully",
        booking_id: payload.booking_id,
        response: result.response
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Webhook failed after retries", { 
        error: result.error,
        booking_id: payload.booking_id 
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.error,
        booking_id: payload.booking_id
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