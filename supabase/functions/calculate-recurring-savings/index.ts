import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_id } = await req.json();

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'customer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all recurring services for the customer
    const { data: services, error: servicesError } = await supabase
      .from('recurring_services')
      .select('*')
      .eq('customer_id', customer_id);

    if (servicesError) throw servicesError;

    // Calculate total savings and services completed
    let total_saved = 0;
    let services_completed = 0;
    let active_services = 0;
    let monthly_recurring_value = 0;

    services?.forEach(service => {
      total_saved += Number(service.total_amount_saved) || 0;
      services_completed += service.total_services_completed || 0;
      
      if (service.status === 'active') {
        active_services++;
        const pricePerService = Number(service.price_per_service) || 0;
        
        // Calculate monthly value based on frequency
        if (service.frequency === 'weekly') {
          monthly_recurring_value += pricePerService * 4;
        } else if (service.frequency === 'bi-weekly') {
          monthly_recurring_value += pricePerService * 2;
        } else if (service.frequency === 'monthly') {
          monthly_recurring_value += pricePerService;
        }
      }
    });

    // Calculate projected annual savings
    const projected_annual_savings = monthly_recurring_value * 12;

    // Calculate loyalty progress (every 6 cleans = 1 free)
    const loyalty_progress = {
      current: services_completed % 6,
      target: 6,
      free_cleans_earned: Math.floor(services_completed / 6)
    };

    return new Response(
      JSON.stringify({
        total_saved,
        projected_annual_savings,
        services_completed,
        active_services_count: active_services,
        monthly_recurring_value,
        loyalty_progress
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating recurring savings:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});