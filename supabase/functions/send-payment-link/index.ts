import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { resolveSupportNumber } from "../_shared/openphone.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentLinkRequest {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  depositAmount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, customerEmail, customerName, depositAmount }: PaymentLinkRequest = await req.json();

    console.log('Sending payment link:', { bookingId, customerEmail, depositAmount });

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Mint (or reuse) the pay token. The link used to address the booking
    // by raw UUID, which meant anyone holding an id — they travel through
    // webhooks, logs and admin URLs — could read the customer's name,
    // address and price. The token is the credential; the id is not.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('pay_page_token, zip_code, state, customer_id')
      .eq('id', bookingId)
      .maybeSingle();

    let payToken = existing?.pay_page_token as string | undefined;
    if (!payToken) {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      payToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const { error: tokenError } = await supabaseAdmin
        .from('bookings')
        .update({ pay_page_token: payToken })
        .eq('id', bookingId);
      if (tokenError) throw new Error(`Could not mint pay token: ${tokenError.message}`);
    }

    const appUrl = Deno.env.get('BOOKING_ORIGIN') || Deno.env.get('APP_URL') || '';
    const paymentUrl = `${appUrl}/pay/${payToken}`;

    let supportPhone = '';
    let supportTel = '';
    try {
      const { data: customer } = existing?.customer_id
        ? await supabaseAdmin.from('customers').select('state, postal_code').eq('id', existing.customer_id).maybeSingle()
        : { data: null };
      const support = await resolveSupportNumber({
        state: existing?.state || customer?.state,
        zip: existing?.zip_code || customer?.postal_code,
        supabase: supabaseAdmin,
      });
      supportPhone = support.display;
      supportTel = support.e164.replace(/\D/g, '');
    } catch (err) {
      console.warn('[send-payment-link] support phone lookup failed', err);
    }

    const supportHtml = supportPhone
      ? `Call us at <a href="tel:${supportTel}" style="color: hsl(211 41% 24%); text-decoration: none;">${supportPhone}</a><br>`
      : '';

    // Send email with payment link
    const { data, error } = await resend.emails.send({
      from: 'AlphaLux Clean <booking@alphaluxcleaning.com>',
      to: [customerEmail],
      subject: 'Complete Your AlphaLux Clean Booking',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Complete Your Booking</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: hsl(211 41% 24%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">AlphaLux Clean</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Premium Cleaning Services</p>
              <div style="margin-top: 12px;">
                <span style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 16px; font-size: 12px;">
                  <span style="color: #4CAF50;">✓</span> Google Guaranteed
                </span>
              </div>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #667eea; margin-top: 0;">Hi ${customerName},</h2>
              
              <p>Thank you for booking with AlphaLux Clean! We're excited to serve you.</p>
              
              <p>To confirm your booking, please complete your payment by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentUrl}" style="background: hsl(211 41% 24%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Complete Payment ($${depositAmount})
                </a>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Deposit Due Today:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: hsl(211 41% 24%); font-size: 18px;">$${depositAmount}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Need help?</strong><br>
                ${supportHtml}
                Email us at <a href="mailto:support@alphaluxcleaning.com" style="color: hsl(211 41% 24%); text-decoration: none;">support@alphaluxcleaning.com</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
                <p>This payment link will remain active until you complete your payment.</p>
                <p style="margin: 10px 0;">AlphaLux Clean | Premium Cleaning Services</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Payment link email sent successfully:', data);

    // Log the payment link generation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('events').insert({
      type: 'PAYMENT_LINK_SENT',
      booking_id: bookingId,
      payload: {
        customer_email: customerEmail,
        payment_url: paymentUrl,
        deposit_amount: depositAmount,
        sent_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment link sent successfully',
        paymentUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-payment-link function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
