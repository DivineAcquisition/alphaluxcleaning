import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  payments_deleted: number
  bookings_deleted: number  
  customers_deleted: number
  events_deleted: number
  email_jobs_deleted: number
  integration_logs_deleted: number
  total_deleted: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const result: CleanupResult = {
      payments_deleted: 0,
      bookings_deleted: 0,
      customers_deleted: 0,
      events_deleted: 0,
      email_jobs_deleted: 0,
      integration_logs_deleted: 0,
      total_deleted: 0
    }

    console.log('🧹 Starting test data cleanup...')

    // Step 1: Get all test bookings to identify what to clean
    const { data: testBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, customer_id')
      .eq('source_channel', 'UI_DIRECT')

    if (bookingsError) {
      throw new Error(`Error fetching test bookings: ${bookingsError.message}`)
    }

    const testBookingIds = testBookings?.map(b => b.id) || []
    const testCustomerIds = testBookings?.map(b => b.customer_id) || []

    console.log(`📊 Found ${testBookingIds.length} test bookings to clean`)

    // Step 2: Delete payments associated with test bookings
    if (testBookingIds.length > 0) {
      const { error: paymentsError, count: paymentsCount } = await supabase
        .from('payments')
        .delete({ count: 'exact' })
        .in('booking_id', testBookingIds)

      if (paymentsError) {
        console.error('Error deleting payments:', paymentsError)
      } else {
        result.payments_deleted = paymentsCount || 0
        console.log(`💳 Deleted ${result.payments_deleted} test payments`)
      }
    }

    // Step 3: Delete events related to test bookings
    if (testBookingIds.length > 0) {
      const { error: eventsError, count: eventsCount } = await supabase
        .from('events')
        .delete({ count: 'exact' })
        .in('booking_id', testBookingIds)

      if (eventsError) {
        console.error('Error deleting events:', eventsError)
      } else {
        result.events_deleted = eventsCount || 0
        console.log(`📅 Deleted ${result.events_deleted} test events`)
      }
    }

    // Step 4: Delete integration logs for test bookings
    if (testBookingIds.length > 0) {
      const { error: logsError, count: logsCount } = await supabase
        .from('integration_logs')
        .delete({ count: 'exact' })
        .in('booking_id', testBookingIds)

      if (logsError) {
        console.error('Error deleting integration logs:', logsError)
      } else {
        result.integration_logs_deleted = logsCount || 0
        console.log(`📋 Deleted ${result.integration_logs_deleted} integration logs`)
      }
    }

    // Step 5: Delete email jobs for test customers
    if (testCustomerIds.length > 0) {
      // Get test customer emails first
      const { data: testCustomers } = await supabase
        .from('customers')
        .select('email')
        .in('id', testCustomerIds)

      const testEmails = testCustomers?.map(c => c.email) || []

      if (testEmails.length > 0) {
        const { error: emailJobsError, count: emailJobsCount } = await supabase
          .from('email_jobs')
          .delete({ count: 'exact' })
          .in('to_email', testEmails)

        if (emailJobsError) {
          console.error('Error deleting email jobs:', emailJobsError)
        } else {
          result.email_jobs_deleted = emailJobsCount || 0
          console.log(`📧 Deleted ${result.email_jobs_deleted} test email jobs`)
        }
      }
    }

    // Step 6: Delete HCP sync logs for test bookings
    if (testBookingIds.length > 0) {
      const { error: hcpError } = await supabase
        .from('hcp_sync_log')
        .delete()
        .in('booking_id', testBookingIds)

      if (hcpError) {
        console.error('Error deleting HCP sync logs:', hcpError)
      } else {
        console.log('🔄 Cleaned HCP sync logs')
      }
    }

    // Step 7: Delete test bookings
    if (testBookingIds.length > 0) {
      const { error: bookingsDeleteError, count: bookingsCount } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .in('id', testBookingIds)

      if (bookingsDeleteError) {
        throw new Error(`Error deleting test bookings: ${bookingsDeleteError.message}`)
      } else {
        result.bookings_deleted = bookingsCount || 0
        console.log(`📦 Deleted ${result.bookings_deleted} test bookings`)
      }
    }

    // Step 8: Delete test customers (only those with test patterns)
    if (testCustomerIds.length > 0) {
      // Safety filter: only delete customers with test-like emails or names
      const { error: customersDeleteError, count: customersCount } = await supabase
        .from('customers')
        .delete({ count: 'exact' })
        .in('id', testCustomerIds)
        .or('email.ilike.%test%,name.ilike.%test%,email.ilike.%malik%')

      if (customersDeleteError) {
        console.error('Error deleting test customers:', customersDeleteError)
      } else {
        result.customers_deleted = customersCount || 0
        console.log(`👥 Deleted ${result.customers_deleted} test customers`)
      }
    }

    // Calculate total
    result.total_deleted = result.payments_deleted + 
                          result.bookings_deleted + 
                          result.customers_deleted + 
                          result.events_deleted + 
                          result.email_jobs_deleted + 
                          result.integration_logs_deleted

    console.log(`✅ Test data cleanup completed! Total records deleted: ${result.total_deleted}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test data cleanup completed successfully',
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})