import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReferralRequest {
  first_name: string;
  email: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { first_name, email }: ReferralRequest = await req.json();

    // Validate inputs
    if (!first_name || !email) {
      return new Response(
        JSON.stringify({ error: 'First name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize first name (1-100 chars, basic characters only)
    const sanitizedFirstName = first_name.trim().slice(0, 100);
    if (sanitizedFirstName.length === 0) {
      return new Response(
        JSON.stringify({ error: 'First name cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lowerEmail = email.toLowerCase().trim();

    console.log(`Processing referral request for: ${lowerEmail}`);

    // Check if customer already exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, referral_code, referral_link')
      .eq('email', lowerEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing customer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId: string;
    let referralCode: string;
    let referralLink: string;
    let isNew = false;

    if (existingCustomer) {
      // Customer exists
      customerId = existingCustomer.id;
      
      // If they already have a code, return it
      if (existingCustomer.referral_code) {
        console.log(`Existing customer with code: ${existingCustomer.referral_code}`);
        return new Response(
          JSON.stringify({
            success: true,
            referral_code: existingCustomer.referral_code,
            referral_link: existingCustomer.referral_link,
            is_new: false,
            message: 'Welcome back! Here\'s your existing referral code.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // They exist but don't have a code yet
      console.log(`Existing customer without code, generating...`);
    } else {
      // Create new lightweight customer record
      console.log(`Creating new customer for: ${lowerEmail}`);
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          email: lowerEmail,
          first_name: sanitizedFirstName,
          name: sanitizedFirstName,
        })
        .select('id')
        .single();

      if (insertError || !newCustomer) {
        console.error('Error creating customer:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create customer record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      customerId = newCustomer.id;
      isNew = true;
    }

    // Generate referral code using the existing RPC function
    const { data: code, error: rpcError } = await supabase.rpc('issue_referral_code', {
      input_customer_id: customerId,
    });

    if (rpcError || !code) {
      console.error('Error generating referral code:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate referral code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    referralCode = code;
    const appUrl = 'https://app.alphaluxclean.com';
    referralLink = `${appUrl}/ref/${referralCode}`;

    console.log(`✅ Referral code generated: ${referralCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        referral_code: referralCode,
        referral_link: referralLink,
        is_new: isNew,
        message: isNew
          ? 'Your referral code is ready!'
          : 'Your referral code has been generated!',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
