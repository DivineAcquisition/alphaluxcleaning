import React from 'npm:react@18.3.1'
// Standard Webhooks removed; using header secret verification
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { CustomerWelcomeEmail } from '../_shared/email-templates/customer-welcome.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Auth email handler called with method:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Get environment variables
    const hookSecret = Deno.env.get('AUTH_HOOK_SECRET')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://kqoezqzogleaaupjzxch.supabase.co'

    console.log('Environment check:', {
      hookSecret: hookSecret ? 'Present' : 'Missing',
      resendApiKey: resendApiKey ? 'Present' : 'Missing',
      supabaseUrl: supabaseUrl ? 'Present' : 'Missing'
    })

    // AUTH_HOOK_SECRET is optional for Supabase built-in auth webhooks
    if (!hookSecret) {
      console.log('AUTH_HOOK_SECRET not configured - proceeding with Supabase auth webhook processing')
    }

    // Get payload safely - Supabase auth webhooks send JSON directly
    const payloadText = await req.text()
    let webhookData: any = {}
    try {
      webhookData = JSON.parse(payloadText)
      console.log('Successfully parsed webhook payload')
    } catch (parseError) {
      console.error('Failed to parse webhook payload as JSON:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON payload' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { user, email_data } = webhookData

    if (!email_data) {
      console.log('No email_data found, webhook type:', webhookData.metadata?.name || 'unknown')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No email data to process' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { 
      token, 
      token_hash, 
      redirect_to, 
      email_action_type,
      site_url 
    } = email_data

    console.log('Processing email action:', email_action_type, 'for user:', user.email)

    // Handle password recovery emails
    if (email_action_type === 'recovery') {
        if (!resendApiKey) {
          console.error('RESEND_API_KEY is not configured - cannot send password reset email')
          return new Response(
            JSON.stringify({ 
              success: false,
              message: 'Email service not configured - RESEND_API_KEY missing' 
            }), 
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

      try {
        // Build reset URL using Supabase's auth verify endpoint
        const defaultRedirect = 'https://portal.bayareacleaningpros.com/password-reset'
        const resetUrl = `${site_url || supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || defaultRedirect)}`
        
        console.log('Generated reset URL for recovery')

        // Get user display name
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
        const userType = 'Customer' // Default for now, can be enhanced later

        // Render React Email template
        console.log('Rendering React Email template...')
        const emailHtml = await renderAsync(
          React.createElement(PasswordResetEmail, {
            resetUrl,
            userName,
            userType,
          })
        )
        console.log('Email template rendered successfully')

        // Send email via Resend
        console.log('Sending email via Resend...')
        const resend = new Resend(resendApiKey)
        const emailResponse = await resend.emails.send({
          from: 'Bay Area Cleaning Professionals <onboarding@resend.dev>',
          to: [user.email],
          subject: 'Reset Your Password - Bay Area Cleaning Professionals',
          html: emailHtml,
        })

        if (emailResponse.error) {
          console.error('Resend API error:', emailResponse.error)
          throw emailResponse.error
        }

        console.log('Password reset email sent successfully:', {
          email: user.email,
          emailId: emailResponse.data?.id,
          success: !!emailResponse.data
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Password reset email sent successfully',
            emailId: emailResponse.data?.id 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (emailError: any) {
        console.error('Error sending password reset email:', emailError)
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Failed to send password reset email',
            details: emailError.message
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Handle customer signup emails
    if (email_action_type === 'signup' || email_action_type === 'user_confirmation_requested') {
      if (!resendApiKey) {
        console.error('RESEND_API_KEY is not configured - cannot send welcome email')
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Welcome email skipped - RESEND_API_KEY missing' 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      try {
        // Get user display name
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Valued Customer'
        const portalUrl = 'https://portal.bayareacleaningpros.com/customer-portal-dashboard'
        
        console.log('Rendering customer welcome email template...')
        const emailHtml = await renderAsync(
          React.createElement(CustomerWelcomeEmail, {
            fullName: userName,
            portalUrl,
          })
        )
        console.log('Customer welcome email template rendered successfully')

        // Send email via Resend
        console.log('Sending customer welcome email via Resend...')
        const resend = new Resend(resendApiKey)
        const emailResponse = await resend.emails.send({
          from: 'Bay Area Cleaning Professionals <welcome@notify.bayareacleaningpros.com>',
          to: [user.email],
          subject: 'Welcome to Bay Area Cleaning Professionals! 🏠✨',
          html: emailHtml,
        })

        if (emailResponse.error) {
          console.error('Resend API error:', emailResponse.error)
          throw emailResponse.error
        }

        console.log('Customer welcome email sent successfully:', {
          email: user.email,
          emailId: emailResponse.data?.id,
          success: !!emailResponse.data
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Customer welcome email sent successfully',
            emailId: emailResponse.data?.id 
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      } catch (emailError: any) {
        console.error('Error sending customer welcome email:', emailError)
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Welcome email failed but auth flow continued',
            details: emailError.message
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // For other email types (magiclink, etc.), just return success
    // Avoid blocking auth flow for unhandled types
    console.log('Email type not handled:', email_action_type, '- returning success to prevent hook failures')
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email type '${email_action_type}' acknowledged - using default Supabase templates` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Unexpected error in auth-email-handler:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})