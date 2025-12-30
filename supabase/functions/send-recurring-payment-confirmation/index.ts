import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RECURRING-PAYMENT-CONFIRMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      bookingId,
      customerId,
      customerEmail,
      customerName,
      amountPaid,
      paymentNumber,
      totalPayments,
      remainingBalance,
    } = await req.json();

    logStep('Sending recurring payment confirmation', { 
      bookingId, 
      customerEmail, 
      paymentNumber, 
      amountPaid 
    });

    if (!customerEmail || !bookingId) {
      throw new Error('Missing required fields');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Determine the message based on payment number
    let subject: string;
    let statusMessage: string;

    if (paymentNumber === totalPayments) {
      subject = '🎉 Final Payment Complete - 90-Day Plan Finished!';
      statusMessage = `Congratulations! This was your final payment. Your 90-Day Reset & Maintain Plan is now complete.`;
    } else {
      subject = `✅ Monthly Payment ${paymentNumber} of ${totalPayments} Received`;
      const paymentsRemaining = totalPayments - paymentNumber;
      statusMessage = `Payment ${paymentNumber} of ${totalPayments} has been processed. You have ${paymentsRemaining} payment${paymentsRemaining > 1 ? 's' : ''} remaining.`;
    }

    // Build the email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmation</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName || 'Valued Customer'},</p>
          
          <p style="font-size: 16px;">${statusMessage}</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #1a365d;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Amount Paid</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #16a34a;">$${amountPaid.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Payment</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${paymentNumber} of ${totalPayments}</td>
              </tr>
              ${remainingBalance > 0 ? `
              <tr>
                <td style="padding: 8px 0;">Remaining Balance</td>
                <td style="padding: 8px 0; text-align: right;">$${remainingBalance.toFixed(2)}</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-weight: bold;">✓ Fully Paid</td>
                <td style="padding: 8px 0; text-align: right; color: #16a34a; font-weight: bold;">$0.00 remaining</td>
              </tr>
              `}
            </table>
          </div>
          
          ${paymentNumber < totalPayments ? `
          <p style="font-size: 14px; color: #64748b;">
            Your next payment of $${amountPaid.toFixed(2)} will be automatically charged in approximately 30 days. 
            No action is needed on your part.
          </p>
          ` : `
          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: 500;">
              🎉 Thank you for completing your 90-Day Reset & Maintain Plan! We hope you've enjoyed 
              consistently clean spaces and look forward to serving you again.
            </p>
          </div>
          `}
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
            Questions? Reply to this email or call us at (972) 559-0223
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              AlphaLux Clean | Professional Cleaning Services
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend via the send-system-email function
    const { error: emailError } = await supabaseClient.functions.invoke('send-system-email', {
      body: {
        to: customerEmail,
        subject,
        html: emailHtml,
        templateKey: 'recurring_payment_confirmation',
      }
    });

    if (emailError) {
      logStep('Email send error', { error: emailError });
    }

    // Log the email event
    await supabaseClient.from('email_events').insert({
      event: 'sent',
      template: 'recurring_payment_confirmation',
      to_email: customerEmail,
      meta: {
        booking_id: bookingId,
        payment_number: paymentNumber,
        amount_paid: amountPaid,
      }
    });

    logStep('Confirmation email sent successfully', { customerEmail, paymentNumber });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
