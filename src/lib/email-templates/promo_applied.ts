export const promoAppliedTemplate = {
  subject: "Your promo has been applied! 🎉",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promo Code Applied</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .promo-badge { background: #10b981; color: white; display: inline-block; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .total { font-size: 20px; font-weight: bold; color: #10b981; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 Promo Code Applied!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your discount has been successfully applied</p>
    </div>
    
    <div class="content">
      <p>Hi there,</p>
      
      <p>Great news! We've successfully applied your promo code to your booking:</p>
      
      <div style="text-align: center;">
        <div class="promo-badge">PROMO CODE</div>
        <p style="font-size: 24px; color: #10b981; font-weight: bold; margin: 0;">
          DISCOUNT OFF
        </p>
      </div>
      
      <div class="details">
        <h3 style="margin-top: 0; color: #374151;">Updated Booking Summary</h3>
        
        <div class="detail-row">
          <span>Service Date:</span>
          <strong>DATE</strong>
        </div>
        
        <div class="detail-row">
          <span>Service Time:</span>
          <strong>TIME</strong>
        </div>
        
        <div class="detail-row">
          <span>Original Total:</span>
          <span style="text-decoration: line-through; color: #6b7280;">ORIGINAL</span>
        </div>
        
        <div class="detail-row">
          <span>Promo Discount:</span>
          <span style="color: #10b981; font-weight: bold;">DISCOUNT</span>
        </div>
        
        <div class="detail-row" style="margin-top: 10px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
          <span style="font-size: 18px; font-weight: bold;">New Total:</span>
          <span class="total">NEW TOTAL</span>
        </div>
      </div>
      
      <p>Your savings have been applied to your booking. We can't wait to provide you with our premium cleaning service!</p>
      
      <div style="text-align: center;">
        <a href="https://app.alphaluxclean.com/order-status" class="button">View Your Booking</a>
      </div>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        Questions? Reply to this email or call us at (857) 754-4557
      </p>
    </div>
    
    <div class="footer">
      <p>AlphaLux Cleaning - Premium Cleaning Services</p>
      <p>Texas & California</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
        This is an automated confirmation email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `,
  text: `Hi there,

Great news! We've successfully applied your promo code to your booking.

Promo Code: CODE
Discount: DISCOUNT OFF

UPDATED BOOKING SUMMARY
-----------------------
Service Date: DATE
Service Time: TIME

Original Total: ORIGINAL
Promo Discount: DISCOUNT
New Total: NEW TOTAL

Your savings have been applied to your booking. We can't wait to provide you with our premium cleaning service!

View your booking: https://app.alphaluxclean.com/order-status

Questions? Reply to this email or call us at (857) 754-4557

---
AlphaLux Cleaning - Premium Cleaning Services
Texas & California`
};
