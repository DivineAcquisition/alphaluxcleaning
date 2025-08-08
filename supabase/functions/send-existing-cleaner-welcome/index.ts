import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1"
import { Resend } from "npm:resend@4.0.0"
import { renderAsync } from "npm:@react-email/components@0.0.22"
import React from "npm:react@18.3.1"
import { ExistingCleanerWelcomeEmail } from "../_shared/email-templates/existing-cleaner-welcome.tsx"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  console.log(`[EXISTING_CLEANER_WELCOME] ${step}`, details ? JSON.stringify(details, null, 2) : '')
}

interface WelcomeEmailRequest {
  email: string
  fullName: string
  onboardingToken: string
  dashboardPassword: string
  tierLevel: number
  hourlyRate: number
  monthlyFee: number
  userId?: string
  subcontractorId?: string
}

serve(async (req) => {
  logStep('Function invoked', { method: req.method })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize services
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    const resend = new Resend(resendApiKey)
    logStep('Resend initialized')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    logStep('Supabase client initialized')

    // Parse request body
    const {
      email,
      fullName,
      onboardingToken,
      dashboardPassword,
      tierLevel,
      hourlyRate,
      monthlyFee,
      userId,
      subcontractorId
    }: WelcomeEmailRequest = await req.json()

    logStep('Request parsed', {
      email,
      fullName,
      tierLevel,
      hourlyRate,
      monthlyFee,
      hasOnboardingToken: !!onboardingToken,
      hasUserId: !!userId
    })

    // Validate required fields
    if (!email || !fullName || !onboardingToken || !dashboardPassword) {
      throw new Error('Missing required fields: email, fullName, onboardingToken, or dashboardPassword')
    }

    // Render the email template
    logStep('Rendering email template')
    const emailHtml = await renderAsync(
      React.createElement(ExistingCleanerWelcomeEmail, {
        fullName,
        onboardingToken,
        dashboardPassword,
        tierLevel: tierLevel || 2,
        hourlyRate: hourlyRate || 18.00,
        monthlyFee: monthlyFee || 50.00,
        dashboardUrl: 'https://bay-area-cleaning-professionals.lovable.app',
        onboardingUrl: `https://bay-area-cleaning-professionals.lovable.app/subcontractor-onboarding?token=${onboardingToken}`
      })
    )
    logStep('Email template rendered successfully')

    // Create notification record if we have user/subcontractor info
    if (userId && subcontractorId) {
      try {
        const { error: notificationError } = await supabase
          .from('subcontractor_notifications')
          .insert({
            subcontractor_id: subcontractorId,
            user_id: userId,
            type: 'platform_transition',
            title: 'Welcome to Our New Digital Platform',
            message: `Welcome ${fullName}! You've been set up at the Professional tier ($${hourlyRate}/hr). Complete your profile setup to get started.`,
            is_read: false
          })

        if (notificationError) {
          logStep('Notification creation failed', notificationError)
        } else {
          logStep('Notification created successfully')
        }
      } catch (notificationErr) {
        logStep('Notification error (non-blocking)', notificationErr)
      }
    }

    // Send the email
    logStep('Sending welcome email')
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'Bay Area Cleaning Professionals <onboarding@resend.dev>',
      to: [email],
      subject: `Welcome to Our New Platform, ${fullName}! You're Starting at Professional Tier`,
      html: emailHtml,
    })

    if (emailError) {
      logStep('Email sending failed', emailError)
      throw new Error(`Failed to send email: ${emailError.message}`)
    }

    logStep('Email sent successfully', emailResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Existing cleaner welcome email sent successfully',
        email_id: emailResult.id,
        recipient: email,
        tier_info: {
          level: tierLevel,
          name: tierLevel === 3 ? 'Premium' : tierLevel === 2 ? 'Professional' : 'Standard',
          hourly_rate: hourlyRate,
          monthly_fee: monthlyFee
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    logStep('Function error', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})