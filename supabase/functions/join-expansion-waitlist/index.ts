import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WaitlistRequest {
  email: string;
  zip_code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { email, zip_code }: WaitlistRequest = await req.json();

    // Validate input
    if (!email || !zip_code) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email and ZIP code are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate ZIP code format (5 digits)
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(zip_code)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid ZIP code format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into waitlist
    const { data, error } = await supabase
      .from('expansion_waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        zip_code: zip_code.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      // Handle unique constraint violation (duplicate entry)
      if (error.code === '23505') {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'You are already on the waitlist for this ZIP code!' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to join waitlist. Please try again.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Waitlist entry created:', data);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Thank you! We've added you to our expansion waitlist for ZIP code ${zip_code}. We'll notify you when we start servicing your area.`,
      data: {
        id: data.id,
        email: data.email,
        zip_code: data.zip_code,
        created_at: data.created_at
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in join-expansion-waitlist function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);