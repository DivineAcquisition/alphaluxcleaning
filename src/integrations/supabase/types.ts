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
      orders: {
        Row: {
          add_ons: string[] | null
          amount: number
          auto_charged: boolean | null
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
          scheduled_date: string | null
          scheduled_time: string | null
          service_details: Json | null
          square_footage: number | null
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          add_ons?: string[] | null
          amount: number
          auto_charged?: boolean | null
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
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_details?: Json | null
          square_footage?: number | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          add_ons?: string[] | null
          amount?: number
          auto_charged?: boolean | null
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
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_details?: Json | null
          square_footage?: number | null
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_referral_code: {
        Args: {
          p_owner_email: string
          p_owner_name?: string
          p_custom_code?: string
        }
        Returns: Json
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
      validate_and_use_referral_code: {
        Args: {
          p_code: string
          p_user_email: string
          p_user_name?: string
          p_order_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "customer"
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
      app_role: ["admin", "employee", "customer"],
    },
  },
} as const
