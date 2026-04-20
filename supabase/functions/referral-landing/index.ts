import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const refCode = url.pathname.split('/').pop();
    const utmParams = Object.fromEntries(url.searchParams.entries());

    if (!refCode) {
      throw new Error('Referral code not provided');
    }

    // Validate referral code and get referrer info
    const { data: referrer } = await supabase
      .from('customers')
      .select('id, first_name, referral_code')
      .eq('referral_code', refCode)
      .single();

    if (!referrer) {
      return new Response(
        generateErrorPage('Invalid Referral Code', 'This referral link is not valid.'),
        {
          status: 404,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Log attribution event
    await supabase
      .from('attribution_events')
      .insert({
        event: 'REFERRAL_LINK_VISITED',
        payload: {
          referral_code: refCode,
          referrer_customer_id: referrer.id,
          utms: utmParams,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      });

    // Generate landing page HTML
    const html = generateLandingPage(referrer, refCode, utmParams);

    return new Response(html, {
      status: 200,
      headers: { 
        "Content-Type": "text/html", 
        ...corsHeaders,
        // Set referral cookie
        "Set-Cookie": `ref_code=${refCode}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
      },
    });

  } catch (error: any) {
    console.error("Error in referral-landing:", error);
    return new Response(
      generateErrorPage('Error', 'Something went wrong with this referral link.'),
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

function generateLandingPage(referrer: any, refCode: string, utmParams: any) {
  const appUrl = "https://app.alphaluxclean.com";
  const bookingUrl = `${appUrl}/start?ref=${refCode}&${new URLSearchParams(utmParams).toString()}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$25 Off Your First Clean - AlphaLux Cleaning</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #ECC98B 0%, #d4a574 100%);
            padding: 40px 30px;
            text-align: center;
            color: #1A1A1A;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .discount {
            font-size: 48px;
            font-weight: bold;
            margin: 20px 0;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .referrer-message {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
        }
        
        .benefits {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .benefit {
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            text-align: center;
        }
        
        .benefit-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .benefit-title {
            font-weight: bold;
            color: #1A1A1A;
            margin-bottom: 8px;
        }
        
        .benefit-text {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        
        .cta-button {
            background: #ECC98B;
            color: #1A1A1A;
            border: none;
            padding: 16px 40px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 12px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(236, 201, 139, 0.4);
        }
        
        .terms {
            font-size: 12px;
            color: #999;
            margin-top: 30px;
            line-height: 1.5;
        }
        
        @media (max-width: 600px) {
            .discount {
                font-size: 36px;
            }
            
            .benefits {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AlphaLux Cleaning</div>
            <div class="discount">$25 OFF</div>
            <div>Your First Professional Cleaning</div>
        </div>
        
        <div class="content">
            <div class="referrer-message">
                🎉 ${referrer.first_name} sent you this exclusive offer!
            </div>
            
            <div class="benefits">
                <div class="benefit">
                    <div class="benefit-icon">🏠</div>
                    <div class="benefit-title">Professional Teams</div>
                    <div class="benefit-text">Bonded & insured cleaners with full background checks</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">⚡</div>
                    <div class="benefit-title">Same-Day Booking</div>
                    <div class="benefit-text">Book in under 60 seconds, service as soon as today</div>
                </div>
                <div class="benefit">
                    <div class="benefit-icon">💯</div>
                    <div class="benefit-title">100% Guaranteed</div>
                    <div class="benefit-text">Not happy? We'll make it right or refund you</div>
                </div>
            </div>
            
            <a href="${bookingUrl}" class="cta-button">
                Claim $25 Off - Start Booking →
            </a>
            
            <div class="terms">
                Valid for new customers only. $25 discount applied to first cleaning service.
                When you complete your booking, ${referrer.first_name} will also receive $25 credit.
                Offer expires 30 days from clicking this link.
            </div>
        </div>
    </div>
    
    <script>
        // Track conversion for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'referral_landing_view', {
                'referral_code': '${refCode}',
                'referrer_name': '${referrer.first_name}'
            });
        }
    </script>
</body>
</html>
  `;
}

function generateErrorPage(title: string, message: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AlphaLux Cleaning</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            max-width: 400px;
        }
        
        .title {
            color: #1A1A1A;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        
        .message {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .cta-button {
            background: #ECC98B;
            color: #1A1A1A;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">${title}</div>
        <div class="message">${message}</div>
        <a href="https://app.alphaluxclean.com" class="cta-button">
            Visit AlphaLux Cleaning
        </a>
    </div>
</body>
</html>
  `;
}

serve(handler);