import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookId, testPayload } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (webhookError || !webhook) {
      return new Response(JSON.stringify({ error: "Webhook not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Test payload
    const payload = testPayload || {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Test webhook delivery"
    };

    // Send test webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...webhook.headers
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    // Log the delivery attempt
    await supabase.from('webhook_delivery_logs').insert({
      webhook_config_id: webhook.id,
      payload,
      response_status: response.status,
      response_body: responseText,
      response_headers: Object.fromEntries(response.headers.entries()),
      delivered_at: response.ok ? new Date().toISOString() : null,
      error_message: response.ok ? null : `HTTP ${response.status}: ${responseText}`
    });

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      response: responseText,
      webhook: webhook.name
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Webhook test error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);