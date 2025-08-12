export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          department: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role_display_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role_display_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role_display_name?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_onboard_existing_cleaners: {
        Args: { p_cleaners: Json }
        Returns: Json
      }
      calculate_subcontractor_tier: {
        Args: { p_review_count: number; p_completed_jobs: number }
        Returns: number
      }
      check_job_drop_restrictions: {
        Args: { p_subcontractor_id: string; p_service_date: string }
        Returns: Json
      }
      create_initial_admin_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_referral_code: {
        Args: {
          p_owner_email: string
          p_owner_name?: string
          p_custom_code?: string
        }
        Returns: Json
      }
      disconnect_calendar_token: {
        Args: { p_token_id: string }
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
          p_subcontractor_id: string
          p_date: string
          p_time_slots: string[]
        }
        Returns: {
          time_slot: string
          available: boolean
        }[]
      }
      get_available_subcontractors_by_location: {
        Args: {
          p_customer_city: string
          p_customer_state: string
          p_service_date: string
        }
        Returns: {
          subcontractor_id: string
          full_name: string
          email: string
          phone: string
          split_tier: string
          rating: number
          distance_priority: number
        }[]
      }
      get_estimate_status_safe: {
        Args: { p_estimate_id: string; p_email: string }
        Returns: Json
      }
      get_order_status_safe: {
        Args: { p_order_id: string }
        Returns: Json
      }
      get_tier_benefits: {
        Args: { p_tier_level: number }
        Returns: Json
      }
      get_user_calendar_token: {
        Args: { p_user_id: string; p_provider: string }
        Returns: Json[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      mark_onboarding_token_used: {
        Args: { p_token: string }
        Returns: Json
      }
      update_subcontractor_tier: {
        Args: { p_subcontractor_id: string }
        Returns: Json
      }
      upsert_busy_slot: {
        Args:
          | {
              p_calendar_id: string
              p_start_time: string
              p_end_time: string
              p_event_title?: string
              p_event_id?: string
            }
          | {
              p_calendar_id: string
              p_start_time: string
              p_end_time: string
              p_event_title?: string
              p_event_id?: string
              p_calendar_type?: string
            }
        Returns: Json
      }
      validate_and_use_referral_code: {
        Args: {
          p_code: string
          p_user_email: string
          p_user_name?: string
          p_order_id?: string
        }
        Returns: Json
      }
      validate_onboarding_token: {
        Args: { p_token: string }
        Returns: Json
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
