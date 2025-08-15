import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔄 [get-stripe-config] Request received', {
    method: req.method,
    url: req.url
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripePublishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripePublishableKey) {
      console.error('🔴 [get-stripe-config] STRIPE_PUBLISHABLE_KEY not found in environment');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe configuration not found',
          publishableKey: null 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Validate the key format
    const isValidKey = stripePublishableKey.startsWith('pk_test_') || stripePublishableKey.startsWith('pk_live_');
    
    if (!isValidKey) {
      console.error('🔴 [get-stripe-config] Invalid Stripe publishable key format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Stripe key format',
          publishableKey: null 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('✅ [get-stripe-config] Stripe publishable key retrieved successfully');
    
    return new Response(
      JSON.stringify({ 
        publishableKey: stripePublishableKey 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('🔴 [get-stripe-config] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve Stripe configuration',
        publishableKey: null 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});