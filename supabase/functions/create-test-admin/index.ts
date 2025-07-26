import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminCreationRequest {
  email?: string;
  password?: string;
  fullName?: string;
  secretCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData: AdminCreationRequest = {};
    
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
      } catch (e) {
        console.log('No JSON body provided, using defaults');
      }
    }

    console.log('Creating admin user with data:', { email: requestData.email, hasPassword: !!requestData.password });
    
    // Validate secret code if provided
    const ADMIN_SECRET_CODES = [
      'BACP_ADMIN_2024_DIVINE',
      'SUPER_SECURE_ADMIN_KEY_2024',
      'DIVINE_ACQUISITION_ADMIN_2024'
    ];

    if (requestData.secretCode && !ADMIN_SECRET_CODES.includes(requestData.secretCode)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid secret code. Access denied.' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Use provided data or defaults
    const email = requestData.email || 'admin@test.com';
    const password = requestData.password || 'admin123';
    const fullName = requestData.fullName || 'Test Admin';

    // Create the admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: createError.message 
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (newUser?.user) {
      // Add admin role to user_roles table
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'admin'
        });

      if (roleError) {
        console.error('Error adding role:', roleError);
      }

      console.log('Test admin user created successfully:', newUser.user.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test admin user created successfully',
        user: newUser?.user
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in create-test-admin function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);