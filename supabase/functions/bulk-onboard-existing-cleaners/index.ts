import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  console.log(`[BULK_ONBOARD] ${step}`, details ? JSON.stringify(details, null, 2) : '')
}

interface CleanerData {
  full_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  availability?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

interface OnboardingRequest {
  cleaners: CleanerData[]
  batch_size?: number
}

serve(async (req) => {
  logStep('Function invoked', { method: req.method })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    logStep('Supabase client initialized')

    // Parse request body
    const { cleaners, batch_size = 5 }: OnboardingRequest = await req.json()
    logStep('Request parsed', { cleaner_count: cleaners.length, batch_size })

    if (!cleaners || cleaners.length === 0) {
      throw new Error('No cleaners provided for onboarding')
    }

    // Process cleaners in batches to avoid overwhelming the system
    const results = []
    const total_cleaners = cleaners.length
    let processed = 0

    for (let i = 0; i < cleaners.length; i += batch_size) {
      const batch = cleaners.slice(i, i + batch_size)
      logStep(`Processing batch ${Math.floor(i / batch_size) + 1}`, { 
        batch_size: batch.length,
        total_batches: Math.ceil(cleaners.length / batch_size)
      })

      // Call the database function to create applications and tokens
      const { data: batchResult, error: batchError } = await supabase
        .rpc('bulk_onboard_existing_cleaners', {
          p_cleaners: batch
        })

      if (batchError) {
        logStep('Batch processing error', batchError)
        throw new Error(`Failed to process batch: ${batchError.message}`)
      }

      logStep('Batch processed successfully', batchResult)

      // Create Supabase Auth users and send welcome emails for each cleaner in batch
      if (batchResult?.results) {
        for (const cleaner of batchResult.results) {
          try {
            logStep('Creating auth user', { email: cleaner.email })
            
            // Generate random password
            const randomPassword = Array.from({ length: 12 }, () => 
              'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
                .charAt(Math.floor(Math.random() * 70))
            ).join('')

            // Create auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: cleaner.email,
              password: randomPassword,
              email_confirm: true,
              user_metadata: {
                full_name: cleaner.full_name,
                role: 'subcontractor'
              }
            })

            if (authError) {
              logStep('Auth user creation failed', { email: cleaner.email, error: authError })
              continue
            }

            logStep('Auth user created', { user_id: authUser.user.id })

            // Assign subcontractor role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authUser.user.id,
                role: 'subcontractor'
              })

            if (roleError) {
              logStep('Role assignment failed', { user_id: authUser.user.id, error: roleError })
            }

            // Send welcome email with onboarding link and dashboard credentials
            logStep('Sending welcome email', { email: cleaner.email })
            
            const { error: emailError } = await supabase.functions.invoke('send-existing-cleaner-welcome', {
              body: {
                email: cleaner.email,
                fullName: cleaner.full_name,
                onboardingToken: cleaner.onboarding_token,
                dashboardPassword: randomPassword,
                tierLevel: cleaner.tier_level,
                hourlyRate: cleaner.hourly_rate,
                monthlyFee: cleaner.monthly_fee,
                userId: authUser.user.id,
                subcontractorId: null // Will be set after onboarding completion
              }
            })

            if (emailError) {
              logStep('Welcome email failed', { email: cleaner.email, error: emailError })
            } else {
              logStep('Welcome email sent successfully', { email: cleaner.email })
            }

            results.push({
              email: cleaner.email,
              full_name: cleaner.full_name,
              status: 'success',
              auth_user_id: authUser.user.id,
              onboarding_token: cleaner.onboarding_token,
              temporary_password: randomPassword, // Include in response for admin reference
              tier_info: {
                level: cleaner.tier_level,
                hourly_rate: cleaner.hourly_rate,
                monthly_fee: cleaner.monthly_fee
              }
            })

          } catch (error) {
            logStep('Individual cleaner processing failed', { 
              email: cleaner.email, 
              error: error.message 
            })
            
            results.push({
              email: cleaner.email,
              full_name: cleaner.full_name,
              status: 'failed',
              error: error.message
            })
          }
        }
      }

      processed += batch_size
      logStep('Batch completed', { 
        processed: Math.min(processed, total_cleaners),
        total: total_cleaners 
      })

      // Add delay between batches to avoid rate limiting
      if (i + batch_size < cleaners.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    logStep('Bulk onboarding completed', {
      total_cleaners,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk onboarding completed for ${total_cleaners} cleaners`,
        summary: {
          total_processed: total_cleaners,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'failed').length
        },
        results
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