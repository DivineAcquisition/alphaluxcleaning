import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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

    // Get app URL from environment or use default
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://book.alphaluxclean.com';
    const paymentUrl = `${appUrl}/pay/${bookingId}`;

    // Send email with payment link
    const { data, error } = await resend.emails.send({
      from: 'AlphaLux Clean <booking@alphaluxclean.com>',
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
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">AlphaLux Clean</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Premium Cleaning Services</p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #667eea; margin-top: 0;">Hi ${customerName},</h2>
              
              <p>Thank you for booking with AlphaLux Clean! We're excited to serve you.</p>
              
              <p>To confirm your booking, please complete your payment by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${paymentUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Complete Payment ($${depositAmount})
                </a>
              </div>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Deposit Due Today:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #667eea; font-size: 18px;">$${depositAmount}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Need help?</strong><br>
                Call us at <a href="tel:2149197134" style="color: #667eea; text-decoration: none;">(214) 919-7134</a><br>
                Email us at <a href="mailto:support@alphaluxclean.com" style="color: #667eea; text-decoration: none;">support@alphaluxclean.com</a>
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
