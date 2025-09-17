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
          arr: number | null
          at_risk: boolean | null
          balance_due: number | null
          conversion_status:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at: string
          customer_id: string
          deposit_amount: number | null
          est_price: number
          frequency: string
          ghl_contact_id: string | null
          housecall_job_id: string | null
          id: string
          manage_token: string | null
          manage_token_expires_at: string | null
          membership_plan_id: string | null
          mrr: number | null
          payment_option_id: string | null
          pricing_breakdown: Json | null
          property_details: Json | null
          recurring_active: boolean | null
          service_date: string | null
          service_time_window: string | null
          service_type: string
          source_channel: string | null
          special_instructions: string | null
          sqft_or_bedrooms: string
          status: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          time_slot: string | null
          utms: Json | null
          zip_code: string | null
        }
        Insert: {
          addons?: Json | null
          arr?: number | null
          at_risk?: boolean | null
          balance_due?: number | null
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at?: string
          customer_id: string
          deposit_amount?: number | null
          est_price: number
          frequency: string
          ghl_contact_id?: string | null
          housecall_job_id?: string | null
          id?: string
          manage_token?: string | null
          manage_token_expires_at?: string | null
          membership_plan_id?: string | null
          mrr?: number | null
          payment_option_id?: string | null
          pricing_breakdown?: Json | null
          property_details?: Json | null
          recurring_active?: boolean | null
          service_date?: string | null
          service_time_window?: string | null
          service_type: string
          source_channel?: string | null
          special_instructions?: string | null
          sqft_or_bedrooms: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          time_slot?: string | null
          utms?: Json | null
          zip_code?: string | null
        }
        Update: {
          addons?: Json | null
          arr?: number | null
          at_risk?: boolean | null
          balance_due?: number | null
          conversion_status?:
            | Database["public"]["Enums"]["conversion_status"]
            | null
          created_at?: string
          customer_id?: string
          deposit_amount?: number | null
          est_price?: number
          frequency?: string
          ghl_contact_id?: string | null
          housecall_job_id?: string | null
          id?: string
          manage_token?: string | null
          manage_token_expires_at?: string | null
          membership_plan_id?: string | null
          mrr?: number | null
          payment_option_id?: string | null
          pricing_breakdown?: Json | null
          property_details?: Json | null
          recurring_active?: boolean | null
          service_date?: string | null
          service_time_window?: string | null
          service_type?: string
          source_channel?: string | null
          special_instructions?: string | null
          sqft_or_bedrooms?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          time_slot?: string | null
          utms?: Json | null
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
        ]
      }
      customers: {
        Row: {
          address: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          lat: number | null
          lng: number | null
          name: string
          phone: string
          postal_code: string | null
          state: string
          stripe_customer_id: string | null
        }
        Insert: {
          address: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          phone: string
          postal_code?: string | null
          state: string
          stripe_customer_id?: string | null
        }
        Update: {
          address?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string
          postal_code?: string | null
          state?: string
          stripe_customer_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_pricing_config: {
        Args: Record<PropertyKey, never>
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
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
      save_pricing_config: {
        Args: { config_data: Json }
        Returns: undefined
      }
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
