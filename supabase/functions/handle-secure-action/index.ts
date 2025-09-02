import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HMACTokenData {
  action: string;
  userId: string;
  resourceId: string;
  expiresAt: number;
  timestamp: number;
}

async function verifyHMACToken(token: string): Promise<{ valid: boolean; data?: HMACTokenData; error?: string }> {
  try {
    const [payload, signature] = token.split('.');
    
    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Verify signature using server-side secret
    const secret = Deno.env.get('HMAC_SECRET') || 'fallback-secret-for-dev';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = new Uint8Array(signature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const payloadBuffer = encoder.encode(payload);
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, payloadBuffer);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Decode and validate data
    const data: HMACTokenData = JSON.parse(atob(payload));
    
    // Check expiration
    if (Date.now() > data.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: `Token verification error: ${error.message}` };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!token) {
      return new Response('Missing token parameter', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify HMAC token
    const verification = await verifyHMACToken(token);
    
    if (!verification.valid || !verification.data) {
      // Log failed verification attempt
      await supabase
        .from('security_audit_log')
        .insert({
          action_type: 'secure_action_failed',
          resource_type: 'hmac_token',
          new_values: {
            error: verification.error,
            token_present: !!token,
            action_attempted: action,
            ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
          },
          risk_level: 'high'
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: verification.error || 'Invalid token' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const { action: tokenAction, userId, resourceId } = verification.data;

    // Validate action matches token
    if (action && action !== tokenAction) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action mismatch' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    let result: any = { success: false };

    // Execute the secure action based on type
    switch (tokenAction) {
      case 'accept_job':
        // Update job assignment
        const acceptResult = await supabase
          .from('subcontractor_job_assignments')
          .update({ 
            status: 'accepted', 
            accepted_at: new Date().toISOString(),
            response_method: 'sms_link'
          })
          .eq('id', resourceId)
          .eq('subcontractor_id', userId);

        if (acceptResult.error) {
          result = { success: false, error: 'Failed to accept job' };
        } else {
          result = { success: true, message: 'Job accepted successfully' };
          
          // Send confirmation SMS
          EdgeRuntime.waitUntil(
            supabase.functions.invoke('secure-sms-actions', {
              body: {
                to: req.headers.get('x-forwarded-for') || 'unknown', // Would get actual phone in production
                action: 'job_confirmed',
                userId,
                resourceId,
                templateData: { status: 'accepted' }
              }
            })
          );
        }
        break;

      case 'decline_job':
        const declineResult = await supabase
          .from('subcontractor_job_assignments')
          .update({ 
            status: 'declined', 
            declined_at: new Date().toISOString(),
            response_method: 'sms_link'
          })
          .eq('id', resourceId)
          .eq('subcontractor_id', userId);

        if (declineResult.error) {
          result = { success: false, error: 'Failed to decline job' };
        } else {
          result = { success: true, message: 'Job declined successfully' };
        }
        break;

      case 'confirm_timesheet':
        const timesheetResult = await supabase
          .from('job_tracking')
          .update({ 
            timesheet_confirmed: true,
            confirmed_at: new Date().toISOString(),
            confirmation_method: 'sms_link'
          })
          .eq('assignment_id', resourceId)
          .eq('subcontractor_id', userId);

        if (timesheetResult.error) {
          result = { success: false, error: 'Failed to confirm timesheet' };
        } else {
          result = { success: true, message: 'Timesheet confirmed successfully' };
        }
        break;

      case 'approve_payout':
        const payoutResult = await supabase
          .from('subcontractor_payments')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString(),
            approval_method: 'sms_link'
          })
          .eq('id', resourceId)
          .eq('subcontractor_id', userId);

        if (payoutResult.error) {
          result = { success: false, error: 'Failed to approve payout' };
        } else {
          result = { success: true, message: 'Payout approved successfully' };
        }
        break;

      default:
        result = { success: false, error: 'Unknown action type' };
    }

    // Log the action execution
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: userId,
        action_type: `secure_action_${result.success ? 'executed' : 'failed'}`,
        resource_type: tokenAction,
        resource_id: resourceId,
        new_values: {
          action: tokenAction,
          result: result.success,
          error: result.error || null,
          method: 'sms_link',
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown'
        },
        risk_level: result.success ? 'low' : 'medium'
      });

    // Mark token as used (in production, store used tokens to prevent replay)
    EdgeRuntime.waitUntil(
      supabase
        .from('used_hmac_tokens')
        .insert({
          token_hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)),
          user_id: userId,
          action: tokenAction,
          resource_id: resourceId,
          used_at: new Date().toISOString()
        })
    );

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in handle-secure-action function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});