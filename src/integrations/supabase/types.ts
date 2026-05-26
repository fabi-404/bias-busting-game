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
      bias_guesses: {
        Row: {
          created_at: string
          guessed_bias_id: string
          guesser_player_id: string
          id: string
          is_correct: boolean
          round_number: number
          session_id: string
          target_player_id: string
        }
        Insert: {
          created_at?: string
          guessed_bias_id: string
          guesser_player_id: string
          id?: string
          is_correct?: boolean
          round_number: number
          session_id: string
          target_player_id: string
        }
        Update: {
          created_at?: string
          guessed_bias_id?: string
          guesser_player_id?: string
          id?: string
          is_correct?: boolean
          round_number?: number
          session_id?: string
          target_player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_guesses_guessed_bias_id_fkey"
            columns: ["guessed_bias_id"]
            isOneToOne: false
            referencedRelation: "biases"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_question_answers: {
        Row: {
          answer: boolean
          created_at: string
          id: string
          is_correct: boolean
          player_id: string
          question_id: string
          session_id: string
        }
        Insert: {
          answer: boolean
          created_at?: string
          id?: string
          is_correct: boolean
          player_id: string
          question_id: string
          session_id: string
        }
        Update: {
          answer?: boolean
          created_at?: string
          id?: string
          is_correct?: boolean
          player_id?: string
          question_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "bias_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_questions: {
        Row: {
          bias_id: string
          correct_answer: boolean
          created_at: string
          explanation: string
          id: string
          position: number
          question: string
        }
        Insert: {
          bias_id: string
          correct_answer: boolean
          created_at?: string
          explanation: string
          id?: string
          position?: number
          question: string
        }
        Update: {
          bias_id?: string
          correct_answer?: boolean
          created_at?: string
          explanation?: string
          id?: string
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "bias_questions_bias_id_fkey"
            columns: ["bias_id"]
            isOneToOne: false
            referencedRelation: "biases"
            referencedColumns: ["id"]
          },
        ]
      }
      biases: {
        Row: {
          color: string
          created_at: string
          example: string | null
          id: string
          knowledge_card_text: string
          name: string
          self_recognition: string | null
          short_description: string
          slug: string
          source_label: string | null
          source_url: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          example?: string | null
          id?: string
          knowledge_card_text: string
          name: string
          self_recognition?: string | null
          short_description: string
          slug: string
          source_label?: string | null
          source_url?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          example?: string | null
          id?: string
          knowledge_card_text?: string
          name?: string
          self_recognition?: string | null
          short_description?: string
          slug?: string
          source_label?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      candidate_prevotes: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          player_id: string
          rating: number
          round_number: number
          session_id: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          player_id: string
          rating: number
          round_number: number
          session_id: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          player_id?: string
          rating?: number
          round_number?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidate_votes: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          player_id: string
          round_number: number
          session_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          player_id: string
          round_number: number
          session_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          player_id?: string
          round_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          age: number | null
          appeals_to_bias_id: string | null
          created_at: string
          description: string
          headline: string
          id: string
          image_url: string | null
          name: string
          position: number
          pronouns: string | null
          qualifications: string
          round_number: number
        }
        Insert: {
          age?: number | null
          appeals_to_bias_id?: string | null
          created_at?: string
          description: string
          headline: string
          id?: string
          image_url?: string | null
          name: string
          position?: number
          pronouns?: string | null
          qualifications: string
          round_number: number
        }
        Update: {
          age?: number | null
          appeals_to_bias_id?: string | null
          created_at?: string
          description?: string
          headline?: string
          id?: string
          image_url?: string | null
          name?: string
          position?: number
          pronouns?: string | null
          qualifications?: string
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidates_appeals_to_bias_id_fkey"
            columns: ["appeals_to_bias_id"]
            isOneToOne: false
            referencedRelation: "biases"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          category: string | null
          content: string
          correct_answer: boolean | null
          created_at: string
          example: string | null
          explanation: string | null
          id: string
          title: string
          type: Database["public"]["Enums"]["card_type"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          correct_answer?: boolean | null
          created_at?: string
          example?: string | null
          explanation?: string | null
          id?: string
          title: string
          type: Database["public"]["Enums"]["card_type"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          correct_answer?: boolean | null
          created_at?: string
          example?: string | null
          explanation?: string | null
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["card_type"]
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          phase: string
          player_id: string
          player_name: string
          round_number: number
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          phase: string
          player_id: string
          player_name: string
          round_number?: number
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          phase?: string
          player_id?: string
          player_name?: string
          round_number?: number
          session_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          action_card_started_at: string | null
          code: string
          created_at: string
          current_action_card_id: string | null
          current_candidate_index: number
          current_card_id: string | null
          current_question_index: number
          current_round: number
          host_name: string
          host_token: string
          id: string
          phase: Database["public"]["Enums"]["game_phase"]
          phase_started_at: string | null
          revealed: boolean
          round_number: number
          selected_candidate_ids: string[] | null
          status: Database["public"]["Enums"]["session_status"]
          total_rounds: number
          updated_at: string
        }
        Insert: {
          action_card_started_at?: string | null
          code: string
          created_at?: string
          current_action_card_id?: string | null
          current_candidate_index?: number
          current_card_id?: string | null
          current_question_index?: number
          current_round?: number
          host_name: string
          host_token?: string
          id?: string
          phase?: Database["public"]["Enums"]["game_phase"]
          phase_started_at?: string | null
          revealed?: boolean
          round_number?: number
          selected_candidate_ids?: string[] | null
          status?: Database["public"]["Enums"]["session_status"]
          total_rounds?: number
          updated_at?: string
        }
        Update: {
          action_card_started_at?: string | null
          code?: string
          created_at?: string
          current_action_card_id?: string | null
          current_candidate_index?: number
          current_card_id?: string | null
          current_question_index?: number
          current_round?: number
          host_name?: string
          host_token?: string
          id?: string
          phase?: Database["public"]["Enums"]["game_phase"]
          phase_started_at?: string | null
          revealed?: boolean
          round_number?: number
          selected_candidate_ids?: string[] | null
          status?: Database["public"]["Enums"]["session_status"]
          total_rounds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_current_card_id_fkey"
            columns: ["current_card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      player_bias_assignments: {
        Row: {
          bias_id: string
          created_at: string
          id: string
          player_id: string
          session_id: string
        }
        Insert: {
          bias_id: string
          created_at?: string
          id?: string
          player_id: string
          session_id: string
        }
        Update: {
          bias_id?: string
          created_at?: string
          id?: string
          player_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_bias_assignments_bias_id_fkey"
            columns: ["bias_id"]
            isOneToOne: false
            referencedRelation: "biases"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_journals: {
        Row: {
          content: string
          created_at: string
          id: string
          player_id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          player_id: string
          session_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          player_id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_card_history: {
        Row: {
          card_id: string
          drawn_at: string
          id: string
          round_number: number
          session_id: string
        }
        Insert: {
          card_id: string
          drawn_at?: string
          id?: string
          round_number: number
          session_id: string
        }
        Update: {
          card_id?: string
          drawn_at?: string
          id?: string
          round_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_card_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_card_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_phase_ready: {
        Row: {
          created_at: string
          id: string
          phase_key: string
          player_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phase_key: string
          player_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phase_key?: string
          player_id?: string
          session_id?: string
        }
        Relationships: []
      }
      session_players: {
        Row: {
          id: string
          is_host: boolean
          joined_at: string
          name: string
          player_token: string
          score: number
          session_id: string
        }
        Insert: {
          id?: string
          is_host?: boolean
          joined_at?: string
          name: string
          player_token?: string
          score?: number
          session_id: string
        }
        Update: {
          id?: string
          is_host?: boolean
          joined_at?: string
          name?: string
          player_token?: string
          score?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_votes: {
        Row: {
          card_id: string
          created_at: string
          id: string
          player_id: string
          round_number: number
          session_id: string
          vote: boolean
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          player_id: string
          round_number: number
          session_id: string
          vote: boolean
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          player_id?: string
          round_number?: number
          session_id?: string
          vote?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "session_votes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_votes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "session_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_votes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      card_type: "knowledge" | "truefalse" | "action"
      game_phase:
        | "lobby"
        | "phase1_knowledge"
        | "phase2_questions"
        | "phase3_candidates"
        | "phase4_hire_vote"
        | "phase5_bias_guess"
        | "round_results"
        | "final_results"
      session_status: "lobby" | "playing" | "ended"
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
      card_type: ["knowledge", "truefalse", "action"],
      game_phase: [
        "lobby",
        "phase1_knowledge",
        "phase2_questions",
        "phase3_candidates",
        "phase4_hire_vote",
        "phase5_bias_guess",
        "round_results",
        "final_results",
      ],
      session_status: ["lobby", "playing", "ended"],
    },
  },
} as const
