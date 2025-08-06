import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTOMATED-TIER-PROGRESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role key for secure database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { subcontractorId, forceCheck } = await req.json();
    
    if (subcontractorId) {
      // Process specific subcontractor
      logStep("Processing specific subcontractor", { subcontractorId });
      const result = await processSubcontractorTier(supabaseClient, subcontractorId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Process all eligible subcontractors
      logStep("Processing all eligible subcontractors");
      const results = await processAllSubcontractors(supabaseClient, forceCheck);
      return new Response(JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in automated-tier-progression", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processSubcontractorTier(supabaseClient: any, subcontractorId: string) {
  logStep("Processing tier for subcontractor", { subcontractorId });

  // Get current subcontractor data
  const { data: subcontractor, error: subError } = await supabaseClient
    .from('subcontractors')
    .select('*, tier_change_history(*)')
    .eq('id', subcontractorId)
    .single();

  if (subError) {
    throw new Error(`Failed to fetch subcontractor: ${subError.message}`);
  }

  // Get tier configuration
  const { data: tierConfigs, error: configError } = await supabaseClient
    .from('tier_system_config')
    .select('*')
    .eq('is_active', true)
    .order('tier_level');

  if (configError) {
    throw new Error(`Failed to fetch tier config: ${configError.message}`);
  }

  // Calculate new tier based on performance
  const newTier = calculateOptimalTier(subcontractor, tierConfigs);
  
  if (newTier.tier_level !== subcontractor.tier_level) {
    logStep("Tier change detected", { 
      currentTier: subcontractor.tier_level, 
      newTier: newTier.tier_level 
    });

    // Update subcontractor tier
    const { error: updateError } = await supabaseClient
      .from('subcontractors')
      .update({
        tier_level: newTier.tier_level,
        hourly_rate: newTier.hourly_rate,
        monthly_fee: newTier.monthly_fee,
        updated_at: new Date().toISOString()
      })
      .eq('id', subcontractorId);

    if (updateError) {
      throw new Error(`Failed to update subcontractor tier: ${updateError.message}`);
    }

    // Record tier change history
    const { error: historyError } = await supabaseClient
      .from('tier_change_history')
      .insert({
        subcontractor_id: subcontractorId,
        previous_tier: subcontractor.tier_level,
        new_tier: newTier.tier_level,
        reason: 'automated_progression',
        performance_data: {
          review_count: subcontractor.review_count,
          completed_jobs_count: subcontractor.completed_jobs_count,
          rating: subcontractor.rating,
          monthly_revenue: subcontractor.monthly_revenue
        }
      });

    if (historyError) {
      logStep("Warning: Failed to record tier change history", { error: historyError });
    }

    // Send notification email
    try {
      await supabaseClient.functions.invoke('send-tier-upgrade-notification', {
        body: {
          subcontractorId,
          email: subcontractor.email,
          fullName: subcontractor.full_name,
          previousTier: subcontractor.tier_level,
          newTier: newTier.tier_level,
          newHourlyRate: newTier.hourly_rate,
          newMonthlyFee: newTier.monthly_fee
        }
      });
      logStep("Tier upgrade notification sent");
    } catch (emailError) {
      logStep("Warning: Failed to send tier upgrade notification", { error: emailError });
    }

    return {
      success: true,
      tierChanged: true,
      previousTier: subcontractor.tier_level,
      newTier: newTier.tier_level,
      subcontractorId
    };
  }

  return {
    success: true,
    tierChanged: false,
    currentTier: subcontractor.tier_level,
    subcontractorId
  };
}

async function processAllSubcontractors(supabaseClient: any, forceCheck = false) {
  logStep("Processing all subcontractors", { forceCheck });

  // Get all active subcontractors
  const { data: subcontractors, error } = await supabaseClient
    .from('subcontractors')
    .select('*')
    .eq('subscription_status', 'active')
    .eq('is_available', true);

  if (error) {
    throw new Error(`Failed to fetch subcontractors: ${error.message}`);
  }

  const results = [];
  
  for (const subcontractor of subcontractors) {
    try {
      // Skip if recently checked (unless forced)
      if (!forceCheck) {
        const lastUpdate = new Date(subcontractor.updated_at);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate < 24) {
          logStep("Skipping recently updated subcontractor", { 
            id: subcontractor.id,
            hoursSinceUpdate 
          });
          continue;
        }
      }

      const result = await processSubcontractorTier(supabaseClient, subcontractor.id);
      results.push(result);
    } catch (error) {
      logStep("Error processing subcontractor", { 
        id: subcontractor.id, 
        error: error.message 
      });
      results.push({
        success: false,
        error: error.message,
        subcontractorId: subcontractor.id
      });
    }
  }

  return results;
}

function calculateOptimalTier(subcontractor: any, tierConfigs: any[]) {
  // Find the highest tier the subcontractor qualifies for
  let optimalTier = tierConfigs[0]; // Default to lowest tier

  for (const tier of tierConfigs) {
    const requirements = tier.requirements;
    
    // Check if subcontractor meets all requirements
    const meetsReviewCount = subcontractor.review_count >= (requirements.min_reviews || 0);
    const meetsJobCount = subcontractor.completed_jobs_count >= (requirements.min_jobs || 0);
    const meetsRating = subcontractor.rating >= (requirements.min_rating || 0);
    const meetsRevenue = subcontractor.monthly_revenue >= (requirements.min_monthly_revenue || 0);
    
    if (meetsReviewCount && meetsJobCount && meetsRating && meetsRevenue) {
      optimalTier = tier;
    }
  }

  return optimalTier;
}