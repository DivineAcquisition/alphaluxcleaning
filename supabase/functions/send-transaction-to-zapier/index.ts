import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/24603039/um6me4v/";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TRANSACTION-TO-ZAPIER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { transactionData, type } = await req.json();
    if (!transactionData) {
      throw new Error("Missing transaction data");
    }

    logStep("Transaction data received", { type, transactionData });

    // Prepare data for Zapier
    const zapierPayload = {
      timestamp: new Date().toISOString(),
      transaction_type: type || 'customer_payment',
      ...transactionData,
      source: 'bay_area_cleaning_pros'
    };

    logStep("Sending to Zapier webhook", { url: ZAPIER_WEBHOOK_URL });

    // Send to Zapier webhook
    const response = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(zapierPayload),
    });

    logStep("Zapier response received", { 
      status: response.status, 
      statusText: response.statusText 
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    logStep("Zapier webhook successful", { response: responseText });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Transaction sent to Zapier successfully",
      zapier_response: responseText
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-transaction-to-zapier", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});