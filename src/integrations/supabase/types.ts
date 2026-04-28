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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          company_name: string
          created_at: string
          document: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["access_request_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          company_name: string
          created_at?: string
          document: string
          email: string
          full_name: string
          id?: string
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          company_name?: string
          created_at?: string
          document?: string
          email?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      budget_requests: {
        Row: {
          company_id: string
          created_at: string
          experience_rating:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          experience_response_id: string | null
          id: string
          interest: Database["public"]["Enums"]["interest_type"]
          name: string
          status: Database["public"]["Enums"]["budget_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          company_id: string
          created_at?: string
          experience_rating?:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          experience_response_id?: string | null
          id?: string
          interest: Database["public"]["Enums"]["interest_type"]
          name: string
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          company_id?: string
          created_at?: string
          experience_rating?:
            | Database["public"]["Enums"]["experience_rating"]
            | null
          experience_response_id?: string | null
          id?: string
          interest?: Database["public"]["Enums"]["interest_type"]
          name?: string
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_requests_experience_response_id_fkey"
            columns: ["experience_response_id"]
            isOneToOne: false
            referencedRelation: "experience_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          alert_phone: string | null
          created_at: string
          google_reviews_url: string | null
          id: string
          initial_question: string | null
          initial_review_question: string
          is_active: boolean
          login_email: string | null
          logo_url: string | null
          name: string
          owner_user_id: string
          plan: Database["public"]["Enums"]["company_plan"]
          public_panel_token: string
          responsible_name: string | null
          review_google_url: string | null
          segment: string | null
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          alert_phone?: string | null
          created_at?: string
          google_reviews_url?: string | null
          id?: string
          initial_question?: string | null
          initial_review_question?: string
          is_active?: boolean
          login_email?: string | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          plan?: Database["public"]["Enums"]["company_plan"]
          public_panel_token?: string
          responsible_name?: string | null
          review_google_url?: string | null
          segment?: string | null
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          alert_phone?: string | null
          created_at?: string
          google_reviews_url?: string | null
          id?: string
          initial_question?: string | null
          initial_review_question?: string
          is_active?: boolean
          login_email?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          plan?: Database["public"]["Enums"]["company_plan"]
          public_panel_token?: string
          responsible_name?: string | null
          review_google_url?: string | null
          segment?: string | null
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      experience_responses: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          experience_rating: Database["public"]["Enums"]["experience_rating"]
          id: string
          name: string | null
          redirected_to_google: boolean
          status: Database["public"]["Enums"]["response_status"]
          updated_at: string
          wants_google_review: boolean
          whatsapp: string | null
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          experience_rating: Database["public"]["Enums"]["experience_rating"]
          id?: string
          name?: string | null
          redirected_to_google?: boolean
          status?: Database["public"]["Enums"]["response_status"]
          updated_at?: string
          wants_google_review?: boolean
          whatsapp?: string | null
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          experience_rating?: Database["public"]["Enums"]["experience_rating"]
          id?: string
          name?: string | null
          redirected_to_google?: boolean
          status?: Database["public"]["Enums"]["response_status"]
          updated_at?: string
          wants_google_review?: boolean
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_company: {
        Args: {
          _alert_phone?: string
          _google_url?: string
          _initial_question?: string
          _name: string
          _slug: string
        }
        Returns: string
      }
      admin_link_user_to_company: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["company_user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      can_manage_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      get_access_requests: {
        Args: never
        Returns: {
          company_name: string
          created_at: string
          document: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["access_request_status"]
          whatsapp: string
        }[]
      }
      get_admin_companies: {
        Args: never
        Returns: {
          alert_phone: string
          created_at: string
          google_reviews_url: string
          id: string
          initial_review_question: string
          name: string
          slug: string
        }[]
      }
      get_company_response_months: {
        Args: { _company_id: string }
        Returns: {
          month_label: string
          month_start: string
        }[]
      }
      get_public_company: {
        Args: { _slug: string }
        Returns: {
          alert_phone: string
          google_reviews_url: string
          id: string
          initial_review_question: string
          logo_url: string
          name: string
          segment: string
          slug: string
          whatsapp: string
        }[]
      }
      get_public_panel_metrics: {
        Args: { _month?: string; _slug: string; _token: string }
        Returns: {
          budget_requests: number
          company_name: string
          experience_index: number
          feedbacks: number
          google_redirects: number
          improve_count: number
          loved_count: number
          ok_count: number
          total_responses: number
        }[]
      }
      has_company_role: {
        Args: {
          _company_id: string
          _roles?: Database["public"]["Enums"]["company_user_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_experience_google_review_intent: {
        Args: { _response_id: string }
        Returns: boolean
      }
      submit_access_request: {
        Args: {
          _company_name: string
          _document: string
          _email: string
          _full_name: string
          _whatsapp: string
        }
        Returns: string
      }
      submit_budget_request: {
        Args: {
          _company_slug: string
          _experience_rating?: Database["public"]["Enums"]["experience_rating"]
          _experience_response_id?: string
          _interest: Database["public"]["Enums"]["interest_type"]
          _name: string
          _whatsapp: string
        }
        Returns: string
      }
      submit_experience_response: {
        Args: {
          _comment?: string
          _company_slug: string
          _experience_rating: Database["public"]["Enums"]["experience_rating"]
          _name?: string
          _redirected_to_google?: boolean
          _wants_google_review?: boolean
          _whatsapp?: string
        }
        Returns: string
      }
    }
    Enums: {
      access_request_status: "pending" | "approved" | "rejected"
      budget_status:
        | "novo"
        | "contatado"
        | "orcamento_enviado"
        | "fechado"
        | "perdido"
      company_plan: "starter" | "pro" | "premium"
      company_user_role: "super_admin" | "company_admin" | "viewer"
      experience_rating: "loved" | "ok" | "improve"
      interest_type:
        | "festa_infantil"
        | "casamento"
        | "evento_corporativo"
        | "servico_para_evento"
        | "outro"
      response_status: "novo" | "visto" | "resolvido"
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
      access_request_status: ["pending", "approved", "rejected"],
      budget_status: [
        "novo",
        "contatado",
        "orcamento_enviado",
        "fechado",
        "perdido",
      ],
      company_plan: ["starter", "pro", "premium"],
      company_user_role: ["super_admin", "company_admin", "viewer"],
      experience_rating: ["loved", "ok", "improve"],
      interest_type: [
        "festa_infantil",
        "casamento",
        "evento_corporativo",
        "servico_para_evento",
        "outro",
      ],
      response_status: ["novo", "visto", "resolvido"],
    },
  },
} as const
