export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          domain: string | null
          email: string | null
          id: number
        }
        Insert: {
          domain?: string | null
          email?: string | null
          id?: number
        }
        Update: {
          domain?: string | null
          email?: string | null
          id?: number
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          email: string | null
          id: number
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          email?: string | null
          id?: number
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          email?: string | null
          id?: number
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      attribution_events: {
        Row: {
          created_at: string
          event: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          payload?: Json
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      availability_schedule: {
        Row: {
          active: boolean
          available_slots: number
          booked_slots: number
          created_at: string
          date: string
          id: string
          time_slot: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          available_slots?: number
          booked_slots?: number
          created_at?: string
          date: string
          id?: string
          time_slot: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          available_slots?: number
          booked_slots?: number
          created_at?: string
          date?: string
          id?: string
          time_slot?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          addons: Json | null
          address_line1: string | null
          address_line2: string | null
          arr: number | null
          at_risk: boolean | null
          attribution_method: string | null
          balance_due: number | null
          base_price: number | null
          commitment_months: number | null
          conversion_status:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at: string
          customer_id: string
          deep_clean_last_answer: string | null
          deep_clean_recommendation_shown: boolean | null
          deposit_amount: number | null
          email_bounced_at: string | null
          est_price: number
          first_booking: boolean | null
          frequency: string
          full_name: string | null
          ghl_contact_id: string | null
          hcp_customer_id: string | null
          hcp_job_id: string | null
          home_size: string | null
          housecall_job_id: string | null
          id: string
          is_recurring: boolean | null
          is_recurring_instance: boolean | null
          manage_token: string | null
          manage_token_expires_at: string | null
          marketing_opt_in: boolean | null
          membership_plan_id: string | null
          mrr: number | null
          notes: string | null
          offer_name: string | null
          offer_type: string | null
          paid_at: string | null
          parent_recurring_service_id: string | null
          payment_option_id: string | null
          payment_status: string | null
          preferred_date: string | null
          preferred_time_block: string | null
          prepayment_discount_amount: number | null
          prepayment_discount_applied: boolean | null
          pricing_breakdown: Json | null
          promo_applied: string | null
          promo_code: string | null
          promo_discount_cents: number | null
          property_details: Json | null
          receipt_url: string | null
          recurring_active: boolean | null
          referrer_code: string | null
          referrer_customer_id: string | null
          reward_code_issued: string | null
          service_date: string | null
          service_time_window: string | null
          service_type: string
          source_channel: string | null
          special_instructions: string | null
          sqft_or_bedrooms: string
          square_customer_id: string | null
          square_payment_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          time_slot: string | null
          timezone: string | null
          updated_at: string | null
          utms: Json | null
          visit_count: number | null
          zip_code: string | null
        }
        Insert: {
          addons?: Json | null
          address_line1?: string | null
          address_line2?: string | null
          arr?: number | null
          at_risk?: boolean | null
          attribution_method?: string | null
          balance_due?: number | null
          base_price?: number | null
          commitment_months?: number | null
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at?: string
          customer_id: string
          deep_clean_last_answer?: string | null
          deep_clean_recommendation_shown?: boolean | null
          deposit_amount?: number | null
          email_bounced_at?: string | null
          est_price: number
          first_booking?: boolean | null
          frequency: string
          full_name?: string | null
          ghl_contact_id?: string | null
          hcp_customer_id?: string | null
          hcp_job_id?: string | null
          home_size?: string | null
          housecall_job_id?: string | null
          id?: string
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          manage_token?: string | null
          manage_token_expires_at?: string | null
          marketing_opt_in?: boolean | null
          membership_plan_id?: string | null
          mrr?: number | null
          notes?: string | null
          offer_name?: string | null
          offer_type?: string | null
          paid_at?: string | null
          parent_recurring_service_id?: string | null
          payment_option_id?: string | null
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time_block?: string | null
          prepayment_discount_amount?: number | null
          prepayment_discount_applied?: boolean | null
          pricing_breakdown?: Json | null
          promo_applied?: string | null
          promo_code?: string | null
          promo_discount_cents?: number | null
          property_details?: Json | null
          receipt_url?: string | null
          recurring_active?: boolean | null
          referrer_code?: string | null
          referrer_customer_id?: string | null
          reward_code_issued?: string | null
          service_date?: string | null
          service_time_window?: string | null
          service_type: string
          source_channel?: string | null
          special_instructions?: string | null
          sqft_or_bedrooms: string
          square_customer_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          time_slot?: string | null
          timezone?: string | null
          updated_at?: string | null
          utms?: Json | null
          visit_count?: number | null
          zip_code?: string | null
        }
        Update: {
          addons?: Json | null
          address_line1?: string | null
          address_line2?: string | null
          arr?: number | null
          at_risk?: boolean | null
          attribution_method?: string | null
          balance_due?: number | null
          base_price?: number | null
          commitment_months?: number | null
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at?: string
          customer_id?: string
          deep_clean_last_answer?: string | null
          deep_clean_recommendation_shown?: boolean | null
          deposit_amount?: number | null
          email_bounced_at?: string | null
          est_price?: number
          first_booking?: boolean | null
          frequency?: string
          full_name?: string | null
          ghl_contact_id?: string | null
          hcp_customer_id?: string | null
          hcp_job_id?: string | null
          home_size?: string | null
          housecall_job_id?: string | null
          id?: string
          is_recurring?: boolean | null
          is_recurring_instance?: boolean | null
          manage_token?: string | null
          manage_token_expires_at?: string | null
          marketing_opt_in?: boolean | null
          membership_plan_id?: string | null
          mrr?: number | null
          notes?: string | null
          offer_name?: string | null
          offer_type?: string | null
          paid_at?: string | null
          parent_recurring_service_id?: string | null
          payment_option_id?: string | null
          payment_status?: string | null
          preferred_date?: string | null
          preferred_time_block?: string | null
          prepayment_discount_amount?: number | null
          prepayment_discount_applied?: boolean | null
          pricing_breakdown?: Json | null
          promo_applied?: string | null
          promo_code?: string | null
          promo_discount_cents?: number | null
          property_details?: Json | null
          receipt_url?: string | null
          recurring_active?: boolean | null
          referrer_code?: string | null
          referrer_customer_id?: string | null
          reward_code_issued?: string | null
          service_date?: string | null
          service_time_window?: string | null
          service_type?: string
          source_channel?: string | null
          special_instructions?: string | null
          sqft_or_bedrooms?: string
          square_customer_id?: string | null
          square_payment_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          time_slot?: string | null
          timezone?: string | null
          updated_at?: string | null
          utms?: Json | null
          visit_count?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_recurring_service_id_fkey"
            columns: ["parent_recurring_service_id"]
            isOneToOne: false
            referencedRelation: "recurring_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_portal_sessions: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          last_accessed: string | null
          session_token: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string
          id?: string
          last_accessed?: string | null
          session_token: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          last_accessed?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_portal_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_id: string | null
          created_at: string
          deep_clean_reward_code: string | null
          deep_clean_reward_expires: string | null
          email: string
          first_clean_discount_used: boolean | null
          first_name: string | null
          id: string
          last_deep_clean_answer: string | null
          last_name: string | null
          lat: number | null
          lng: number | null
          metadata: Json | null
          name: string | null
          phone: string | null
          postal_code: string | null
          recurrence_plan: string | null
          referral_code: string | null
          referral_link: string | null
          square_customer_id: string | null
          state: string | null
          stripe_customer_id: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          deep_clean_reward_code?: string | null
          deep_clean_reward_expires?: string | null
          email: string
          first_clean_discount_used?: boolean | null
          first_name?: string | null
          id?: string
          last_deep_clean_answer?: string | null
          last_name?: string | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          recurrence_plan?: string | null
          referral_code?: string | null
          referral_link?: string | null
          square_customer_id?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          deep_clean_reward_code?: string | null
          deep_clean_reward_expires?: string | null
          email?: string
          first_clean_discount_used?: boolean | null
          first_name?: string | null
          id?: string
          last_deep_clean_answer?: string | null
          last_name?: string | null
          lat?: number | null
          lng?: number | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          postal_code?: string | null
          recurrence_plan?: string | null
          referral_code?: string | null
          referral_link?: string | null
          square_customer_id?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string
          event: string
          id: string
          message_id: string | null
          meta: Json | null
          provider: string
          recipient: string | null
          template: string
          to_email: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          message_id?: string | null
          meta?: Json | null
          provider?: string
          recipient?: string | null
          template: string
          to_email: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          message_id?: string | null
          meta?: Json | null
          provider?: string
          recipient?: string | null
          template?: string
          to_email?: string
        }
        Relationships: []
      }
      email_jobs: {
        Row: {
          attempts: number
          category: string
          created_at: string
          event_id: string | null
          id: string
          last_error: string | null
          payload: Json
          provider_message_id: string | null
          sent_at: string | null
          status: string
          template_name: string
          to_email: string
          to_name: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          category?: string
          created_at?: string
          event_id?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string
          to_email: string
          to_name?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          category?: string
          created_at?: string
          event_id?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string
          to_email?: string
          to_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string | null
          email: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          reason?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          html: string
          id: string
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          html: string
          id?: string
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          html?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          payload: Json | null
          type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          payload?: Json | null
          type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      hcp_sync_log: {
        Row: {
          attempts: number
          booking_id: string
          created_at: string
          error_category: string | null
          hcp_customer_id: string | null
          hcp_job_id: string | null
          id: string
          last_error: string | null
          next_retry_at: string | null
          request_payload: Json | null
          response_payload: Json | null
          retry_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          booking_id: string
          created_at?: string
          error_category?: string | null
          hcp_customer_id?: string | null
          hcp_job_id?: string | null
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          booking_id?: string
          created_at?: string
          error_category?: string | null
          hcp_customer_id?: string | null
          hcp_job_id?: string | null
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hcp_sync_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          action: string
          booking_id: string | null
          created_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          integration_type: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          action: string
          booking_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          integration_type: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          booking_id?: string | null
          created_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          integration_type?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          active: boolean
          benefits: Json | null
          created_at: string
          description: string | null
          discount_percentage: number
          id: string
          monthly_fee: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          benefits?: Json | null
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: string
          monthly_fee?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          benefits?: Json | null
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: string
          monthly_fee?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_analytics: {
        Row: {
          created_at: string | null
          customer_id: string | null
          delivery_method: string
          id: string
          metadata: Json | null
          notification_id: string | null
          notification_type: string
          provider: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          delivery_method: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          notification_type: string
          provider?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          delivery_method?: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          notification_type?: string
          provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_analytics_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_id: string | null
          delivery_method: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          priority: number | null
          provider_used: string | null
          recipient_phone: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_method: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: number | null
          provider_used?: string | null
          recipient_phone?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_method?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: number | null
          provider_used?: string | null
          recipient_phone?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_options: {
        Row: {
          active: boolean
          code: string
          created_at: string
          deposit_percentage: number | null
          description: string | null
          discount_percentage: number | null
          id: string
          name: string
          requires_deposit: boolean | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          name: string
          requires_deposit?: boolean | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          deposit_percentage?: number | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          name?: string
          requires_deposit?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          balance_due: number | null
          booking_id: string
          charge_type: string | null
          created_at: string
          currency: string | null
          deposit_amount: number | null
          id: string
          invoice_id: string | null
          payment_method_id: string | null
          status: string
          stripe_payment_id: string
        }
        Insert: {
          amount: number
          balance_due?: number | null
          booking_id: string
          charge_type?: string | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          id?: string
          invoice_id?: string | null
          payment_method_id?: string | null
          status?: string
          stripe_payment_id: string
        }
        Update: {
          amount?: number
          balance_due?: number | null
          booking_id?: string
          charge_type?: string | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          id?: string
          invoice_id?: string | null
          payment_method_id?: string | null
          status?: string
          stripe_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_addons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          base_hourly_rate: number
          biweekly_discount: number
          ca_multiplier: number
          cleaners_per_team: number
          created_at: string
          deep_cleaning_multiplier: number
          id: string
          monthly_discount: number
          move_in_out_multiplier: number
          tx_multiplier: number
          updated_at: string
          weekly_discount: number
        }
        Insert: {
          base_hourly_rate?: number
          biweekly_discount?: number
          ca_multiplier?: number
          cleaners_per_team?: number
          created_at?: string
          deep_cleaning_multiplier?: number
          id?: string
          monthly_discount?: number
          move_in_out_multiplier?: number
          tx_multiplier?: number
          updated_at?: string
          weekly_discount?: number
        }
        Update: {
          base_hourly_rate?: number
          biweekly_discount?: number
          ca_multiplier?: number
          cleaners_per_team?: number
          created_at?: string
          deep_cleaning_multiplier?: number
          id?: string
          monthly_discount?: number
          move_in_out_multiplier?: number
          tx_multiplier?: number
          updated_at?: string
          weekly_discount?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          amount_cents: number
          applies_to: string
          code: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          issued_to_customer_id: string | null
          max_redemptions: number
          metadata: Json | null
          min_subtotal_cents: number
          redemptions: number
          reward_type: string | null
          service_type_restriction: string | null
          starts_at: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_cents: number
          applies_to?: string
          code: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          issued_to_customer_id?: string | null
          max_redemptions?: number
          metadata?: Json | null
          min_subtotal_cents?: number
          redemptions?: number
          reward_type?: string | null
          service_type_restriction?: string | null
          starts_at?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_cents?: number
          applies_to?: string
          code?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          issued_to_customer_id?: string | null
          max_redemptions?: number
          metadata?: Json | null
          min_subtotal_cents?: number
          redemptions?: number
          reward_type?: string | null
          service_type_restriction?: string | null
          starts_at?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_issued_to_customer_id_fkey"
            columns: ["issued_to_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          booking_id: string | null
          code: string
          created_at: string
          customer_id: string | null
          discount_cents: number
          id: string
        }
        Insert: {
          booking_id?: string | null
          code: string
          created_at?: string
          customer_id?: string | null
          discount_cents: number
          id?: string
        }
        Update: {
          booking_id?: string | null
          code?: string
          created_at?: string
          customer_id?: string | null
          discount_cents?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_services: {
        Row: {
          booking_id: string | null
          bundle_code: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          commitment_months: number | null
          created_at: string | null
          customer_id: string
          discount_percentage: number | null
          frequency: string
          id: string
          next_service_date: string | null
          pause_end_date: string | null
          pause_start_date: string | null
          price_per_service: number
          service_address: Json | null
          service_type: string
          status: string
          stripe_subscription_id: string | null
          total_amount_saved: number | null
          total_services_completed: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          bundle_code?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          commitment_months?: number | null
          created_at?: string | null
          customer_id: string
          discount_percentage?: number | null
          frequency: string
          id?: string
          next_service_date?: string | null
          pause_end_date?: string | null
          pause_start_date?: string | null
          price_per_service: number
          service_address?: Json | null
          service_type: string
          status?: string
          stripe_subscription_id?: string | null
          total_amount_saved?: number | null
          total_services_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          bundle_code?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          commitment_months?: number | null
          created_at?: string | null
          customer_id?: string
          discount_percentage?: number | null
          frequency?: string
          id?: string
          next_service_date?: string | null
          pause_end_date?: string | null
          pause_start_date?: string | null
          price_per_service?: number
          service_address?: Json | null
          service_type?: string
          status?: string
          stripe_subscription_id?: string | null
          total_amount_saved?: number | null
          total_services_completed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_config: {
        Row: {
          active: boolean
          cookie_days: number | null
          created_at: string
          currency: string
          get_amount: number | null
          give_amount: number | null
          id: string
          last_click_days: number | null
          referral_seed: string | null
          reward_amount: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          cookie_days?: number | null
          created_at?: string
          currency?: string
          get_amount?: number | null
          give_amount?: number | null
          id?: string
          last_click_days?: number | null
          referral_seed?: string | null
          reward_amount?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          cookie_days?: number | null
          created_at?: string
          currency?: string
          get_amount?: number | null
          give_amount?: number | null
          id?: string
          last_click_days?: number | null
          referral_seed?: string | null
          reward_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount_cents: number
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          redeemed_at: string | null
          status: string
          type: string
        }
        Insert: {
          amount_cents: number
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          redeemed_at?: string | null
          status?: string
          type: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          redeemed_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          attributed_at: string | null
          created_at: string
          id: string
          referred_customer_id: string | null
          referred_email: string
          referrer_customer_id: string
          status: string
          utms: Json | null
        }
        Insert: {
          attributed_at?: string | null
          created_at?: string
          id?: string
          referred_customer_id?: string | null
          referred_email: string
          referrer_customer_id: string
          status?: string
          utms?: Json | null
        }
        Update: {
          attributed_at?: string | null
          created_at?: string
          id?: string
          referred_customer_id?: string | null
          referred_email?: string
          referrer_customer_id?: string
          status?: string
          utms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          active: boolean
          city: string
          created_at: string
          id: string
          service_fee: number | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          active?: boolean
          city: string
          created_at?: string
          id?: string
          service_fee?: number | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          active?: boolean
          city?: string
          created_at?: string
          id?: string
          service_fee?: number | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          base_hours: number
          bi_weekly_discount: number
          cleaners_count: number
          created_at: string
          id: string
          monthly_discount: number
          service_multiplier: number
          service_type: string
          sqft_max: number | null
          sqft_min: number
          state: string
          state_multiplier: number
          updated_at: string
          weekly_discount: number
        }
        Insert: {
          base_hours: number
          bi_weekly_discount?: number
          cleaners_count?: number
          created_at?: string
          id?: string
          monthly_discount?: number
          service_multiplier?: number
          service_type: string
          sqft_max?: number | null
          sqft_min: number
          state: string
          state_multiplier?: number
          updated_at?: string
          weekly_discount?: number
        }
        Update: {
          base_hours?: number
          bi_weekly_discount?: number
          cleaners_count?: number
          created_at?: string
          id?: string
          monthly_discount?: number
          service_multiplier?: number
          service_type?: string
          sqft_max?: number | null
          sqft_min?: number
          state?: string
          state_multiplier?: number
          updated_at?: string
          weekly_discount?: number
        }
        Relationships: []
      }
      subscription_items: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          quantity: number
          stripe_price_id: string
          stripe_subscription_item_id: string
          subscription_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          quantity?: number
          stripe_price_id: string
          stripe_subscription_item_id: string
          subscription_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          quantity?: number
          stripe_price_id?: string
          stripe_subscription_item_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          booking_id: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string
          frequency: string
          id: string
          plan_name: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id: string
          frequency: string
          id?: string
          plan_name: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string
          frequency?: string
          id?: string
          plan_name?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_audit_log: {
        Row: {
          booking_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          execution_time_ms: number | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          trigger_source: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          trigger_source: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          execution_time_ms?: number | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_audit_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          active: boolean
          created_at: string
          event_types: string[]
          headers: Json | null
          id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_types?: string[]
          headers?: Json | null
          id?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_types?: string[]
          headers?: Json | null
          id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          attempts: number
          booking_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          payload: Json
          response_body: string | null
          response_headers: Json | null
          response_status: number | null
          webhook_config_id: string | null
        }
        Insert: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          payload: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          webhook_config_id?: string | null
        }
        Update: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          response_body?: string | null
          response_headers?: Json | null
          response_status?: number | null
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_delivery_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          processing_errors: string[] | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processing_errors?: string[] | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          processing_errors?: string[] | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      webhook_idempotency: {
        Row: {
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      webhook_queue: {
        Row: {
          attempts: number
          booking_id: string
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          booking_id: string
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          booking_id?: string
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_otp_codes: { Args: never; Returns: undefined }
      create_admin_user: {
        Args: { p_email: string; p_role?: string }
        Returns: string
      }
      generate_referral_code: {
        Args: { customer_email: string; customer_id: string }
        Returns: string
      }
      get_admin_role: { Args: { _user_id?: string }; Returns: string }
      get_pricing_config: {
        Args: never
        Returns: {
          base_hourly_rate: number
          biweekly_discount: number
          ca_multiplier: number
          cleaners_per_team: number
          created_at: string
          deep_cleaning_multiplier: number
          id: string
          monthly_discount: number
          move_in_out_multiplier: number
          tx_multiplier: number
          updated_at: string
          weekly_discount: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      issue_referral_code: {
        Args: { input_customer_id: string }
        Returns: string
      }
      save_pricing_config: { Args: { config_data: Json }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "recurring_active"
      charge_type: "deposit" | "full" | "subscription" | "addon"
      conversion_status:
        | "pending_offer"
        | "offer_sent"
        | "recurring_active"
        | "declined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "rescheduled",
        "cancelled",
        "completed",
        "recurring_active",
      ],
      charge_type: ["deposit", "full", "subscription", "addon"],
      conversion_status: [
        "pending_offer",
        "offer_sent",
        "recurring_active",
        "declined",
      ],
    },
  },
} as const
