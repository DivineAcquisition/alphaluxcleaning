import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComprehensiveBookingData {
  // Pre-booking journey data
  customer_journey?: {
    first_website_visit: string;
    total_website_visits: number;
    pages_visited: any[];
    marketing_touchpoints: any[];
    abandoned_carts: any[];
    quotes_requested: any[];
    customer_inquiries: any[];
  };
  
  // Enhanced booking process data
  booking_process?: {
    form_interactions: any;
    pricing_calculator_usage: any;
    referral_application: any;
    membership_consideration: any;
  };
  
  // Service preparation phase
  service_preparation?: {
    cleaner_preparation: any;
    customer_notifications: any[];
    pre_service_communication: any;
  };
  
  // During service enhancements
  service_execution?: {
    real_time_updates: any[];
    supply_usage: any;
    issues_encountered: any[];
    customer_communication: any[];
    quality_checks: any[];
  };
  
  // Post-service follow-up
  post_service_followup?: {
    follow_up_sequence: any[];
    rebooking_attempts: any[];
    loyalty_interactions: any[];
    review_management: any;
    retention_metrics: any;
  };

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
    payment_breakdown?: any;
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
    const { 
      session_id, 
      send_sample_data = false, 
      webhook_url, 
      customer_only = true, 
      transactionData: directTransactionData, 
      type 
    } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let transactionData: ComprehensiveBookingData;

    if (directTransactionData) {
      // Use directly provided transaction data from OrderEntryTest
      console.log('Using direct transaction data provided by client');
      
      // Convert the simple transaction data to the expected format
      const now = new Date();
      transactionData = {
        order: {
          id: directTransactionData.orderDetails?.orderId || `test-order-${Date.now()}`,
          stripe_session_id: `test-session-${Date.now()}`,
          amount: (directTransactionData.amount || 15999),
          currency: 'usd',
          status: 'completed',
          customer_name: directTransactionData.customerName || 'Test Customer',
          customer_email: directTransactionData.customerEmail || 'test@example.com',
          customer_phone: directTransactionData.phone || '(555) 123-4567',
          cleaning_type: directTransactionData.serviceType || 'standard_clean',
          frequency: 'one_time',
          square_footage: 2000,
          service_details: directTransactionData.serviceDetails || {},
          scheduled_date: directTransactionData.preferredDate || now.toISOString().split('T')[0],
          scheduled_time: directTransactionData.preferredTime || '10:00 AM',
          created_at: now.toISOString(),
          is_recurring: false,
          add_ons: directTransactionData.addOns || []
        },
        status_updates: [{
          id: 'status-test-1',
          status_message: 'Test order entry webhook triggered',
          created_at: now.toISOString(),
          subcontractor_name: 'Test Subcontractor'
        }],
        payment: {
          amount_paid: directTransactionData.amount || 15999,
          payment_method: 'test',
          transaction_id: `test-transaction-${Date.now()}`,
          payment_status: 'succeeded'
        },
        service: {
          service_type: directTransactionData.serviceType || 'Standard Cleaning',
          frequency: 'One-time',
          estimated_duration: '2-3 hours',
          special_requirements: directTransactionData.notes ? [directTransactionData.notes] : [],
          access_instructions: '',
          pets_present: false,
          parking_instructions: ''
        },
        address: {
          street: directTransactionData.address || '123 Test Street',
          city: 'Test City',
          state: 'CA',
          zip_code: '12345',
          dwelling_type: 'house',
          flooring_types: ['hardwood']
        },
        analytics: {
          booking_source: 'test_portal',
          marketing_channel: 'test',
          customer_ltv_estimate: (directTransactionData.amount || 15999) / 100,
          booking_completion_time: '00:01:00',
          device_type: 'desktop',
          total_customer_orders: 1
        },
        timestamps: {
          order_created: now.toISOString(),
          payment_completed: now.toISOString(),
          booking_scheduled: now.toISOString(),
          webhook_sent: now.toISOString()
        }
      };
    } else if (send_sample_data) {
      // Send comprehensive sample data with full booking lifecycle
      const now = new Date();
      const serviceDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const bookingDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const firstVisit = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
      
      transactionData = {
        // Pre-booking journey data
        customer_journey: {
          first_website_visit: firstVisit.toISOString(),
          total_website_visits: 5,
          pages_visited: [
            { page: "/", time_spent: 120, timestamp: firstVisit.toISOString() },
            { page: "/services", time_spent: 180, timestamp: new Date(firstVisit.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() },
            { page: "/pricing", time_spent: 240, timestamp: new Date(firstVisit.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() },
            { page: "/schedule", time_spent: 320, timestamp: new Date(firstVisit.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString() },
            { page: "/booking", time_spent: 480, timestamp: bookingDate.toISOString() }
          ],
          marketing_touchpoints: [
            { type: "google_ad_click", campaign: "Deep Cleaning Special", cost: 2.45, timestamp: firstVisit.toISOString() },
            { type: "email_open", campaign: "Weekly Newsletter", timestamp: new Date(firstVisit.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() },
            { type: "email_click", campaign: "15% Off First Clean", timestamp: new Date(firstVisit.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          abandoned_carts: [{
            cart_id: "cart_sample_456",
            abandoned_at: new Date(firstVisit.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            cart_value: 12999,
            recovery_email_sent: true,
            recovery_email_opened: true,
            recovery_email_clicked: false
          }],
          quotes_requested: [{
            quote_id: "quote_789",
            service_type: "standard_clean",
            estimated_price: 9999,
            requested_at: new Date(firstVisit.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            responded_at: new Date(firstVisit.getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
          }],
          customer_inquiries: [{
            inquiry_id: "inq_101",
            type: "live_chat",
            question: "Do you provide cleaning supplies?",
            response_time_minutes: 3,
            resolved: true,
            timestamp: new Date(firstVisit.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
          }]
        },
        
        // Enhanced booking process data
        booking_process: {
          form_interactions: {
            total_time_on_form: "00:08:32",
            field_interactions: [
              { field: "service_type", time_spent: 45, changes_made: 2 },
              { field: "home_size", time_spent: 30, changes_made: 1 },
              { field: "frequency", time_spent: 60, changes_made: 3 },
              { field: "add_ons", time_spent: 120, changes_made: 4 },
              { field: "date_time", time_spent: 90, changes_made: 2 },
              { field: "address", time_spent: 75, changes_made: 1 }
            ],
            form_completion_rate: 100,
            form_abandonment_points: []
          },
          pricing_calculator_usage: {
            times_used: 8,
            final_price_locked: true,
            price_changes: [
              { from: 9999, to: 12999, reason: "added_deep_clean" },
              { from: 12999, to: 15999, reason: "added_carpet_cleaning" },
              { from: 15999, to: 15999, reason: "added_window_cleaning" }
            ]
          },
          referral_application: {
            code_entered: "FRIEND20",
            code_valid: true,
            discount_applied: 2000,
            referrer_name: "Mike Thompson",
            referrer_email: "mike.thompson@email.com"
          },
          membership_consideration: {
            membership_offered: true,
            membership_accepted: false,
            membership_decline_reason: "want_to_try_first"
          }
        },

        // Service preparation phase
        service_preparation: {
          cleaner_preparation: {
            supplies_checked: true,
            route_optimized: true,
            estimated_travel_time: 25,
            preparation_duration: 15,
            supplies_needed: ["eco_friendly_all_purpose", "microfiber_cloths", "vacuum_bags", "carpet_cleaner"],
            special_equipment: ["carpet_cleaning_machine", "window_cleaning_tools"]
          },
          customer_notifications: [
            { type: "booking_confirmation", sent_at: bookingDate.toISOString(), opened: true },
            { type: "24hr_reminder", sent_at: new Date(serviceDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), opened: true },
            { type: "2hr_reminder", sent_at: new Date(serviceDate.getTime() - 2 * 60 * 60 * 1000).toISOString(), opened: true },
            { type: "on_the_way", sent_at: new Date(serviceDate.getTime() - 30 * 60 * 1000).toISOString(), opened: true }
          ],
          pre_service_communication: {
            customer_called: true,
            call_duration: "2:15",
            access_confirmed: true,
            special_requests_noted: ["use eco-friendly products", "focus on pet hair areas"],
            cleaner_notes_added: "Customer has two cats, focus on pet hair removal"
          }
        },

        // During service execution data
        service_execution: {
          real_time_updates: [
            { timestamp: new Date(serviceDate.getTime() + 30 * 60 * 1000).toISOString(), update: "Arrived and starting kitchen deep clean", room: "kitchen" },
            { timestamp: new Date(serviceDate.getTime() + 90 * 60 * 1000).toISOString(), update: "Kitchen completed, moving to bathrooms", room: "bathroom" },
            { timestamp: new Date(serviceDate.getTime() + 150 * 60 * 1000).toISOString(), update: "Carpet cleaning in progress", room: "living_room" },
            { timestamp: new Date(serviceDate.getTime() + 180 * 60 * 1000).toISOString(), update: "Final touches and quality check", room: "all" }
          ],
          supply_usage: {
            eco_friendly_products: { used: true, quantity: "2 bottles", cost: 12.50 },
            microfiber_cloths: { used: true, quantity: "8 cloths", cost: 4.00 },
            carpet_cleaner_solution: { used: true, quantity: "1 bottle", cost: 18.75 },
            window_cleaning_solution: { used: true, quantity: "1 bottle", cost: 8.25 }
          },
          issues_encountered: [
            {
              issue_id: "iss_001",
              type: "minor",
              description: "Stubborn stain on carpet required extra treatment",
              resolution: "Applied specialized stain remover, successfully removed",
              time_impact: 15,
              resolved: true
            }
          ],
          customer_communication: [
            {
              type: "text_message",
              direction: "to_customer",
              message: "Hi Sarah! I'm Marcus, your cleaner. Just arrived and starting with the kitchen as requested.",
              timestamp: new Date(serviceDate.getTime() + 5 * 60 * 1000).toISOString(),
              delivered: true
            },
            {
              type: "text_message", 
              direction: "from_customer",
              message: "Great! Please pay special attention to the pet hair in the living room. Thank you!",
              timestamp: new Date(serviceDate.getTime() + 8 * 60 * 1000).toISOString(),
              read: true
            }
          ],
          quality_checks: [
            { room: "kitchen", checklist_items: ["surfaces_cleaned", "appliances_wiped", "floor_mopped"], score: 100, timestamp: new Date(serviceDate.getTime() + 85 * 60 * 1000).toISOString() },
            { room: "bathroom", checklist_items: ["toilet_sanitized", "shower_scrubbed", "mirror_cleaned"], score: 100, timestamp: new Date(serviceDate.getTime() + 145 * 60 * 1000).toISOString() },
            { room: "living_room", checklist_items: ["carpet_cleaned", "dusting_complete", "vacuum_thorough"], score: 98, timestamp: new Date(serviceDate.getTime() + 175 * 60 * 1000).toISOString() }
          ]
        },

        // Post-service follow-up data
        post_service_followup: {
          follow_up_sequence: [
            {
              type: "completion_notification",
              sent_at: new Date(serviceDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
              channel: "email_sms",
              opened: true,
              clicked: true
            },
            {
              type: "feedback_request",
              sent_at: new Date(serviceDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
              channel: "email",
              opened: true,
              responded: true,
              response_time_hours: 0.5
            },
            {
              type: "thank_you_message",
              sent_at: new Date(serviceDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
              channel: "email",
              opened: true,
              clicked: false
            }
          ],
          rebooking_attempts: [
            {
              attempt_id: "rebook_001",
              type: "automated_email",
              sent_at: new Date(serviceDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              offer: "15% off next deep clean",
              opened: true,
              clicked: true,
              converted: false
            },
            {
              attempt_id: "rebook_002", 
              type: "follow_up_call",
              scheduled_at: new Date(serviceDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              completed: false,
              outcome: "left_voicemail"
            }
          ],
          loyalty_interactions: [
            {
              program: "referral_program",
              action: "referral_code_generated",
              code: "SARAH20",
              discount_value: 20,
              status: "active",
              created_at: new Date(serviceDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          review_management: {
            google_review_requested: true,
            google_review_submitted: true,
            google_review_rating: 5,
            google_review_text: "Exceptional service! Marcus was professional and thorough.",
            yelp_review_requested: true,
            yelp_review_submitted: false,
            facebook_review_requested: false
          },
          retention_metrics: {
            satisfaction_score: 5,
            likelihood_to_recommend: 10,
            likelihood_to_rebook: 9,
            preferred_frequency: "monthly",
            price_sensitivity: "low",
            service_preferences: ["eco_friendly", "same_cleaner", "flexible_scheduling"]
          }
        },

        order: {
          id: "sample-order-123",
          stripe_session_id: "cs_test_sample123",
          amount: 15999,
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
          scheduled_date: serviceDate.toISOString().split('T')[0],
          scheduled_time: "10:00 AM",
          created_at: bookingDate.toISOString(),
          completed_at: new Date(serviceDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          is_recurring: false,
          add_ons: ["carpet_cleaning", "window_cleaning"],
          payment_breakdown: {
            base_service: 9999,
            deep_clean_upgrade: 4000,
            carpet_cleaning: 1500,
            window_cleaning: 1000,
            referral_discount: -2000,
            tax: 1500,
            total: 15999
          }
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

    // Determine which webhook URL to use
    const targetWebhookUrl = webhook_url || 
      Deno.env.get('ZAPIER_BOOKING_WEBHOOK_URL') || 
      'https://hooks.zapier.com/hooks/catch/5011258/u4jui7k/';

    console.log('Sending to Zapier webhook:', targetWebhookUrl);

    // Build customer-only payload from customer-entered fields
    const customerInput = {
      customer_name: transactionData.order?.customer_name,
      customer_email: transactionData.order?.customer_email,
      customer_phone: transactionData.order?.customer_phone,
      address: (transactionData as any).address ?? transactionData.booking?.service_address,
      cleaning_type: transactionData.order?.cleaning_type,
      frequency: transactionData.order?.frequency,
      square_footage: transactionData.order?.square_footage,
      bedrooms: transactionData.order?.service_details?.bedrooms,
      bathrooms: transactionData.order?.service_details?.bathrooms,
      add_ons: transactionData.order?.add_ons,
      preferred_date: transactionData.order?.scheduled_date,
      preferred_time: transactionData.order?.scheduled_time,
      special_instructions: transactionData.order?.service_details?.special_instructions,
      referral_code: transactionData.booking_process?.referral_application?.code_entered
    };

    const bodyPayload = customer_only
      ? { event_type: 'customer_booking_input', customer_input: customerInput }
      : {
          event_type: 'customer_data_collection',
          'BACP Data': transactionData,
          metadata: {
            webhook_version: '1.0',
            sent_at: new Date().toISOString(),
            environment: 'production',
          },
        };

    // Send to Zapier webhook
    const zapierResponse = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const zapierText = await zapierResponse.text();
    console.log('Zapier webhook response status:', zapierResponse.status);
    console.log('Zapier response text:', zapierText);
    console.log('Transaction data sent:', JSON.stringify(transactionData, null, 2));

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed with status: ${zapierResponse.status} - ${zapierText}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Booking transaction sent to Zapier successfully',
      transaction_id: transactionData.order.id,
      webhook_status: zapierResponse.status,
      zapier_response: zapierText,
      zapier_url: targetWebhookUrl,
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