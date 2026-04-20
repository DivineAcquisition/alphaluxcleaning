import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestSubcontractorRequest {
  email?: string;
  password?: string;
  fullName?: string;
  tier?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Default test data
    const defaultData: TestSubcontractorRequest = {
      email: 'test-subcontractor@example.com',
      password: 'TestPassword123!',
      fullName: 'Test Subcontractor User',
      tier: '60_40'
    };

    let requestData = defaultData;
    
    // Try to parse request body if present
    if (req.body) {
      try {
        const body = await req.json();
        requestData = { ...defaultData, ...body };
      } catch (e) {
        // Use default data if parsing fails
        console.log('Using default test data');
      }
    }

    console.log('Creating test subcontractor with data:', { 
      email: requestData.email, 
      fullName: requestData.fullName, 
      tier: requestData.tier 
    });

    // Step 1: Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email!,
      password: requestData.password!,
      email_confirm: true,
      user_metadata: {
        full_name: requestData.fullName
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const userId = authData.user.id;
    console.log('Created auth user with ID:', userId);

    // Step 2: Create User Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: requestData.fullName,
        phone: '555-0123'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 3: Assign Subcontractor Role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'subcontractor'
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      return new Response(
        JSON.stringify({ error: `Failed to assign role: ${roleError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 4: Create Subcontractor Record
    const { data: subcontractorData, error: subcontractorError } = await supabaseAdmin
      .from('subcontractors')
      .insert({
        user_id: userId,
        full_name: requestData.fullName,
        email: requestData.email,
        phone: '555-0123',
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        split_tier: requestData.tier,
        subscription_status: 'active',
        tier_level: 1,
        hourly_rate: 16.00,
        monthly_fee: 25.00,
        is_available: true,
        rating: 5.0,
        review_count: 0,
        completed_jobs_count: 0,
        account_status: 'active'
      })
      .select()
      .single();

    if (subcontractorError) {
      console.error('Subcontractor creation error:', subcontractorError);
      return new Response(
        JSON.stringify({ error: `Failed to create subcontractor: ${subcontractorError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 5: Create welcome notification
    const { error: notificationError } = await supabaseAdmin
      .from('subcontractor_notifications')
      .insert({
        subcontractor_id: subcontractorData.id,
        user_id: userId,
        title: 'Welcome to AlphaLux Cleaning!',
        message: 'Welcome to our team! Your test account has been created successfully.',
        type: 'welcome',
        read: false
      });

    if (notificationError) {
      console.warn('Notification creation warning:', notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test subcontractor user created successfully!',
        user: {
          id: userId,
          email: requestData.email,
          full_name: requestData.fullName
        },
        subcontractor: {
          id: subcontractorData.id,
          tier: requestData.tier,
          status: 'active'
        },
        loginCredentials: {
          email: requestData.email,
          password: requestData.password,
          note: 'Use these credentials to sign in at /auth'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});