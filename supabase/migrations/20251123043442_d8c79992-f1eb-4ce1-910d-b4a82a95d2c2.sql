-- Insert missing lead_welcome email template
INSERT INTO email_templates (name, subject, html)
VALUES (
  'lead_welcome',
  'Welcome to AlphaLuxClean! Get Your Instant Price 🎉',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #1A1A1A; font-size: 28px; font-weight: bold; margin: 0 0 24px 0;">
                Hi {{first_name}}! 👋
              </h1>
              
              <p style="color: #1A1A1A; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thanks for your interest in AlphaLuxClean! We make booking premium house cleaning as easy as ordering takeout.
              </p>

              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="padding: 0 10px 20px 0; vertical-align: top; width: 50%;">
                    <p style="font-size: 16px; font-weight: bold; color: #1A1A1A; margin: 0 0 8px 0;">📍 Size-Based Pricing</p>
                    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">Fair, transparent rates based on your home''s square footage</p>
                  </td>
                  <td style="padding: 0 0 20px 10px; vertical-align: top; width: 50%;">
                    <p style="font-size: 16px; font-weight: bold; color: #1A1A1A; margin: 0 0 8px 0;">⚡ Instant Booking</p>
                    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">Pick your size, see your price, book in under 60 seconds</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 10px 0 0; vertical-align: top; width: 50%;">
                    <p style="font-size: 16px; font-weight: bold; color: #1A1A1A; margin: 0 0 8px 0;">🛡️ Bonded & Insured</p>
                    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">Professional teams with full background checks</p>
                  </td>
                  <td style="padding: 0 0 0 10px; vertical-align: top; width: 50%;">
                    <p style="font-size: 16px; font-weight: bold; color: #1A1A1A; margin: 0 0 8px 0;">💯 Satisfaction Guaranteed</p>
                    <p style="font-size: 14px; color: #666; margin: 0; line-height: 1.5;">Not happy? We''ll make it right or refund you</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; text-align: center; margin: 40px 0;">
                <tr>
                  <td>
                    <a href="{{app_url}}/start?prefill={{email}}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 8px;">
                      Get My Instant Price →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #999; text-align: center; margin: 16px 0 0 0;">
                Takes less than a minute. No surprises, no hidden fees.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9f9f9; border-top: 1px solid #eee; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="font-size: 12px; color: #999; margin: 0 0 8px 0;">
                AlphaLuxClean - Premium House Cleaning
              </p>
              <p style="font-size: 12px; color: #999; margin: 0;">
                Questions? Reply to this email or call {{support_phone}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'
)
ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html = EXCLUDED.html,
  updated_at = now();