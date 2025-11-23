import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCustomerAccountRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { customerEmail, customerName, customerPhone, orderId }: CreateCustomerAccountRequest = await req.json();

    console.log('Creating customer account for:', customerEmail);

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserByEmail(customerEmail);
    
    if (userCheckError && userCheckError.message !== "User not found") {
      throw new Error(`Error checking existing user: ${userCheckError.message}`);
    }

    // If user already exists, return early
    if (existingUser?.user) {
      console.log('Customer account already exists for:', customerEmail);
      return new Response(JSON.stringify({
        success: true,
        message: "Customer account already exists",
        accountCreated: false,
        userId: existingUser.user.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Generate a temporary password
    const tempPassword = 'BayArea' + Math.random().toString(36).substring(2, 10).toUpperCase() + '!';

    console.log('Creating new customer account...');

    // Create new user account
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: { 
        full_name: customerName, 
        phone: customerPhone,
        account_created_via: 'booking_confirmation'
      }
    });

    if (createError || !newUser?.user) {
      throw new Error(`Failed to create user account: ${createError?.message}`);
    }

    console.log('Customer account created successfully:', newUser.user.id);

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: customerName,
        phone: customerPhone,
        customer_since: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the entire process if profile creation fails
    }

    // Create customer notification for the welcome message
    const { error: notificationError } = await supabase
      .from('customer_notifications')
      .insert({
        customer_id: newUser.user.id,
        title: 'Welcome to Bay Area Cleaning Pros!',
        message: `Your account has been created automatically. Your temporary password is: ${tempPassword}. Please log in to your customer portal at portal.alphaluxclean.com and change your password for security.`,
        action_url: 'https://portal.alphaluxclean.com',
        action_label: 'Access Customer Portal'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Send welcome email with temporary password
    try {
      const portalUrl = 'https://portal.alphaluxclean.com';
      
      const emailResponse = await resend.emails.send({
        from: "AlphaLuxClean <noreply@info.alphaluxclean.com>",
        to: [customerEmail],
        subject: "Welcome to Bay Area Cleaning Pros - Your Account is Ready!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Bay Area Cleaning Pros!</h1>
              <p style="color: #666; font-size: 16px;">Your account has been automatically created</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin-top: 0;">Account Details</h2>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
              <h3 style="color: #92400e; margin-top: 0;">🔒 Important Security Notice</h3>
              <p style="color: #92400e; margin-bottom: 0;">Please log in to your customer portal and change your password immediately for security reasons.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Customer Portal
              </a>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #065f46; margin-top: 0;">✨ What you can do in your customer portal:</h3>
              <ul style="color: #065f46; margin-bottom: 0;">
                <li>Track your current and upcoming services</li>
                <li>View your service history and invoices</li>
                <li>Manage your payment methods</li>
                <li>Schedule additional cleanings</li>
                <li>Update your contact information</li>
                <li>Communicate with our team</li>
              </ul>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #334155; margin-top: 0;">📞 Need Help?</h3>
              <p style="color: #334155; margin-bottom: 0;">
                If you have any questions or need assistance, please don't hesitate to contact us:<br>
                Email: support@alphaluxclean.com<br>
                Phone: (510) 882-4388
              </p>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #666; font-size: 14px;">
              <p>Thank you for choosing Bay Area Cleaning Pros!</p>
              <p>We're excited to provide you with exceptional cleaning services.</p>
            </div>
          </div>
        `,
      });

      console.log('Welcome email sent successfully:', emailResponse);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the entire process if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Customer account created successfully and welcome email sent",
      accountCreated: true,
      userId: newUser.user.id,
      tempPassword: tempPassword // Include for testing/debugging purposes
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error('Error in create-customer-account function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});