import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action'); // 'accept' or 'decline'
    const reason = url.searchParams.get('reason'); // Optional decline reason

    if (!token || !action) {
      throw new Error('Missing token or action parameter');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate token
    const { data: assignmentToken, error: tokenError } = await supabaseClient
      .from('assignment_tokens')
      .select('*, bookings(*), subcontractors(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (tokenError || !assignmentToken) {
      return generateResponsePage(
        'Invalid or Expired Link',
        'This assignment link is invalid or has expired. Please contact your supervisor.',
        'error'
      );
    }

    // Mark token as used
    await supabaseClient
      .from('assignment_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', assignmentToken.id);

    if (action === 'accept') {
      // Accept the assignment
      await supabaseClient
        .from('bookings')
        .update({
          status: 'confirmed',
          assigned_employee_id: assignmentToken.subcontractor_id
        })
        .eq('id', assignmentToken.booking_id);

      // Create initial checkpoint record
      await supabaseClient
        .from('checkpoints')
        .insert({
          booking_id: assignmentToken.booking_id,
          subcontractor_id: assignmentToken.subcontractor_id,
          company_id: assignmentToken.bookings.company_id || '550e8400-e29b-41d4-a716-446655440000',
          type: 'assignment_accepted',
          notes: 'Job assignment accepted via email link'
        });

      return generateResponsePage(
        '✅ Assignment Accepted!',
        `Thank you ${assignmentToken.subcontractors.full_name}! You have successfully accepted this cleaning assignment. You will receive further instructions closer to the service date.`,
        'success'
      );

    } else if (action === 'decline') {
      // Decline the assignment
      await supabaseClient
        .from('bookings')
        .update({
          status: 'pending',
          assigned_employee_id: null
        })
        .eq('id', assignmentToken.booking_id);

      // Log the decline reason
      await supabaseClient
        .from('checkpoints')
        .insert({
          booking_id: assignmentToken.booking_id,
          subcontractor_id: assignmentToken.subcontractor_id,
          company_id: assignmentToken.bookings.company_id || '550e8400-e29b-41d4-a716-446655440000',
          type: 'assignment_declined',
          notes: reason || 'Job assignment declined via email link'
        });

      // TODO: Trigger reassignment to next available subcontractor
      // This could call another edge function to find and notify the next best match

      return generateResponsePage(
        '❌ Assignment Declined',
        `Your decline has been recorded. The job will be reassigned to another cleaner. ${reason ? `Reason: ${reason}` : ''}`,
        'info'
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error("Error in assignment-response:", error);
    return generateResponsePage(
      'Error Processing Response',
      'There was an error processing your response. Please contact support if this continues.',
      'error'
    );
  }
};

function generateResponsePage(title: string, message: string, type: 'success' | 'error' | 'info'): Response {
  const colors = {
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
  };

  const color = colors[type];
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #A58FFF 0%, #6600FF 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: ${color.bg};
            border: 2px solid ${color.border};
            padding: 32px;
            text-align: center;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: ${color.text};
            margin-bottom: 8px;
          }
          .content {
            padding: 32px;
            text-align: center;
          }
          .message {
            font-size: 16px;
            line-height: 1.6;
            color: #374151;
            margin-bottom: 24px;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-text {
            font-size: 14px;
            color: #6b7280;
          }
          .logo {
            font-weight: 700;
            color: #6600FF;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${icon}</div>
            <h1 class="title">${title}</h1>
          </div>
          <div class="content">
            <p class="message">${message}</p>
          </div>
          <div class="footer">
            <p class="footer-text">
              <span class="logo">Bay Area Cleaning Professionals</span><br>
              Professional cleaning services you can trust
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      ...corsHeaders,
    },
  });
}

serve(handler);