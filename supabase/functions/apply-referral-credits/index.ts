import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`🎁 [apply-referral-credits] ${step}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  logStep("Request received", { method: req.method });
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    logStep("Supabase client initialized");

    const body = await req.json();
    const { customer_email, booking_id, max_amount_cents } = body;

    logStep("Request body parsed", { customer_email, booking_id, max_amount_cents });

    if (!customer_email) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Find customer by email
    const { data: customer, error: customerError } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', customer_email)
      .maybeSingle();

    if (customerError || !customer) {
      logStep("Customer not found", { error: customerError });
      return new Response(
        JSON.stringify({ 
          success: false, 
          amount_redeemed: 0,
          message: "Customer not found" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Customer found", { customer_id: customer.id });

    // Fetch EARNED credits for this customer
    const { data: earnedCredits, error: creditsError } = await supabaseClient
      .from('referral_rewards')
      .select('id, amount_cents')
      .eq('customer_id', customer.id)
      .eq('status', 'EARNED')
      .order('created_at', { ascending: true }); // Oldest first (FIFO)

    if (creditsError) {
      logStep("Error fetching credits", { error: creditsError });
      throw new Error(`Failed to fetch credits: ${creditsError.message}`);
    }

    if (!earnedCredits || earnedCredits.length === 0) {
      logStep("No earned credits found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          amount_redeemed: 0,
          message: "No credits available" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Earned credits found", { count: earnedCredits.length, credits: earnedCredits });

    // Calculate total available credits
    const totalAvailable = earnedCredits.reduce((sum, credit) => sum + credit.amount_cents, 0);
    
    // Determine how much to apply (up to max_amount_cents if specified)
    const amountToApply = max_amount_cents 
      ? Math.min(totalAvailable, max_amount_cents) 
      : totalAvailable;

    logStep("Credits calculation", { totalAvailable, max_amount_cents, amountToApply });

    // Mark credits as APPLIED
    let remainingToApply = amountToApply;
    const creditIdsToUpdate: string[] = [];

    for (const credit of earnedCredits) {
      if (remainingToApply <= 0) break;
      
      creditIdsToUpdate.push(credit.id);
      remainingToApply -= credit.amount_cents;
    }

    logStep("Credits to update", { creditIds: creditIdsToUpdate, count: creditIdsToUpdate.length });

    // Update credits to APPLIED status
    const { error: updateError } = await supabaseClient
      .from('referral_rewards')
      .update({ 
        status: 'APPLIED',
        redeemed_at: new Date().toISOString(),
        booking_id: booking_id || null,
        notes: booking_id ? `Applied to booking ${booking_id}` : 'Applied to booking'
      })
      .in('id', creditIdsToUpdate);

    if (updateError) {
      logStep("Error updating credits", { error: updateError });
      throw new Error(`Failed to apply credits: ${updateError.message}`);
    }

    logStep("Credits successfully applied", { 
      amount_redeemed_cents: amountToApply,
      amount_redeemed_dollars: amountToApply / 100,
      credits_updated: creditIdsToUpdate.length
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        amount_redeemed_cents: amountToApply,
        amount_redeemed: amountToApply / 100,
        credits_applied: creditIdsToUpdate.length,
        message: `Successfully applied $${(amountToApply / 100).toFixed(2)} in credits`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
