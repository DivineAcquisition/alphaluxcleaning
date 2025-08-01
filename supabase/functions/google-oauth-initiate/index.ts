import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { redirect_uri } = await req.json();
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new Error('Google Client ID not configured');
    }

    // Google OAuth 2.0 scopes for calendar access
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    // Generate state parameter for security
    const state = crypto.randomUUID();
    
    // Build Google OAuth authorization URL
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirect_uri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    console.log('Generated OAuth URL:', authorizationUrl);

    return new Response(JSON.stringify({ 
      authorization_url: authorizationUrl,
      state: state 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-oauth-initiate:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});