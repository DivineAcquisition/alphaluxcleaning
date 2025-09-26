import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("🚀 Testing webhook delivery system...");

    // Get active webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configurations')
      .select('*')
      .eq('active', true);

    if (configError || !webhookConfigs?.length) {
      console.error("❌ No active webhook configurations found:", configError);
      throw new Error("No active webhook configurations found");
    }

    // Create test payload
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      event_type: "WEBHOOK_TEST",
      message: "This is a test webhook delivery from your AlphaLux system",
      source: "webhook-delivery-test function"
    };

    console.log(`📡 Found ${webhookConfigs.length} active webhook(s), sending test payload...`);

    const results = [];
    
    for (const config of webhookConfigs) {
      console.log(`🎯 Sending to: ${config.name} (${config.url})`);
      
      try {
        const startTime = Date.now();
        
        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers
          },
          body: JSON.stringify(testPayload)
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const responseText = await response.text();

        // Log delivery result
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            payload: testPayload,
            response_status: response.status,
            response_body: responseText,
            response_headers: Object.fromEntries(response.headers.entries()),
            delivered_at: new Date().toISOString(),
            attempts: 1
          });

        results.push({
          webhook: config.name,
          url: config.url,
          success: response.ok,
          status: response.status,
          responseTime,
          response: responseText.slice(0, 200) // Truncate for logging
        });

        console.log(`✅ ${config.name}: ${response.status} (${responseTime}ms)`);
      } catch (error) {
        console.error(`❌ ${config.name} failed:`, error.message);
        
        // Log failed delivery
        await supabase
          .from('webhook_delivery_logs')
          .insert({
            webhook_config_id: config.id,
            payload: testPayload,
            error_message: error.message,
            attempts: 1
          });

        results.push({
          webhook: config.name,
          url: config.url,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Webhook delivery test completed",
      results,
      test_payload: testPayload
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 Webhook delivery test failed:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});