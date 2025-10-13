import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  notificationId?: string;
  customerId?: string;
  templateId?: string;
  variables?: Record<string, any>;
  provider?: 'openphone' | 'twilio' | 'auto';
  enableFallback?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      message, 
      notificationId, 
      customerId, 
      templateId, 
      variables,
      provider = 'auto',
      enableFallback = true
    }: SMSRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let selectedProvider = provider;
    
    // Auto-select provider based on available credentials
    if (provider === 'auto') {
      const hasOpenPhone = Deno.env.get('OPENPHONE_API_KEY') && Deno.env.get('OPENPHONE_PHONE_NUMBER_ID');
      const hasTwilio = Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN');
      
      // Prefer OpenPhone if available
      if (hasOpenPhone) {
        selectedProvider = 'openphone';
      } else if (hasTwilio) {
        selectedProvider = 'twilio';
      } else {
        throw new Error('No SMS provider configured');
      }
    }

    console.log(`Attempting to send SMS via ${selectedProvider}`);

    // Try primary provider
    try {
      const functionName = selectedProvider === 'openphone' 
        ? 'send-openphone-sms' 
        : 'enhanced-sms-notification';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { to, message, notificationId, customerId, templateId, variables }
      });

      if (error) throw error;
      
      if (data?.success) {
        console.log(`SMS sent successfully via ${selectedProvider}`);
        return new Response(JSON.stringify({
          success: true,
          provider: selectedProvider,
          data
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (primaryError: any) {
      console.error(`Primary provider ${selectedProvider} failed:`, primaryError);
      
      // Try fallback if enabled
      if (enableFallback) {
        const fallbackProvider = selectedProvider === 'openphone' ? 'twilio' : 'openphone';
        const fallbackFunction = fallbackProvider === 'openphone' 
          ? 'send-openphone-sms' 
          : 'enhanced-sms-notification';
        
        console.log(`Attempting fallback to ${fallbackProvider}`);
        
        try {
          const { data, error } = await supabase.functions.invoke(fallbackFunction, {
            body: { to, message, notificationId, customerId, templateId, variables }
          });

          if (error) throw error;
          
          if (data?.success) {
            console.log(`SMS sent successfully via fallback provider ${fallbackProvider}`);
            return new Response(JSON.stringify({
              success: true,
              provider: fallbackProvider,
              fallback: true,
              data
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (fallbackError: any) {
          console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
          throw new Error(`Both providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
        }
      } else {
        throw primaryError;
      }
    }

    throw new Error('SMS sending failed without specific error');

  } catch (error: any) {
    console.error('Unified SMS Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
