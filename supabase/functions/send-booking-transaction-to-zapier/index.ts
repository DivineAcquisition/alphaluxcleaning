import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComprehensiveBookingData {
  // Order Information
  order: {
    id: string;
    stripe_session_id: string;
    amount: number;
    currency: string;
    status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    cleaning_type: string;
    frequency: string;
    square_footage: number;
    service_details: any;
    scheduled_date: string;
    scheduled_time: string;
    created_at: string;
    completed_at?: string;
    is_recurring: boolean;
    recurring_frequency?: string;
    next_service_date?: string;
    add_ons: string[];
  };
  
  // Booking Information
  booking?: {
    id: string;
    service_date: string;
    service_time: string;
    service_address: string;
    status: string;
    priority: string;
    estimated_duration: number;
    special_instructions: string;
    assigned_employee_id?: string;
    created_at: string;
    updated_at: string;
  };
  
  // Job Assignment & Tracking
  assignment?: {
    id: string;
    subcontractor_id: string;
    status: string;
    assigned_at: string;
    accepted_at?: string;
    completed_at?: string;
    dropped_at?: string;
    drop_reason?: string;
    customer_rating?: number;
    subcontractor_notes?: string;
  };
  
  // Job Tracking (Check-in/out)
  tracking?: {
    id: string;
    check_in_time?: string;
    check_out_time?: string;
    check_in_location?: string;
    check_out_location?: string;
    actual_duration?: string;
    photos: any[];
    notes?: string;
  };
  
  // Subcontractor Information
  subcontractor?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    status: string;
    split_tier: string;
    average_rating: number;
    total_jobs_completed: number;
    on_time_percentage: number;
    split_percentage: number;
  };
  
  // Status Updates Timeline
  status_updates: {
    id: string;
    status_message: string;
    estimated_arrival_minutes?: number;
    created_at: string;
    subcontractor_name?: string;
  }[];
  
  // Customer Feedback
  feedback?: {
    id: string;
    overall_rating?: number;
    cleanliness_rating?: number;
    professionalism_rating?: number;
    timeliness_rating?: number;
    feedback_text?: string;
    photos: any[];
    status: string;
    created_at: string;
    responded_at?: string;
    response_text?: string;
  };
  
  // Payment Information
  payment: {
    amount_paid: number;
    payment_method: string;
    transaction_id: string;
    payment_status: string;
    processing_fee?: number;
    tip_amount?: number;
  };
  
  // Service Details
  service: {
    service_type: string;
    frequency: string;
    estimated_duration: string;
    special_requirements: string[];
    access_instructions: string;
    pets_present: boolean;
    alarm_code?: string;
    parking_instructions: string;
  };
  
  // Address Information
  address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
    dwelling_type: string;
    flooring_types: string[];
  };
  
  // Business Intelligence
  analytics: {
    booking_source: string;
    referral_code?: string;
    marketing_channel: string;
    customer_ltv_estimate: number;
    booking_completion_time: string;
    device_type: string;
    total_customer_orders: number;
    customer_acquisition_cost?: number;
  };
  
  // Performance Metrics
  performance?: {
    jobs_completed: number;
    on_time_percentage: number;
    customer_rating: number;
    complaints_count: number;
    bonus_eligible: boolean;
  };
  
  // Timestamps (Complete Journey)
  timestamps: {
    order_created: string;
    payment_completed: string;
    booking_scheduled: string;
    job_assigned?: string;
    job_accepted?: string;
    cleaner_checked_in?: string;
    service_started?: string;
    service_completed?: string;
    cleaner_checked_out?: string;
    feedback_received?: string;
    webhook_sent: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, send_sample_data = false } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let transactionData: ComprehensiveBookingData;

    if (send_sample_data) {
      // Send comprehensive sample data with full booking lifecycle
      transactionData = {
        order: {
          id: "sample-order-123",
          stripe_session_id: "cs_test_sample123",
          amount: 15999, // $159.99
          currency: "usd",
          status: "completed",
          customer_name: "Sarah Johnson",
          customer_email: "sarah.johnson@email.com",
          customer_phone: "(555) 234-5678",
          cleaning_type: "deep_clean",
          frequency: "one_time",
          square_footage: 2500,
          service_details: {
            bedrooms: 3,
            bathrooms: 2,
            kitchen: true,
            living_areas: 2
          },
          scheduled_date: "2025-08-03",
          scheduled_time: "10:00 AM",
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          completed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          is_recurring: false,
          add_ons: ["carpet_cleaning", "window_cleaning"]
        },
        booking: {
          id: "booking-sample-456",
          service_date: "2025-08-03",
          service_time: "10:00 AM",
          service_address: "123 Oak Street, San Francisco, CA 94102",
          status: "completed",
          priority: "normal",
          estimated_duration: 180, // 3 hours
          special_instructions: "Please use eco-friendly products only",
          assigned_employee_id: "subcontractor-789",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        assignment: {
          id: "assignment-sample-789",
          subcontractor_id: "subcontractor-789",
          status: "completed",
          assigned_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          accepted_at: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
          completed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          customer_rating: 5,
          subcontractor_notes: "Everything cleaned thoroughly. Customer was very pleased."
        },
        tracking: {
          id: "tracking-sample-101",
          check_in_time: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          check_out_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          check_in_location: "37.7749,-122.4194", // SF coordinates
          check_out_location: "37.7749,-122.4194",
          actual_duration: "3 hours 15 minutes",
          photos: [
            { url: "https://example.com/before1.jpg", type: "before", room: "kitchen" },
            { url: "https://example.com/after1.jpg", type: "after", room: "kitchen" },
            { url: "https://example.com/after2.jpg", type: "after", room: "bathroom" }
          ],
          notes: "Deep cleaned all areas as requested. Used eco-friendly products throughout."
        },
        subcontractor: {
          id: "subcontractor-789",
          full_name: "Marcus Williams",
          email: "marcus.williams@email.com",
          phone: "(555) 987-6543",
          status: "active",
          split_tier: "60_40",
          average_rating: 4.8,
          total_jobs_completed: 127,
          on_time_percentage: 96.5,
          split_percentage: 60
        },
        status_updates: [
          {
            id: "status-1",
            status_message: "Job assigned to cleaner",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            subcontractor_name: "Marcus Williams"
          },
          {
            id: "status-2", 
            status_message: "Cleaner is on the way",
            estimated_arrival_minutes: 15,
            created_at: new Date(Date.now() - 14700000).toISOString(),
            subcontractor_name: "Marcus Williams"
          },
          {
            id: "status-3",
            status_message: "Cleaning service has started",
            created_at: new Date(Date.now() - 14400000).toISOString(),
            subcontractor_name: "Marcus Williams"
          },
          {
            id: "status-4",
            status_message: "Cleaning service completed successfully",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            subcontractor_name: "Marcus Williams"
          }
        ],
        feedback: {
          id: "feedback-sample-202",
          overall_rating: 5,
          cleanliness_rating: 5,
          professionalism_rating: 5,
          timeliness_rating: 4,
          feedback_text: "Amazing job! Everything was spotless and Marcus was very professional. Will definitely book again.",
          photos: [
            { url: "https://example.com/customer-photo1.jpg", type: "result", room: "living_room" }
          ],
          status: "published",
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          responded_at: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          response_text: "Thank you so much for the wonderful feedback! We're thrilled Marcus exceeded your expectations."
        },
        payment: {
          amount_paid: 15999,
          payment_method: "credit_card",
          transaction_id: "pi_sample_transaction_123",
          payment_status: "succeeded",
          processing_fee: 479, // 3% processing fee
          tip_amount: 2000 // $20 tip
        },
        service: {
          service_type: "Deep Cleaning",
          frequency: "One-time",
          estimated_duration: "3-4 hours",
          special_requirements: ["eco_friendly_products", "pet_safe_cleaning"],
          access_instructions: "Key under front door mat",
          pets_present: true,
          alarm_code: "1234",
          parking_instructions: "Driveway available, no street parking restrictions"
        },
        address: {
          street: "123 Oak Street",
          apartment: "Apt 2B",
          city: "San Francisco",
          state: "CA",
          zip_code: "94102",
          dwelling_type: "apartment",
          flooring_types: ["hardwood", "tile", "carpet"]
        },
        analytics: {
          booking_source: "website",
          referral_code: "FRIEND20",
          marketing_channel: "google_ads",
          customer_ltv_estimate: 850.00,
          booking_completion_time: "00:04:32",
          device_type: "desktop",
          total_customer_orders: 3,
          customer_acquisition_cost: 45.50
        },
        performance: {
          jobs_completed: 127,
          on_time_percentage: 96.5,
          customer_rating: 4.8,
          complaints_count: 2,
          bonus_eligible: true
        },
        timestamps: {
          order_created: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          payment_completed: new Date(Date.now() - 172700000).toISOString(), // ~2 days ago
          booking_scheduled: new Date(Date.now() - 172600000).toISOString(), // ~2 days ago
          job_assigned: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          job_accepted: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
          cleaner_checked_in: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          service_started: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          service_completed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          cleaner_checked_out: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          feedback_received: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          webhook_sent: new Date().toISOString()
        }
      };
    } else {
      if (!session_id) {
        throw new Error('Session ID is required when not sending sample data');
      }

      console.log('Fetching comprehensive booking data for session:', session_id);

      // Fetch order data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('stripe_session_id', session_id)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      // First fetch booking data
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();

      // Then fetch all other related data in parallel
      const [
        { data: assignment },
        { data: statusUpdates },
        { data: tips },
        { data: customerOrders }
      ] = await Promise.all([
        supabase.from('subcontractor_job_assignments').select(`
          id, subcontractor_id, status, assigned_at, accepted_at, completed_at, 
          dropped_at, drop_reason, customer_rating, subcontractor_notes,
          subcontractors (
            id, full_name, email, phone, status, split_tier,
            performance_metrics (
              customer_rating, jobs_completed, on_time_percentage, complaints_count, bonus_eligible
            )
          )
        `).eq('booking_id', booking?.id).maybeSingle(),
        supabase.from('order_status_updates').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
        supabase.from('order_tips').select('*').eq('order_id', order.id),
        supabase.from('orders').select('id, amount').eq('customer_email', order.customer_email)
      ]);

      // Fetch tracking and feedback data based on assignment and booking
      const [
        { data: tracking },
        { data: feedback }
      ] = await Promise.all([
        assignment ? supabase.from('job_tracking').select('*').eq('assignment_id', assignment.id).maybeSingle() : Promise.resolve({ data: null }),
        booking ? supabase.from('customer_feedback').select('*').eq('booking_id', booking.id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      console.log('Fetched data:', { 
        order: !!order, 
        booking: !!booking, 
        assignment: !!assignment, 
        tracking: !!tracking,
        statusUpdates: statusUpdates?.length,
        feedback: !!feedback,
        tips: tips?.length 
      });

      // Build comprehensive data
      const serviceDetails = order.service_details || {};
      const address = serviceDetails.serviceAddress || serviceDetails.address || {};
      const instructions = serviceDetails.instructions || {};
      const property = serviceDetails.property || {};
      
      // Calculate analytics
      const totalCustomerValue = customerOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || order.amount;
      const totalTips = tips?.reduce((sum, tip) => sum + (tip.amount || 0), 0) || 0;
      
      // Get subcontractor info and performance
      const subcontractor = assignment?.subcontractors;
      const subcontractorPerf = subcontractor?.performance_metrics?.[0];

      transactionData = {
        order: {
          id: order.id,
          stripe_session_id: order.stripe_session_id || '',
          amount: order.amount,
          currency: order.currency || 'usd',
          status: order.status,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone || '',
          cleaning_type: order.cleaning_type,
          frequency: order.frequency,
          square_footage: order.square_footage || 0,
          service_details: serviceDetails,
          scheduled_date: order.scheduled_date || '',
          scheduled_time: order.scheduled_time || '',
          created_at: order.created_at,
          completed_at: order.completed_at,
          is_recurring: order.is_recurring || false,
          recurring_frequency: order.recurring_frequency,
          next_service_date: order.next_service_date,
          add_ons: order.add_ons || []
        },
        booking: booking ? {
          id: booking.id,
          service_date: booking.service_date,
          service_time: booking.service_time,
          service_address: booking.service_address,
          status: booking.status,
          priority: booking.priority || 'normal',
          estimated_duration: booking.estimated_duration || 120,
          special_instructions: booking.special_instructions || '',
          assigned_employee_id: booking.assigned_employee_id,
          created_at: booking.created_at,
          updated_at: booking.updated_at
        } : undefined,
        assignment: assignment ? {
          id: assignment.id,
          subcontractor_id: assignment.subcontractor_id,
          status: assignment.status,
          assigned_at: assignment.assigned_at,
          accepted_at: assignment.accepted_at,
          completed_at: assignment.completed_at,
          dropped_at: assignment.dropped_at,
          drop_reason: assignment.drop_reason,
          customer_rating: assignment.customer_rating,
          subcontractor_notes: assignment.subcontractor_notes
        } : undefined,
        tracking: tracking ? {
          id: tracking.id,
          check_in_time: tracking.check_in_time,
          check_out_time: tracking.check_out_time,
          check_in_location: tracking.check_in_location,
          check_out_location: tracking.check_out_location,
          actual_duration: tracking.actual_duration,
          photos: tracking.photos || [],
          notes: tracking.notes
        } : undefined,
        subcontractor: subcontractor ? {
          id: subcontractor.id,
          full_name: subcontractor.full_name,
          email: subcontractor.email,
          phone: subcontractor.phone,
          status: subcontractor.status,
          split_tier: subcontractor.split_tier,
          average_rating: subcontractorPerf?.customer_rating || 0,
          total_jobs_completed: subcontractorPerf?.jobs_completed || 0,
          on_time_percentage: subcontractorPerf?.on_time_percentage || 0,
          split_percentage: subcontractor.split_tier === '50_50' ? 50 : subcontractor.split_tier === '60_40' ? 60 : 70
        } : undefined,
        status_updates: (statusUpdates || []).map(update => ({
          id: update.id,
          status_message: update.status_message,
          estimated_arrival_minutes: update.estimated_arrival_minutes,
          created_at: update.created_at,
          subcontractor_name: subcontractor?.full_name
        })),
        feedback: feedback ? {
          id: feedback.id,
          overall_rating: feedback.overall_rating,
          cleanliness_rating: feedback.cleanliness_rating,
          professionalism_rating: feedback.professionalism_rating,
          timeliness_rating: feedback.timeliness_rating,
          feedback_text: feedback.feedback_text,
          photos: feedback.photos || [],
          status: feedback.status,
          created_at: feedback.created_at,
          responded_at: feedback.responded_at,
          response_text: feedback.response_text
        } : undefined,
        payment: {
          amount_paid: order.amount,
          payment_method: "stripe",
          transaction_id: order.stripe_session_id || '',
          payment_status: order.status,
          tip_amount: totalTips
        },
        service: {
          service_type: order.cleaning_type || "Standard Cleaning",
          frequency: order.frequency || "one_time",
          estimated_duration: booking?.estimated_duration ? `${Math.floor(booking.estimated_duration / 60)} hours` : "2-3 hours",
          special_requirements: order.add_ons || [],
          access_instructions: instructions.access || "",
          pets_present: instructions.pets || false,
          alarm_code: instructions.alarmCode || "",
          parking_instructions: instructions.parking || ""
        },
        address: {
          street: address.street || "",
          apartment: address.apartment || "",
          city: address.city || "",
          state: address.state || "",
          zip_code: address.zipCode || "",
          dwelling_type: property.dwellingType || "",
          flooring_types: property.flooringTypes || []
        },
        analytics: {
          booking_source: serviceDetails.source || "website",
          referral_code: serviceDetails.referralCode,
          marketing_channel: serviceDetails.marketingChannel || "direct",
          customer_ltv_estimate: totalCustomerValue / 100,
          booking_completion_time: serviceDetails.completionTime || "unknown",
          device_type: serviceDetails.deviceType || "unknown",
          total_customer_orders: customerOrders?.length || 1,
          customer_acquisition_cost: serviceDetails.acquisitionCost
        },
        performance: subcontractorPerf ? {
          jobs_completed: subcontractorPerf.jobs_completed || 0,
          on_time_percentage: subcontractorPerf.on_time_percentage || 0,
          customer_rating: subcontractorPerf.customer_rating || 0,
          complaints_count: subcontractorPerf.complaints_count || 0,
          bonus_eligible: subcontractorPerf.bonus_eligible || false
        } : undefined,
        timestamps: {
          order_created: order.created_at,
          payment_completed: order.created_at,
          booking_scheduled: booking?.created_at || '',
          job_assigned: assignment?.assigned_at,
          job_accepted: assignment?.accepted_at,
          cleaner_checked_in: tracking?.check_in_time,
          service_started: tracking?.check_in_time,
          service_completed: assignment?.completed_at,
          cleaner_checked_out: tracking?.check_out_time,
          feedback_received: feedback?.created_at,
          webhook_sent: new Date().toISOString()
        }
      };

      console.log('Built comprehensive transaction data for order:', order.id);
    }

    // Send to Zapier webhook
    const zapierResponse = await fetch('https://hooks.zapier.com/hooks/catch/5011258/uusrlmn/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'customer_data_collection',
        'BACP Data': transactionData,
        metadata: {
          webhook_version: '1.0',
          sent_at: new Date().toISOString(),
          environment: 'production'
        }
      }),
    });

    console.log('Zapier webhook response status:', zapierResponse.status);
    console.log('Transaction data sent:', JSON.stringify(transactionData, null, 2));

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed with status: ${zapierResponse.status}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Booking transaction sent to Zapier successfully',
      transaction_id: transactionData.order.id,
      webhook_status: zapierResponse.status,
      data_sent: transactionData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending booking transaction to Zapier:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});