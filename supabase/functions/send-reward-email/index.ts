import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const resend = new Resend(resendApiKey);

    const { 
      customerEmail, 
      customerName, 
      rewardCode, 
      expiryDate, 
      frequency 
    } = await req.json();

    console.log('Sending reward email to:', customerEmail);

    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://app.alphaluxclean.com';
    const bookingUrl = `${appUrl}/guest-booking?promo=${rewardCode}&service=deep-clean&utm_source=email&utm_medium=reward`;

    const emailResponse = await resend.emails.send({
      from: 'AlphaLuxClean <no-reply@info.alphaluxcleaning.com>',
      to: [customerEmail],
      subject: 'Your 30% Deep Clean Reward',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Deep Clean Reward</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="text-align: center; padding: 30px 0; border-bottom: 3px solid #ECC98B;">
              <h1 style="color: #ECC98B; margin: 0; font-size: 28px;">Reward Unlocked!</h1>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px 0;">
              <p style="font-size: 16px;">Hi ${customerName},</p>
              
              <p style="font-size: 16px;">
                Thanks for starting a <strong>${frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'}</strong> plan with AlphaLuxClean!
              </p>

              <p style="font-size: 16px;">
                As promised, here's your exclusive reward code for a Deep Clean:
              </p>

              <!-- Reward Code Box -->
              <div style="background: linear-gradient(135deg, #ECC98B 0%, #D4AF37 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="color: white; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Reward Code</p>
                <p style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 0; font-family: 'Courier New', monospace;">
                  ${rewardCode}
                </p>
                <p style="color: white; font-size: 14px; margin: 10px 0 0 0;">
                  30% OFF your next Deep Clean
                </p>
              </div>

              <!-- Details -->
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ECC98B; font-size: 18px;">How to Use Your Reward</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li style="margin: 8px 0;">Valid for Deep Clean services only</li>
                  <li style="margin: 8px 0;">Save 30% on your pre-tax total</li>
                  <li style="margin: 8px 0;">Expires on <strong>${formattedExpiryDate}</strong></li>
                  <li style="margin: 8px 0;">Cannot be combined with other offers</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${bookingUrl}" style="display: inline-block; background: #ECC98B; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Book Your Deep Clean Now
                </a>
              </div>

              <!-- Footer Note -->
              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #666;">
                  <strong>Need help?</strong> Reply to this email or call us at (857) 754-4557
                </p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                  This code is unique to your account and expires on ${formattedExpiryDate}. 
                  Save this email for your records.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; margin-top: 30px;">
              <p style="font-size: 14px; color: #999; margin: 0;">
                AlphaLuxClean - Premium Cleaning Services<br>
                <a href="https://alphaluxclean.com" style="color: #ECC98B; text-decoration: none;">alphaluxclean.com</a>
              </p>
            </div>

          </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending reward email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});