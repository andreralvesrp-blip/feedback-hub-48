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
      budget_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          interest: Database["public"]["Enums"]["interest_type"]
          name: string
          nps_response_id: string | null
          nps_score: number | null
          status: Database["public"]["Enums"]["budget_status"]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          interest: Database["public"]["Enums"]["interest_type"]
          name: string
          nps_response_id?: string | null
          nps_score?: number | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          interest?: Database["public"]["Enums"]["interest_type"]
          name?: string
          nps_response_id?: string | null
          nps_score?: number | null
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
            foreignKeyName: "budget_requests_nps_response_id_fkey"
            columns: ["nps_response_id"]
            isOneToOne: false
            referencedRelation: "nps_responses"
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
          is_active: boolean
          login_email: string | null
          logo_url: string | null
          name: string
          owner_user_id: string
          plan: Database["public"]["Enums"]["company_plan"]
          public_panel_token: string
          responsible_name: string | null
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
          is_active?: boolean
          login_email?: string | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          plan?: Database["public"]["Enums"]["company_plan"]
          public_panel_token?: string
          responsible_name?: string | null
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
          is_active?: boolean
          login_email?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          plan?: Database["public"]["Enums"]["company_plan"]
          public_panel_token?: string
          responsible_name?: string | null
          segment?: string | null
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      nps_responses: {
        Row: {
          classification: Database["public"]["Enums"]["nps_classification"]
          comment: string | null
          company_id: string
          created_at: string
          id: string
          name: string | null
          redirected_to_google: boolean
          score: number
          status: Database["public"]["Enums"]["response_status"]
          updated_at: string
          wants_google_review: boolean
          whatsapp: string | null
        }
        Insert: {
          classification: Database["public"]["Enums"]["nps_classification"]
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          name?: string | null
          redirected_to_google?: boolean
          score: number
          status?: Database["public"]["Enums"]["response_status"]
          updated_at?: string
          wants_google_review?: boolean
          whatsapp?: string | null
        }
        Update: {
          classification?: Database["public"]["Enums"]["nps_classification"]
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
          redirected_to_google?: boolean
          score?: number
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
      get_public_company: {
        Args: { _slug: string }
        Returns: {
          google_reviews_url: string
          id: string
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
          google_redirects: number
          negative_feedbacks: number
          nps: number
          total_responses: number
        }[]
      }
      mark_nps_google_review_intent: {
        Args: { _response_id: string }
        Returns: boolean
      }
      submit_budget_request: {
        Args: {
          _company_slug: string
          _interest: Database["public"]["Enums"]["interest_type"]
          _name: string
          _nps_response_id?: string
          _nps_score?: number
          _whatsapp: string
        }
        Returns: string
      }
      submit_nps_response: {
        Args: {
          _comment?: string
          _company_slug: string
          _name?: string
          _redirected_to_google?: boolean
          _score: number
          _wants_google_review?: boolean
          _whatsapp?: string
        }
        Returns: string
      }
    }
    Enums: {
      budget_status:
        | "novo"
        | "contatado"
        | "orcamento_enviado"
        | "fechado"
        | "perdido"
      company_plan: "starter" | "pro" | "premium"
      interest_type:
        | "festa_infantil"
        | "casamento"
        | "evento_corporativo"
        | "servico_para_evento"
        | "outro"
      nps_classification: "detrator" | "neutro" | "promotor"
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
      budget_status: [
        "novo",
        "contatado",
        "orcamento_enviado",
        "fechado",
        "perdido",
      ],
      company_plan: ["starter", "pro", "premium"],
      interest_type: [
        "festa_infantil",
        "casamento",
        "evento_corporativo",
        "servico_para_evento",
        "outro",
      ],
      nps_classification: ["detrator", "neutro", "promotor"],
      response_status: ["novo", "visto", "resolvido"],
    },
  },
} as const
