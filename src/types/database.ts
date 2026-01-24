export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      athletes: {
        Row: {
          id: string
          email: string | null
          onboarding_answers: Json | null
          motivation_metadata: Json | null
          telegram_chat_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          onboarding_answers?: Json | null
          motivation_metadata?: Json | null
          telegram_chat_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          onboarding_answers?: Json | null
          motivation_metadata?: Json | null
          telegram_chat_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          athlete_id: string | null
          version: number
          macro_plan: Json | null
          weeks: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id?: string | null
          version?: number
          macro_plan?: Json | null
          weeks?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string | null
          version?: number
          macro_plan?: Json | null
          weeks?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          plan_id: string | null
          date: string | null
          session_type: string | null
          prescribed: Json | null
          status: string
          rpe: string | null
          cue_feedback: string | null
          notes: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          plan_id?: string | null
          date?: string | null
          session_type?: string | null
          prescribed?: Json | null
          status?: string
          rpe?: string | null
          cue_feedback?: string | null
          notes?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string | null
          date?: string | null
          session_type?: string | null
          prescribed?: Json | null
          status?: string
          rpe?: string | null
          cue_feedback?: string | null
          notes?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      prompt_history: {
        Row: {
          id: string
          athlete_id: string | null
          prompt_text: string | null
          feedback_summary: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          athlete_id?: string | null
          prompt_text?: string | null
          feedback_summary?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string | null
          prompt_text?: string | null
          feedback_summary?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Athlete = Database['public']['Tables']['athletes']['Row']
export type AthleteInsert = Database['public']['Tables']['athletes']['Insert']
export type AthleteUpdate = Database['public']['Tables']['athletes']['Update']

export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionInsert = Database['public']['Tables']['sessions']['Insert']
export type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export type PromptHistory = Database['public']['Tables']['prompt_history']['Row']
export type PromptHistoryInsert = Database['public']['Tables']['prompt_history']['Insert']
export type PromptHistoryUpdate = Database['public']['Tables']['prompt_history']['Update']
