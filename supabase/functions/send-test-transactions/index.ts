import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TEST-TRANSACTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - Sending test transactions to Zapier");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Sample customer payment transaction
    const customerTransaction = {
      transaction_id: "test_cust_" + Date.now(),
      customer_name: "John Smith",
      customer_email: "john.smith@example.com",
      customer_phone: "(555) 123-4567",
      service_address: "123 Main St, San Francisco, CA 94102",
      service_date: "2025-01-15",
      service_time: "10:00 AM",
      cleaning_type: "deep_clean",
      frequency: "one_time",
      amount: 299.99,
      currency: "USD",
      payment_status: "completed",
      stripe_session_id: "cs_test_" + Date.now(),
      add_ons: ["carpet_cleaning", "window_cleaning"],
      square_footage: 1200,
      special_instructions: "Please focus on kitchen and bathrooms"
    };

    // Sample subcontractor payment transaction
    const subcontractorTransaction = {
      transaction_id: "test_sub_" + Date.now(),
      subcontractor_name: "Malik Sannie",
      subcontractor_email: "malik.sannie@example.com",
      customer_name: "Jane Doe",
      customer_email: "jane.doe@example.com",
      service_address: "456 Oak Ave, Berkeley, CA 94704",
      service_date: "2025-01-16",
      split_tier: "60_40",
      total_amount: 199.99,
      subcontractor_amount: 79.96, // 40% of total
      company_amount: 119.97, // 60% of total
      split_percentage: 40,
      payment_status: "pending",
      job_status: "completed",
      customer_rating: 5
    };

    // Sample subscription transaction
    const subscriptionTransaction = {
      transaction_id: "test_subscription_" + Date.now(),
      subcontractor_name: "Sarah Johnson",
      subcontractor_email: "sarah.johnson@example.com",
      split_tier: "50_50",
      subscription_amount: 10.00,
      currency: "USD",
      billing_cycle: "monthly",
      subscription_status: "active",
      stripe_customer_id: "cus_test_" + Date.now(),
      subscription_id: "sub_test_" + Date.now(),
      guaranteed_jobs: 10
    };

    // Send all test transactions to Zapier
    const testTransactions = [
      { data: customerTransaction, type: "customer_payment" },
      { data: subcontractorTransaction, type: "subcontractor_payment" },
      { data: subscriptionTransaction, type: "subscription_payment" }
    ];

    const results = [];

    for (const transaction of testTransactions) {
      try {
        const { data, error } = await supabaseClient.functions.invoke('send-transaction-to-zapier', {
          body: {
            transactionData: transaction.data,
            type: transaction.type
          }
        });

        if (error) {
          logStep(`Warning: Failed to send ${transaction.type}`, { error });
          results.push({ type: transaction.type, success: false, error: error.message });
        } else {
          logStep(`Successfully sent ${transaction.type}`, { data });
          results.push({ type: transaction.type, success: true, data });
        }
      } catch (err) {
        logStep(`Error sending ${transaction.type}`, { error: err });
        results.push({ type: transaction.type, success: false, error: err.message });
      }
    }

    logStep("Test transactions completed", { results });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test transactions sent to Zapier",
      results,
      webhook_url: "https://hooks.zapier.com/hooks/catch/5011258/uusrlmn/"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-test-transactions", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});