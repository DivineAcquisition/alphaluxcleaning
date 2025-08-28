import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubcontractorRequest {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  tier_level: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { full_name, email, phone, city, tier_level }: CreateSubcontractorRequest = await req.json();

    console.log('Creating subcontractor:', { full_name, email, city, tier_level });

    // Validate required fields
    if (!full_name || !email || !phone || !city || !tier_level) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tier level
    if (tier_level < 1 || tier_level > 4) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier level. Must be between 1 and 4.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingSubcontractor } = await supabaseClient
      .from('subcontractors')
      .select('email')
      .eq('email', email)
      .single();

    if (existingSubcontractor) {
      return new Response(
        JSON.stringify({ error: 'A subcontractor with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tier benefits
    const { data: tierBenefits, error: tierError } = await supabaseClient
      .rpc('get_tier_benefits', { p_tier_level: tier_level });

    if (tierError) {
      console.error('Error getting tier benefits:', tierError);
      return new Response(
        JSON.stringify({ error: 'Failed to get tier information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hourlyRate = tierBenefits?.hourly_rate || 14.00;
    const monthlyFee = tierBenefits?.monthly_fee || 25.00;

    // Create subcontractor record
    const { data: newSubcontractor, error: createError } = await supabaseClient
      .from('subcontractors')
      .insert({
        full_name,
        email,
        phone,
        city,
        state: 'CA', // Default to CA
        tier_level,
        hourly_rate,
        monthly_fee,
        subscription_status: 'active',
        account_status: 'active',
        is_available: true,
        rating: 5.0,
        review_count: 0,
        completed_jobs_count: 0,
        address: '', // Default empty, can be updated later
        zip_code: '', // Default empty, can be updated later
        // Other optional fields with defaults
        stripe_customer_id: null,
        subscription_id: null,
        calendar_id: null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating subcontractor:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subcontractor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Subcontractor created successfully:', newSubcontractor.id);

    // Send welcome email (optional - don't fail if this fails)
    try {
      const tierName = tierBenefits?.tier_name || 'Standard';
      await supabaseClient.functions.invoke('send-subcontractor-welcome', {
        body: {
          email,
          fullName: full_name,
          planName: tierName,
          share: hourlyRate,
          fee: monthlyFee,
          jobs: 0,
        }
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        subcontractor: newSubcontractor,
        message: 'Subcontractor created successfully'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-subcontractor-direct function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
