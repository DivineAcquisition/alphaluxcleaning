-- Add missing referral_code email template
INSERT INTO email_templates (name, subject, html) VALUES (
  'referral_code',
  'Share your referral code: {{referral_code}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px;">
    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 30px;">
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0;">AlphaLuxClean</h1>
    </div>
    
    <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">Give $25, Get $25! 🎉</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi {{owner_name}},
    </p>
    
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Thank you for choosing AlphaLuxClean! We hope you love your cleaning service. Now you can earn rewards by sharing the luxury with your friends and family.
    </p>
    
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="color: #0369a1; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Your Referral Code</h3>
      <div style="background: #ffffff; border: 2px dashed #0369a1; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 2px;">{{referral_code}}</span>
      </div>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      <strong>How it works:</strong>
    </p>
    <ul style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0; padding-left: 20px;">
      <li>Share your code with friends and family</li>
      <li>They get $25 off their first cleaning</li>
      <li>You earn $25 credit after their service is completed</li>
      <li>No limit on referrals!</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{referral_link}}" style="background-color: #A58FFF; border-radius: 6px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 12px 24px;">
        Share Your Link
      </a>
    </div>
    
    <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Or copy and share this link directly:<br>
      <a href="{{referral_link}}" style="color: #0369a1; word-break: break-all;">{{referral_link}}</a>
    </p>
    
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        AlphaLuxClean<br>
        📧 info@alphaluxclean.com | 📞 (281) 809-9901
      </p>
    </div>
  </div>'
) ON CONFLICT (name) DO UPDATE SET
  subject = EXCLUDED.subject,
  html = EXCLUDED.html,
  updated_at = now();