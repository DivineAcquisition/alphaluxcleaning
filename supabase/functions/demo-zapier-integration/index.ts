import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/5011258/uusrlmn/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Sending initial test transactions to Zapier webhook");

    // Sample transactions to send immediately
    const testTransactions = [
      {
        timestamp: new Date().toISOString(),
        transaction_type: 'customer_payment',
        transaction_id: "demo_payment_001",
        customer_name: "John Smith",
        customer_email: "john.smith@example.com",
        customer_phone: "(555) 123-4567",
        service_date: "2025-01-20",
        service_time: "10:00 AM",
        cleaning_type: "deep_clean",
        frequency: "one_time", 
        amount: 299.99,
        currency: "USD",
        payment_status: "completed",
        stripe_session_id: "cs_demo_" + Date.now(),
        add_ons: ["carpet_cleaning", "window_cleaning"],
        square_footage: 1200,
        source: "bay_area_cleaning_pros"
      },
      {
        timestamp: new Date().toISOString(),
        transaction_type: 'subcontractor_payment',
        transaction_id: "demo_sub_payment_001",
        subcontractor_name: "Malik Sannie",
        subcontractor_email: "malik.sannie@example.com",
        customer_name: "Jane Doe",
        customer_email: "jane.doe@example.com",
        service_date: "2025-01-21",
        split_tier: "60_40",
        total_amount: 199.99,
        subcontractor_amount: 79.96,
        company_amount: 119.97,
        split_percentage: 40,
        payment_status: "completed",
        job_status: "completed",
        customer_rating: 5,
        source: "bay_area_cleaning_pros"
      },
      {
        timestamp: new Date().toISOString(),
        transaction_type: 'subscription_payment',
        transaction_id: "demo_subscription_001",
        subcontractor_name: "Sarah Johnson",
        subcontractor_email: "sarah.johnson@example.com",
        split_tier: "50_50",
        subscription_amount: 10.00,
        currency: "USD",
        billing_cycle: "monthly",
        subscription_status: "active",
        guaranteed_jobs: 10,
        payment_status: "completed",
        source: "bay_area_cleaning_pros"
      }
    ];

    const results = [];

    for (const transaction of testTransactions) {
      try {
        console.log(`Sending ${transaction.transaction_type} to Zapier:`, transaction.transaction_id);
        
        const response = await fetch(ZAPIER_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction),
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log(`✅ ${transaction.transaction_type} sent successfully:`, responseText);
          results.push({
            type: transaction.transaction_type,
            id: transaction.transaction_id,
            success: true,
            response: responseText
          });
        } else {
          console.log(`❌ Failed to send ${transaction.transaction_type}:`, response.status, response.statusText);
          results.push({
            type: transaction.transaction_type,
            id: transaction.transaction_id,
            success: false,
            error: `${response.status} ${response.statusText}`
          });
        }
      } catch (error) {
        console.error(`❌ Error sending ${transaction.transaction_type}:`, error);
        results.push({
          type: transaction.transaction_type,
          id: transaction.transaction_id,
          success: false,
          error: error.message
        });
      }
    }

    console.log("All test transactions processed:", results);

    return new Response(JSON.stringify({
      success: true,
      message: "Test transactions sent to Zapier webhook",
      webhook_url: ZAPIER_WEBHOOK_URL,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in demo function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});