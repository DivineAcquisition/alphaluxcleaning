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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          available_days: string[]
          available_times: string[]
          background_check_ok: boolean
          cleaning_experience: string
          client_id: string
          created_at: string
          email: string
          form_1099_signature_url: string | null
          form_1099_signed_at: string | null
          full_name: string
          has_car: boolean
          id: string
          interview_date: string | null
          manager_id: string | null
          notes: string | null
          onboarding_token: string | null
          orientation_date: string | null
          orientation_time: string | null
          phone: string
          status: string
          updated_at: string
          why_work_with_us: string
          zip_code: string
        }
        Insert: {
          available_days: string[]
          available_times: string[]
          background_check_ok: boolean
          cleaning_experience: string
          client_id?: string
          created_at?: string
          email: string
          form_1099_signature_url?: string | null
          form_1099_signed_at?: string | null
          full_name: string
          has_car: boolean
          id?: string
          interview_date?: string | null
          manager_id?: string | null
          notes?: string | null
          onboarding_token?: string | null
          orientation_date?: string | null
          orientation_time?: string | null
          phone: string
          status?: string
          updated_at?: string
          why_work_with_us: string
          zip_code: string
        }
        Update: {
          available_days?: string[]
          available_times?: string[]
          background_check_ok?: boolean
          cleaning_experience?: string
          client_id?: string
          created_at?: string
          email?: string
          form_1099_signature_url?: string | null
          form_1099_signed_at?: string | null
          full_name?: string
          has_car?: boolean
          id?: string
          interview_date?: string | null
          manager_id?: string | null
          notes?: string | null
          onboarding_token?: string | null
          orientation_date?: string | null
          orientation_time?: string | null
          phone?: string
          status?: string
          updated_at?: string
          why_work_with_us?: string
          zip_code?: string
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          bucket_start: string
          created_at: string
          email: string
          id: string
          ip_address: unknown
          last_attempt: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          bucket_start?: string
          created_at?: string
          email: string
          id?: string
          ip_address: unknown
          last_attempt?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          bucket_start?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          last_attempt?: string
        }
        Relationships: []
      }
      auth_redirects: {
        Row: {
          created_at: string | null
          id: string
          redirect_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          redirect_path: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          redirect_path?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      automated_notification_triggers: {
        Row: {
          created_at: string | null
          created_by: string | null
          delay_minutes: number | null
          delivery_methods: string[]
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          template_id: string | null
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          delivery_methods?: string[]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          delivery_methods?: string[]
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          template_id?: string | null
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_notification_triggers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          automation_rule_id: string
          error_message: string | null
          executed_at: string
          execution_data: Json | null
          id: string
          message_content: string | null
          recipient_email: string | null
          recipient_phone: string | null
          status: string
        }
        Insert: {
          automation_rule_id: string
          error_message?: string | null
          executed_at?: string
          execution_data?: Json | null
          id?: string
          message_content?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          status: string
        }
        Update: {
          automation_rule_id?: string
          error_message?: string | null
          executed_at?: string
          execution_data?: Json | null
          id?: string
          message_content?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          failure_count: number | null
          id: string
          last_run_at: string | null
          name: string
          success_count: number | null
          trigger_conditions: Json | null
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          failure_count?: number | null
          id?: string
          last_run_at?: string | null
          name: string
          success_count?: number | null
          trigger_conditions?: Json | null
          trigger_event: string
          type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          failure_count?: number | null
          id?: string
          last_run_at?: string | null
          name?: string
          success_count?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bi_insights_cache: {
        Row: {
          data: Json
          expires_at: string
          generated_at: string
          id: string
          insight_type: string
          time_period: string
        }
        Insert: {
          data: Json
          expires_at: string
          generated_at?: string
          id?: string
          insight_type: string
          time_period: string
        }
        Update: {
          data?: Json
          expires_at?: string
          generated_at?: string
          id?: string
          insight_type?: string
          time_period?: string
        }
        Relationships: []
      }
      bi_reports: {
        Row: {
          created_at: string
          created_by: string | null
          data_sources: string[]
          description: string | null
          filters: Json | null
          generation_count: number | null
          id: string
          is_public: boolean | null
          last_generated: string | null
          name: string
          report_type: string
          schedule_config: Json | null
          updated_at: string
          visualization_config: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_sources: string[]
          description?: string | null
          filters?: Json | null
          generation_count?: number | null
          id?: string
          is_public?: boolean | null
          last_generated?: string | null
          name: string
          report_type: string
          schedule_config?: Json | null
          updated_at?: string
          visualization_config?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_sources?: string[]
          description?: string | null
          filters?: Json | null
          generation_count?: number | null
          id?: string
          is_public?: boolean | null
          last_generated?: string | null
          name?: string
          report_type?: string
          schedule_config?: Json | null
          updated_at?: string
          visualization_config?: Json | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          assigned_employee_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          estimated_duration: number | null
          id: string
          order_id: string | null
          priority: string | null
          service_address: string
          service_date: string
          service_time: string
          special_instructions: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_employee_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          estimated_duration?: number | null
          id?: string
          order_id?: string | null
          priority?: string | null
          service_address: string
          service_date: string
          service_time: string
          special_instructions?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_employee_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          estimated_duration?: number | null
          id?: string
          order_id?: string | null
          priority?: string | null
          service_address?: string
          service_date?: string
          service_time?: string
          special_instructions?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      busy_slots: {
        Row: {
          calendar_id: string
          calendar_type: string
          created_at: string
          end_time: string
          event_id: string | null
          event_title: string | null
          id: string
          start_time: string
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          calendar_id: string
          calendar_type?: string
          created_at?: string
          end_time: string
          event_id?: string | null
          event_title?: string | null
          id?: string
          start_time: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          calendar_type?: string
          created_at?: string
          end_time?: string
          event_id?: string | null
          event_title?: string | null
          id?: string
          start_time?: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commercial_estimates: {
        Row: {
          address: string
          alternative_date: string | null
          alternative_time: string | null
          business_name: string
          business_type: string
          city: string
          cleaning_type: string
          contact_person: string
          created_at: string
          email: string
          frequency: string
          id: string
          number_of_floors: number
          number_of_offices: number
          number_of_restrooms: number
          phone: string
          preferred_time: string | null
          preferred_walkthrough_date: string
          preferred_walkthrough_time: string
          service_type: string
          special_requirements: string | null
          square_footage: number
          state: string
          status: string
          updated_at: string
          user_id: string | null
          zip_code: string
        }
        Insert: {
          address: string
          alternative_date?: string | null
          alternative_time?: string | null
          business_name: string
          business_type: string
          city: string
          cleaning_type: string
          contact_person: string
          created_at?: string
          email: string
          frequency: string
          id?: string
          number_of_floors?: number
          number_of_offices?: number
          number_of_restrooms?: number
          phone: string
          preferred_time?: string | null
          preferred_walkthrough_date: string
          preferred_walkthrough_time: string
          service_type: string
          special_requirements?: string | null
          square_footage: number
          state: string
          status?: string
          updated_at?: string
          user_id?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          alternative_date?: string | null
          alternative_time?: string | null
          business_name?: string
          business_type?: string
          city?: string
          cleaning_type?: string
          contact_person?: string
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          number_of_floors?: number
          number_of_offices?: number
          number_of_restrooms?: number
          phone?: string
          preferred_time?: string | null
          preferred_walkthrough_date?: string
          preferred_walkthrough_time?: string
          service_type?: string
          special_requirements?: string | null
          square_footage?: number
          state?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          business_license: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_license?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_license?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auto_renewal: boolean | null
          base_fee: number | null
          company_id: string
          contract_number: string
          contract_type: string
          created_at: string
          document_url: string | null
          end_date: string | null
          id: string
          maximum_payment: number | null
          minimum_payment: number | null
          performance_bonus_triggers: Json | null
          renewal_notice_days: number | null
          revenue_share_percentage: number | null
          signed_by_client: string | null
          signed_by_divine: string | null
          signed_date: string | null
          start_date: string
          status: string | null
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          auto_renewal?: boolean | null
          base_fee?: number | null
          company_id: string
          contract_number: string
          contract_type: string
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          maximum_payment?: number | null
          minimum_payment?: number | null
          performance_bonus_triggers?: Json | null
          renewal_notice_days?: number | null
          revenue_share_percentage?: number | null
          signed_by_client?: string | null
          signed_by_divine?: string | null
          signed_date?: string | null
          start_date: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          auto_renewal?: boolean | null
          base_fee?: number | null
          company_id?: string
          contract_number?: string
          contract_type?: string
          created_at?: string
          document_url?: string | null
          end_date?: string | null
          id?: string
          maximum_payment?: number | null
          minimum_payment?: number | null
          performance_bonus_triggers?: Json | null
          renewal_notice_days?: number | null
          revenue_share_percentage?: number | null
          signed_by_client?: string | null
          signed_by_divine?: string | null
          signed_date?: string | null
          start_date?: string
          status?: string | null
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          booking_id: string | null
          category: string | null
          cleanliness_rating: number | null
          created_at: string
          customer_email: string
          customer_name: string
          feedback_text: string | null
          id: string
          overall_rating: number | null
          photos: Json | null
          professionalism_rating: number | null
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          status: string | null
          subcontractor_id: string | null
          timeliness_rating: number | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          category?: string | null
          cleanliness_rating?: number | null
          created_at?: string
          customer_email: string
          customer_name: string
          feedback_text?: string | null
          id?: string
          overall_rating?: number | null
          photos?: Json | null
          professionalism_rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string | null
          subcontractor_id?: string | null
          timeliness_rating?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          category?: string | null
          cleanliness_rating?: number | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          feedback_text?: string | null
          id?: string
          overall_rating?: number | null
          photos?: Json | null
          professionalism_rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string | null
          subcontractor_id?: string | null
          timeliness_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_feedback_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notification_preferences: {
        Row: {
          booking_confirmations: boolean
          created_at: string
          customer_id: string
          email_enabled: boolean
          id: string
          payment_notifications: boolean
          phone_number: string | null
          preferred_language: string | null
          promotional_notifications: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_hours_before: number
          service_reminders: boolean
          service_updates: boolean
          sms_enabled: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          booking_confirmations?: boolean
          created_at?: string
          customer_id: string
          email_enabled?: boolean
          id?: string
          payment_notifications?: boolean
          phone_number?: string | null
          preferred_language?: string | null
          promotional_notifications?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_hours_before?: number
          service_reminders?: boolean
          service_updates?: boolean
          sms_enabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          booking_confirmations?: boolean
          created_at?: string
          customer_id?: string
          email_enabled?: boolean
          id?: string
          payment_notifications?: boolean
          phone_number?: string | null
          preferred_language?: string | null
          promotional_notifications?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_hours_before?: number
          service_reminders?: boolean
          service_updates?: boolean
          sms_enabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          image_url: string | null
          importance: string | null
          is_read: boolean
          message: string
          notification_type: string
          order_id: string | null
          read_at: string | null
          rich_content: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          image_url?: string | null
          importance?: string | null
          is_read?: boolean
          message: string
          notification_type: string
          order_id?: string | null
          read_at?: string | null
          rich_content?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          image_url?: string | null
          importance?: string | null
          is_read?: boolean
          message?: string
          notification_type?: string
          order_id?: string | null
          read_at?: string | null
          rich_content?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_service_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_notes: string | null
          id: string
          order_id: string | null
          request_data: Json
          request_type: string
          requested_by_email: string
          requested_by_name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          order_id?: string | null
          request_data?: Json
          request_type: string
          requested_by_email: string
          requested_by_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          order_id?: string | null
          request_data?: Json
          request_type?: string
          requested_by_email?: string
          requested_by_name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_service_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          close_reason: string | null
          company_id: string | null
          created_at: string
          deal_name: string
          deal_source: string | null
          expected_close_date: string | null
          id: string
          is_closed: boolean | null
          notes: string | null
          potential_value: number | null
          probability: number | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          close_reason?: string | null
          company_id?: string | null
          created_at?: string
          deal_name: string
          deal_source?: string | null
          expected_close_date?: string | null
          id?: string
          is_closed?: boolean | null
          notes?: string | null
          potential_value?: number | null
          probability?: number | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          close_reason?: string | null
          company_id?: string | null
          created_at?: string
          deal_name?: string
          deal_source?: string | null
          expected_close_date?: string | null
          id?: string
          is_closed?: boolean | null
          notes?: string | null
          potential_value?: number | null
          probability?: number | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_confidential: boolean | null
          mime_type: string | null
          tags: Json | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          company_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          company_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempt_time: string
          email: string
          failure_reason: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          created_at: string
          device_type: string | null
          feature_name: string
          id: string
          last_used: string
          total_time_spent_ms: number | null
          usage_count: number | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          feature_name: string
          id?: string
          last_used?: string
          total_time_spent_ms?: number | null
          usage_count?: number | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          feature_name?: string
          id?: string
          last_used?: string
          total_time_spent_ms?: number | null
          usage_count?: number | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      ghl_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          ghl_data: Json | null
          id: string
          last_synced_at: string | null
          lead_score: number | null
          order_id: string | null
          pipeline_id: string | null
          stage_id: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          ghl_data?: Json | null
          id?: string
          last_synced_at?: string | null
          lead_score?: number | null
          order_id?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          ghl_data?: Json | null
          id?: string
          last_synced_at?: string | null
          lead_score?: number | null
          order_id?: string | null
          pipeline_id?: string | null
          stage_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghl_contacts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date: string
          incident_type: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          config_data: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          service_name: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          config_data: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          service_name: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          service_name?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interview_slots: {
        Row: {
          applicant_id: string | null
          client_id: string
          created_at: string
          datetime: string
          id: string
          is_available: boolean
          updated_at: string
        }
        Insert: {
          applicant_id?: string | null
          client_id?: string
          created_at?: string
          datetime: string
          id?: string
          is_available?: boolean
          updated_at?: string
        }
        Update: {
          applicant_id?: string | null
          client_id?: string
          created_at?: string
          datetime?: string
          id?: string
          is_available?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_slots_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_tokens: {
        Row: {
          applicant_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_tokens_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          contract_id: string
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json | null
          notes: string | null
          payment_terms: string | null
          pdf_url: string | null
          sent_at: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          line_items?: Json | null
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json | null
          notes?: string | null
          payment_terms?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tracking: {
        Row: {
          actual_duration: unknown | null
          assignment_id: string | null
          check_in_location: string | null
          check_in_time: string | null
          check_out_location: string | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          photos: Json | null
          updated_at: string
        }
        Insert: {
          actual_duration?: unknown | null
          assignment_id?: string | null
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: Json | null
          updated_at?: string
        }
        Update: {
          actual_duration?: unknown | null
          assignment_id?: string | null
          check_in_location?: string | null
          check_in_time?: string | null
          check_out_location?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          photos?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tracking_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_job_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          company_id: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean | null
          location_type: string | null
          name: string
          square_footage: number | null
          state: string
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          company_id: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name: string
          square_footage?: number | null
          state: string
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          company_id?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name?: string
          square_footage?: number | null
          state?: string
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          company_id: string | null
          created_at: string
          id: string
          message: string
          message_type: string | null
          parent_message_id: string | null
          priority: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
          status: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          parent_message_id?: string | null
          priority?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
          status?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_analytics: {
        Row: {
          campaign_id: string | null
          created_at: string
          customer_id: string
          delivery_duration_ms: number | null
          delivery_method: string
          device_type: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          notification_id: string | null
          send_duration_ms: number | null
          user_agent: string | null
          variant: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          customer_id: string
          delivery_duration_ms?: number | null
          delivery_method: string
          device_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          notification_id?: string | null
          send_duration_ms?: number | null
          user_agent?: string | null
          variant?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          customer_id?: string
          delivery_duration_ms?: number | null
          delivery_method?: string
          device_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          notification_id?: string | null
          send_duration_ms?: number | null
          user_agent?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          content: Json | null
          delivered_at: string | null
          delivery_type: string
          error_message: string | null
          external_id: string | null
          id: string
          recipient_email: string | null
          recipient_id: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          content?: Json | null
          delivered_at?: string | null
          delivery_type: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          content?: Json | null
          delivered_at?: string | null
          delivery_type?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          automation_rule_id: string | null
          booking_id: string | null
          clicked_at: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_method: string
          error_message: string | null
          expires_at: string | null
          id: string
          max_attempts: number
          message: string
          notification_type: string
          order_id: string | null
          priority: number | null
          read_at: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string | null
          template_data: Json | null
          trigger_source: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          automation_rule_id?: string | null
          booking_id?: string | null
          clicked_at?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_method: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_attempts?: number
          message: string
          notification_type: string
          order_id?: string | null
          priority?: number | null
          read_at?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_data?: Json | null
          trigger_source?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          automation_rule_id?: string | null
          booking_id?: string | null
          clicked_at?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_method?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_attempts?: number
          message?: string
          notification_type?: string
          order_id?: string | null
          priority?: number | null
          read_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          template_data?: Json | null
          trigger_source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          content_template: Json
          created_at: string
          created_by: string | null
          delivery_method: string | null
          delivery_settings: Json | null
          id: string
          is_active: boolean | null
          message_template: string | null
          name: string
          priority: string | null
          recipient_rules: Json
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          content_template: Json
          created_at?: string
          created_by?: string | null
          delivery_method?: string | null
          delivery_settings?: Json | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          name: string
          priority?: string | null
          recipient_rules: Json
          trigger_event: string
          type: string
          updated_at?: string
        }
        Update: {
          content_template?: Json
          created_at?: string
          created_by?: string | null
          delivery_method?: string | null
          delivery_settings?: Json | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          name?: string
          priority?: string | null
          recipient_rules?: Json
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_status_updates: {
        Row: {
          created_at: string
          estimated_arrival_minutes: number | null
          id: string
          order_id: string | null
          status_message: string
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_arrival_minutes?: number | null
          id?: string
          order_id?: string | null
          status_message: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_arrival_minutes?: number | null
          id?: string
          order_id?: string | null
          status_message?: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_updates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_updates_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tips: {
        Row: {
          amount: number
          created_at: string
          customer_message: string | null
          distribution_method: string | null
          id: string
          order_id: string | null
          subcontractor_id: string | null
          tip_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_message?: string | null
          distribution_method?: string | null
          id?: string
          order_id?: string | null
          subcontractor_id?: string | null
          tip_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_message?: string | null
          distribution_method?: string | null
          id?: string
          order_id?: string | null
          subcontractor_id?: string | null
          tip_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_tips_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tips_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          add_ons: string[] | null
          amount: number
          auto_charged: boolean | null
          cancellation_reason: string | null
          cleaning_type: string | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          employee_notes: string | null
          frequency: string | null
          id: string
          is_recurring: boolean | null
          next_service_date: string | null
          paused_until: string | null
          payment_metadata: Json | null
          payment_status: string | null
          preferred_time: string | null
          recurring_frequency: string | null
          retention_discount_accepted: boolean | null
          retention_discount_offered: boolean | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_details: Json | null
          service_status: string | null
          square_footage: number | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          stripe_setup_intent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          add_ons?: string[] | null
          amount: number
          auto_charged?: boolean | null
          cancellation_reason?: string | null
          cleaning_type?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_notes?: string | null
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          next_service_date?: string | null
          paused_until?: string | null
          payment_metadata?: Json | null
          payment_status?: string | null
          preferred_time?: string | null
          recurring_frequency?: string | null
          retention_discount_accepted?: boolean | null
          retention_discount_offered?: boolean | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_details?: Json | null
          service_status?: string | null
          square_footage?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          add_ons?: string[] | null
          amount?: number
          auto_charged?: boolean | null
          cancellation_reason?: string | null
          cleaning_type?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          employee_notes?: string | null
          frequency?: string | null
          id?: string
          is_recurring?: boolean | null
          next_service_date?: string | null
          paused_until?: string | null
          payment_metadata?: Json | null
          payment_status?: string | null
          preferred_time?: string | null
          recurring_frequency?: string | null
          retention_discount_accepted?: boolean | null
          retention_discount_offered?: boolean | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_details?: Json | null
          service_status?: string | null
          square_footage?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          payment_data: Json | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          payment_data?: Json | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          payment_data?: Json | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_retries: {
        Row: {
          created_at: string
          failure_code: string | null
          id: string
          last_retry_at: string | null
          payment_intent_id: string
          retry_count: number | null
          retry_reason: string | null
          retry_strategy: string | null
        }
        Insert: {
          created_at?: string
          failure_code?: string | null
          id?: string
          last_retry_at?: string | null
          payment_intent_id: string
          retry_count?: number | null
          retry_reason?: string | null
          retry_strategy?: string | null
        }
        Update: {
          created_at?: string
          failure_code?: string | null
          id?: string
          last_retry_at?: string | null
          payment_intent_id?: string
          retry_count?: number | null
          retry_reason?: string | null
          retry_strategy?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          bank_account_last_four: string | null
          company_id: string
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string | null
          processed_by: string | null
          reference_number: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          bank_account_last_four?: string | null
          company_id: string
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_amount: number
          payment_date: string
          payment_method?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_last_four?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string | null
          processed_by?: string | null
          reference_number?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          bonus_eligible: boolean | null
          complaints_count: number | null
          created_at: string
          customer_rating: number | null
          id: string
          jobs_completed: number | null
          month_year: string
          on_time_percentage: number | null
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          bonus_eligible?: boolean | null
          complaints_count?: number | null
          created_at?: string
          customer_rating?: number | null
          id?: string
          jobs_completed?: number | null
          month_year: string
          on_time_percentage?: number | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          bonus_eligible?: boolean | null
          complaints_count?: number | null
          created_at?: string
          customer_rating?: number | null
          id?: string
          jobs_completed?: number | null
          month_year?: string
          on_time_percentage?: number | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics_log: {
        Row: {
          bundle_size_kb: number | null
          connection_type: string | null
          cumulative_layout_shift: number | null
          device_type: string | null
          first_contentful_paint_ms: number | null
          first_input_delay_ms: number | null
          id: string
          largest_contentful_paint_ms: number | null
          load_time_ms: number | null
          page_url: string
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bundle_size_kb?: number | null
          connection_type?: string | null
          cumulative_layout_shift?: number | null
          device_type?: string | null
          first_contentful_paint_ms?: number | null
          first_input_delay_ms?: number | null
          id?: string
          largest_contentful_paint_ms?: number | null
          load_time_ms?: number | null
          page_url: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bundle_size_kb?: number | null
          connection_type?: string | null
          cumulative_layout_shift?: number | null
          device_type?: string | null
          first_contentful_paint_ms?: number | null
          first_input_delay_ms?: number | null
          id?: string
          largest_contentful_paint_ms?: number | null
          load_time_ms?: number | null
          page_url?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          company_id: string | null
          created_at: string
          customer_since: string | null
          department: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role_display_name: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          customer_since?: string | null
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role_display_name?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          customer_since?: string | null
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role_display_name?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_reports: {
        Row: {
          areas_inspected: Json | null
          cleanliness_rating: number | null
          client_signature: string | null
          company_id: string
          corrective_actions: Json | null
          created_at: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          inspection_date: string
          inspector_name: string
          inspector_signature: string | null
          issues_found: Json | null
          location_id: string | null
          notes: string | null
          overall_rating: number | null
          photos: Json | null
          professionalism_rating: number | null
          service_id: string
          timeliness_rating: number | null
          updated_at: string
        }
        Insert: {
          areas_inspected?: Json | null
          cleanliness_rating?: number | null
          client_signature?: string | null
          company_id: string
          corrective_actions?: Json | null
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_date: string
          inspector_name: string
          inspector_signature?: string | null
          issues_found?: Json | null
          location_id?: string | null
          notes?: string | null
          overall_rating?: number | null
          photos?: Json | null
          professionalism_rating?: number | null
          service_id: string
          timeliness_rating?: number | null
          updated_at?: string
        }
        Update: {
          areas_inspected?: Json | null
          cleanliness_rating?: number | null
          client_signature?: string | null
          company_id?: string
          corrective_actions?: Json | null
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          inspector_signature?: string | null
          issues_found?: Json | null
          location_id?: string | null
          notes?: string | null
          overall_rating?: number | null
          photos?: Json | null
          professionalism_rating?: number | null
          service_id?: string
          timeliness_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tip_schedules: {
        Row: {
          amount: number
          created_at: string
          customer_message: string | null
          distribution_method: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_tip_date: string
          order_id: string | null
          tip_type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_message?: string | null
          distribution_method?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_tip_date: string
          order_id?: string | null
          tip_type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_message?: string | null
          distribution_method?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_tip_date?: string
          order_id?: string | null
          tip_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_tip_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          owner_email: string
          owner_name: string | null
          reward_type: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          owner_email: string
          owner_name?: string | null
          reward_type?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          owner_email?: string
          owner_name?: string | null
          reward_type?: string | null
        }
        Relationships: []
      }
      referral_uses: {
        Row: {
          id: string
          order_id: string | null
          referral_code_id: string | null
          reward_applied: boolean | null
          used_at: string | null
          used_by_email: string
          used_by_name: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          referral_code_id?: string | null
          reward_applied?: boolean | null
          used_at?: string | null
          used_by_email: string
          used_by_name?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          referral_code_id?: string | null
          reward_applied?: boolean | null
          used_at?: string | null
          used_by_email?: string
          used_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_uses_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_entries: {
        Row: {
          cleaning_cost: number | null
          company_id: string
          contract_id: string
          created_at: string
          created_by: string | null
          entry_date: string
          entry_method: string
          id: string
          location_id: string | null
          notes: string | null
          revenue_amount: number
          revenue_share_amount: number | null
          source_system: string | null
          supporting_documents: Json | null
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cleaning_cost?: number | null
          company_id: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          entry_date: string
          entry_method: string
          id?: string
          location_id?: string | null
          notes?: string | null
          revenue_amount: number
          revenue_share_amount?: number | null
          source_system?: string | null
          supporting_documents?: Json | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cleaning_cost?: number | null
          company_id?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_method?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          revenue_amount?: number
          revenue_share_amount?: number | null
          source_system?: string | null
          supporting_documents?: Json | null
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      search_indices: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          indexed_at: string
          metadata: Json | null
          searchable_content: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          indexed_at?: string
          metadata?: Json | null
          searchable_content: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          indexed_at?: string
          metadata?: Json | null
          searchable_content?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          risk_level: string
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_modifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          modification_type: string
          new_value: Json | null
          old_value: Json | null
          order_id: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          modification_type: string
          new_value?: Json | null
          old_value?: Json | null
          order_id?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          modification_type?: string
          new_value?: Json | null
          old_value?: Json | null
          order_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_modifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          client_feedback: string | null
          company_id: string
          completion_photos: Json | null
          contract_id: string
          cost: number | null
          created_at: string
          hours_worked: number | null
          id: string
          location_id: string | null
          notes: string | null
          service_date: string
          service_time: string | null
          service_type: string
          status: string | null
          supplies_used: Json | null
          team_members: Json | null
          updated_at: string
        }
        Insert: {
          client_feedback?: string | null
          company_id: string
          completion_photos?: Json | null
          contract_id: string
          cost?: number | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          service_date: string
          service_time?: string | null
          service_type: string
          status?: string | null
          supplies_used?: Json | null
          team_members?: Json | null
          updated_at?: string
        }
        Update: {
          client_feedback?: string | null
          company_id?: string
          completion_photos?: Json | null
          contract_id?: string
          cost?: number | null
          created_at?: string
          hours_worked?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          service_date?: string
          service_time?: string | null
          service_type?: string
          status?: string | null
          supplies_used?: Json | null
          team_members?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          availability: string
          background_check_consent: boolean
          brand_shirt_consent: boolean
          can_lift_heavy_items: boolean
          city: string | null
          comfortable_with_chemicals: boolean
          completed_at: string | null
          created_at: string
          drivers_license_image_url: string | null
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          full_name: string
          has_drivers_license: boolean
          has_own_vehicle: boolean
          id: string
          phone: string
          preferred_work_areas: string | null
          previous_cleaning_experience: string | null
          reliable_transportation: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          subcontractor_agreement_consent: boolean
          updated_at: string
          why_join_us: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          availability: string
          background_check_consent?: boolean
          brand_shirt_consent?: boolean
          can_lift_heavy_items?: boolean
          city?: string | null
          comfortable_with_chemicals?: boolean
          completed_at?: string | null
          created_at?: string
          drivers_license_image_url?: string | null
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          full_name: string
          has_drivers_license?: boolean
          has_own_vehicle?: boolean
          id?: string
          phone: string
          preferred_work_areas?: string | null
          previous_cleaning_experience?: string | null
          reliable_transportation?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          subcontractor_agreement_consent?: boolean
          updated_at?: string
          why_join_us: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          availability?: string
          background_check_consent?: boolean
          brand_shirt_consent?: boolean
          can_lift_heavy_items?: boolean
          city?: string | null
          comfortable_with_chemicals?: boolean
          completed_at?: string | null
          created_at?: string
          drivers_license_image_url?: string | null
          email?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          full_name?: string
          has_drivers_license?: boolean
          has_own_vehicle?: boolean
          id?: string
          phone?: string
          preferred_work_areas?: string | null
          previous_cleaning_experience?: string | null
          reliable_transportation?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          subcontractor_agreement_consent?: boolean
          updated_at?: string
          why_join_us?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      subcontractor_job_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string
          booking_id: string | null
          completed_at: string | null
          created_at: string
          customer_rating: number | null
          drop_reason: string | null
          dropped_at: string | null
          id: string
          status: string
          subcontractor_id: string | null
          subcontractor_notes: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_rating?: number | null
          drop_reason?: string | null
          dropped_at?: string | null
          id?: string
          status?: string
          subcontractor_id?: string | null
          subcontractor_notes?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_rating?: number | null
          drop_reason?: string | null
          dropped_at?: string | null
          id?: string
          status?: string
          subcontractor_id?: string | null
          subcontractor_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_job_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_job_assignments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_job_drops: {
        Row: {
          assignment_id: string | null
          booking_id: string | null
          created_at: string
          dropped_at: string
          hours_before_service: number
          id: string
          reason: string | null
          service_date: string
          subcontractor_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          booking_id?: string | null
          created_at?: string
          dropped_at?: string
          hours_before_service: number
          id?: string
          reason?: string | null
          service_date: string
          subcontractor_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          booking_id?: string | null
          created_at?: string
          dropped_at?: string
          hours_before_service?: number
          id?: string
          reason?: string | null
          service_date?: string
          subcontractor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_job_drops_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_job_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_job_drops_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_job_drops_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          subcontractor_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          subcontractor_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          subcontractor_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_notifications_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_onboarding_tokens: {
        Row: {
          application_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_onboarding_tokens_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_payments: {
        Row: {
          assignment_id: string | null
          booking_id: string | null
          company_amount: number
          created_at: string
          hourly_rate: number | null
          id: string
          monthly_fee: number | null
          paid_at: string | null
          payment_status: string | null
          split_percentage: number
          subcontractor_amount: number
          subcontractor_id: string | null
          tier_level: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          booking_id?: string | null
          company_amount: number
          created_at?: string
          hourly_rate?: number | null
          id?: string
          monthly_fee?: number | null
          paid_at?: string | null
          payment_status?: string | null
          split_percentage: number
          subcontractor_amount: number
          subcontractor_id?: string | null
          tier_level?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          booking_id?: string | null
          company_amount?: number
          created_at?: string
          hourly_rate?: number | null
          id?: string
          monthly_fee?: number | null
          paid_at?: string | null
          payment_status?: string | null
          split_percentage?: number
          subcontractor_amount?: number
          subcontractor_id?: string | null
          tier_level?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_payments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_job_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_payments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_profiles: {
        Row: {
          account_number: string | null
          account_number_last_four: string | null
          background_check_consent: boolean | null
          background_check_copy_consent: boolean | null
          biography: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          legal_name: string | null
          profile_image_url: string | null
          routing_number: string | null
          ssn: string | null
          ssn_last_four: string | null
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_number_last_four?: string | null
          background_check_consent?: boolean | null
          background_check_copy_consent?: boolean | null
          biography?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          legal_name?: string | null
          profile_image_url?: string | null
          routing_number?: string | null
          ssn?: string | null
          ssn_last_four?: string | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_number_last_four?: string | null
          background_check_consent?: boolean | null
          background_check_copy_consent?: boolean | null
          biography?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          legal_name?: string | null
          profile_image_url?: string | null
          routing_number?: string | null
          ssn?: string | null
          ssn_last_four?: string | null
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_profiles_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_restrictions: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          reason: string
          restriction_type: string
          start_date: string
          subcontractor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          restriction_type?: string
          start_date?: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          restriction_type?: string
          start_date?: string
          subcontractor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_restrictions_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          account_status: string | null
          address: string
          calendar_id: string | null
          city: string
          completed_jobs_count: number | null
          created_at: string
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          jobs_completed_this_month: number | null
          monthly_fee: number | null
          phone: string | null
          rating: number | null
          review_count: number | null
          split_tier: string
          state: string
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          tier_level: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string | null
          zip_code: string
        }
        Insert: {
          account_status?: string | null
          address: string
          calendar_id?: string | null
          city: string
          completed_jobs_count?: number | null
          created_at?: string
          email: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          jobs_completed_this_month?: number | null
          monthly_fee?: number | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          split_tier: string
          state: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tier_level?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string | null
          zip_code: string
        }
        Update: {
          account_status?: string | null
          address?: string
          calendar_id?: string | null
          city?: string
          completed_jobs_count?: number | null
          created_at?: string
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          jobs_completed_this_month?: number | null
          monthly_fee?: number | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          split_tier?: string
          state?: string
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tier_level?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          alert_threshold: number | null
          environment: string | null
          id: string
          is_critical: boolean | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          service_name: string | null
          timestamp: string
        }
        Insert: {
          alert_threshold?: number | null
          environment?: string | null
          id?: string
          is_critical?: boolean | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          service_name?: string | null
          timestamp?: string
        }
        Update: {
          alert_threshold?: number | null
          environment?: string | null
          id?: string
          is_critical?: boolean | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          service_name?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      tier_change_history: {
        Row: {
          automatic: boolean | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_tier: number | null
          old_tier: number | null
          subcontractor_id: string | null
        }
        Insert: {
          automatic?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_tier?: number | null
          old_tier?: number | null
          subcontractor_id?: string | null
        }
        Update: {
          automatic?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_tier?: number | null
          old_tier?: number | null
          subcontractor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_change_history_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_system_config: {
        Row: {
          created_at: string | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          jobs_required: number
          monthly_fee: number
          reviews_required: number
          tier_level: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          jobs_required: number
          monthly_fee: number
          reviews_required: number
          tier_level: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          jobs_required?: number
          monthly_fee?: number
          reviews_required?: number
          tier_level?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tip_analytics: {
        Row: {
          average_tip: number | null
          created_at: string
          id: string
          month_year: string
          tip_count: number | null
          total_tips: number | null
          updated_at: string
        }
        Insert: {
          average_tip?: number | null
          created_at?: string
          id?: string
          month_year: string
          tip_count?: number | null
          total_tips?: number | null
          updated_at?: string
        }
        Update: {
          average_tip?: number | null
          created_at?: string
          id?: string
          month_year?: string
          tip_count?: number | null
          total_tips?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      trigger_execution_log: {
        Row: {
          entity_id: string
          entity_type: string
          error_message: string | null
          executed_at: string | null
          execution_data: Json | null
          execution_status: string | null
          id: string
          trigger_id: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          error_message?: string | null
          executed_at?: string | null
          execution_data?: Json | null
          execution_status?: string | null
          id?: string
          trigger_id?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          executed_at?: string | null
          execution_data?: Json | null
          execution_status?: string | null
          id?: string
          trigger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trigger_execution_log_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "automated_notification_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          id: string
          is_active: boolean
          provider: string
          refresh_token: string | null
          scope: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          scope: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          scope?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          duration_ms: number | null
          element_id: string | null
          element_type: string | null
          error_message: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          page_url: string
          session_id: string
          success: boolean | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          duration_ms?: number | null
          element_id?: string | null
          element_type?: string | null
          error_message?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          page_url: string
          session_id: string
          success?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          duration_ms?: number | null
          element_id?: string | null
          element_type?: string | null
          error_message?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          page_url?: string
          session_id?: string
          success?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_satisfaction: {
        Row: {
          category: string | null
          feedback_text: string | null
          id: string
          page_url: string | null
          resolution_notes: string | null
          resolved: boolean | null
          satisfaction_score: number | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          feedback_text?: string | null
          id?: string
          page_url?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          satisfaction_score?: number | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          feedback_text?: string | null
          id?: string
          page_url?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          satisfaction_score?: number | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          terminated_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          terminated_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          terminated_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_configurations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          organization_name: string
          updated_at: string
          webhook_events: string[]
          webhook_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_name?: string
          updated_at?: string
          webhook_events?: string[]
          webhook_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          organization_name?: string
          updated_at?: string
          webhook_events?: string[]
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string
          delivery_attempt: number
          error_message: string | null
          event_type: string
          id: string
          is_success: boolean
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_config_id: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          delivery_attempt?: number
          error_message?: string | null
          event_type: string
          id?: string
          is_success?: boolean
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_config_id?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          delivery_attempt?: number
          error_message?: string | null
          event_type?: string
          id?: string
          is_success?: boolean
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_config_id?: string | null
          webhook_url?: string
        }
        Relationships: [
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
          event_data: Json
          event_type: string
          id: string
          processed_at: string
          source: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          processed_at?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          processed_at?: string
          source?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_status: number | null
          success: boolean
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_status?: number | null
          success?: boolean
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_status?: number | null
          success?: boolean
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_queue: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          max_retries: number | null
          payload: Json
          processed_at: string | null
          retry_count: number | null
          status: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          max_retries?: number | null
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_data: Json | null
          execution_time_ms: number | null
          id: string
          started_at: string
          status: string
          template_id: string | null
          trigger_data: Json | null
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          execution_time_ms?: number | null
          id?: string
          started_at?: string
          status?: string
          template_id?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json | null
          execution_time_ms?: number | null
          id?: string
          started_at?: string
          status?: string
          template_id?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          actions: Json
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          name: string
          success_rate: number | null
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          success_rate?: number | null
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          success_rate?: number | null
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_can_manage_payments: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      bulk_onboard_existing_cleaners: {
        Args: { p_cleaners: Json }
        Returns: Json
      }
      calculate_subcontractor_tier: {
        Args: { p_completed_jobs: number; p_review_count: number }
        Returns: number
      }
      can_access_sensitive_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_access_subcontractor_data: {
        Args: { p_subcontractor_user_id: string }
        Returns: boolean
      }
      check_auth_rate_limit: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      check_job_drop_restrictions: {
        Args: { p_service_date: string; p_subcontractor_id: string }
        Returns: Json
      }
      check_suspicious_activity: {
        Args: { p_user_id: string }
        Returns: Json
      }
      create_initial_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_notification_safe: {
        Args:
          | {
              p_action_label?: string
              p_action_url?: string
              p_booking_id?: string
              p_customer_id: string
              p_importance?: string
              p_message: string
              p_notification_type: string
              p_order_id?: string
              p_title: string
            }
          | {
              p_message: string
              p_subcontractor_id: string
              p_title: string
              p_type?: string
              p_user_id: string
            }
        Returns: string
      }
      create_referral_code: {
        Args: {
          p_custom_code?: string
          p_owner_email: string
          p_owner_name?: string
        }
        Returns: Json
      }
      create_test_admin_secure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      disconnect_calendar_token: {
        Args: { p_token_id: string }
        Returns: Json
      }
      enhanced_admin_verification: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      execute_workflow: {
        Args: {
          p_template_id: string
          p_trigger_data?: Json
          p_triggered_by?: string
        }
        Returns: string
      }
      fix_admin_users_secure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_bi_insights: {
        Args: { p_insight_type: string; p_time_period?: string }
        Returns: Json
      }
      get_application_by_token: {
        Args: { p_token: string }
        Returns: Json
      }
      get_automation_success_rate: {
        Args: { rule_id: string }
        Returns: number
      }
      get_available_slots: {
        Args: {
          p_date: string
          p_subcontractor_id: string
          p_time_slots: string[]
        }
        Returns: {
          available: boolean
          time_slot: string
        }[]
      }
      get_available_subcontractors_by_location: {
        Args: {
          p_customer_city: string
          p_customer_state: string
          p_service_date: string
        }
        Returns: {
          distance_priority: number
          email: string
          full_name: string
          phone: string
          rating: number
          split_tier: string
          subcontractor_id: string
        }[]
      }
      get_booking_status_safe: {
        Args: { p_booking_id: string; p_customer_email: string }
        Returns: Json
      }
      get_customer_order_status_secure: {
        Args: { p_customer_email: string; p_order_id: string }
        Returns: Json
      }
      get_estimate_status_safe: {
        Args: { p_email: string; p_estimate_id: string }
        Returns: Json
      }
      get_order_status_safe: {
        Args: { p_order_id: string }
        Returns: Json
      }
      get_performance_insights: {
        Args: { p_days?: number }
        Returns: Json
      }
      get_subcontractor_hub_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_subcontractor_summary_safe: {
        Args: { p_subcontractor_id: string }
        Returns: Json
      }
      get_subcontractors_admin_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          city: string
          completed_jobs_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_available: boolean
          phone: string
          rating: number
          review_count: number
          state: string
          subscription_status: string
          tier_level: number
          updated_at: string
        }[]
      }
      get_tier_benefits: {
        Args: { p_tier_level: number }
        Returns: Json
      }
      get_user_calendar_token: {
        Args: { p_provider: string; p_user_id: string }
        Returns: Json[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      intelligent_search: {
        Args: { p_entity_types?: string[]; p_limit?: number; p_query: string }
        Returns: {
          entity_id: string
          entity_type: string
          highlight: string
          metadata: Json
          relevance_score: number
        }[]
      }
      log_performance_metric: {
        Args: {
          p_bundle_size_kb?: number
          p_cls?: number
          p_connection_type?: string
          p_device_type?: string
          p_fcp_ms?: number
          p_fid_ms?: number
          p_lcp_ms?: number
          p_load_time_ms?: number
          p_page_url?: string
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action_type: string
          p_ip_address?: unknown
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_risk_level?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_security_event_enhanced: {
        Args: {
          p_action_type: string
          p_ip_address?: unknown
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_risk_level?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: {
          p_operation: string
          p_table_name: string
          p_target_user_id?: string
        }
        Returns: undefined
      }
      mark_notification_read: {
        Args: { p_customer_id: string; p_notification_id: string }
        Returns: boolean
      }
      mark_onboarding_token_used: {
        Args: { p_token: string }
        Returns: Json
      }
      mask_sensitive_field: {
        Args: { field_value: string }
        Returns: string
      }
      process_automated_triggers: {
        Args: {
          p_entity_data?: Json
          p_entity_id: string
          p_entity_type: string
          p_event_type: string
        }
        Returns: Json
      }
      queue_notification: {
        Args: {
          p_booking_id?: string
          p_customer_id: string
          p_message: string
          p_notification_type: string
          p_order_id?: string
          p_priority?: number
          p_scheduled_for?: string
          p_subject: string
          p_template_data?: Json
        }
        Returns: Json
      }
      send_intelligent_notification: {
        Args: {
          p_context_data?: Json
          p_recipient_email?: string
          p_recipient_id?: string
          p_template_id: string
        }
        Returns: string
      }
      send_subcontractor_update_webhook: {
        Args: {
          p_assignment_id?: string
          p_estimated_arrival_minutes?: number
          p_location?: Json
          p_message?: string
          p_notes?: string
          p_order_id?: string
          p_photos?: Json
          p_status?: string
          p_subcontractor_id?: string
          p_update_type: string
        }
        Returns: undefined
      }
      track_feature_usage: {
        Args: {
          p_device_type?: string
          p_feature_name: string
          p_time_spent_ms?: number
          p_user_id: string
          p_user_role?: string
        }
        Returns: undefined
      }
      update_subcontractor_tier: {
        Args: { p_subcontractor_id: string }
        Returns: Json
      }
      upsert_busy_slot: {
        Args:
          | {
              p_calendar_id: string
              p_calendar_type?: string
              p_end_time: string
              p_event_id?: string
              p_event_title?: string
              p_start_time: string
            }
          | {
              p_calendar_id: string
              p_end_time: string
              p_event_id?: string
              p_event_title?: string
              p_start_time: string
            }
        Returns: Json
      }
      validate_and_use_referral_code: {
        Args: {
          p_code: string
          p_order_id?: string
          p_user_email: string
          p_user_name?: string
        }
        Returns: Json
      }
      validate_onboarding_token: {
        Args: { p_token: string }
        Returns: Json
      }
      validate_referral_code_secure: {
        Args: { p_code: string }
        Returns: Json
      }
      verify_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "enterprise_client"
        | "subcontractor"
        | "customer"
        | "owner"
        | "office_manager"
        | "field_cleaner"
        | "recurring_cleaner"
        | "subcontractor_partner"
        | "client"
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
      app_role: [
        "super_admin",
        "enterprise_client",
        "subcontractor",
        "customer",
        "owner",
        "office_manager",
        "field_cleaner",
        "recurring_cleaner",
        "subcontractor_partner",
        "client",
      ],
    },
  },
} as const
