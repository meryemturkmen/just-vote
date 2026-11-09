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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      comment_reactions: {
        Row: {
          anonymous: boolean
          comment_id: string
          created_at: string
          emoji: string
          id: string
          reactor_id: string
        }
        Insert: {
          anonymous?: boolean
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          reactor_id: string
        }
        Update: {
          anonymous?: boolean
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          reactor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          anonymous: boolean
          comment_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          anonymous?: boolean
          comment_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          anonymous?: boolean
          comment_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          anonymous: boolean
          author_id: string
          body: string
          choice: string
          created_at: string
          hidden: boolean
          id: string
          parent_id: string | null
          question_id: string
          tags: string[]
        }
        Insert: {
          anonymous?: boolean
          author_id: string
          body?: string
          choice?: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_id?: string | null
          question_id: string
          tags?: string[]
        }
        Update: {
          anonymous?: boolean
          author_id?: string
          body?: string
          choice?: string
          created_at?: string
          hidden?: boolean
          id?: string
          parent_id?: string | null
          question_id?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          crew_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          crew_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          crew_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          created_at: string
          emoji: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          invite_code?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crews_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          count: number
          created_at: string
          id: string
          kind: string
          question_id: string
          read: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          kind: string
          question_id: string
          read?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          kind?: string
          question_id?: string
          read?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          question_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          question_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          question_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_color: string
          avatar_emoji: string
          created_at: string
          display_name: string | null
          id: string
          interests: string[]
          onboarded: boolean
          username: string | null
        }
        Insert: {
          avatar_color?: string
          avatar_emoji?: string
          created_at?: string
          display_name?: string | null
          id: string
          interests?: string[]
          onboarded?: boolean
          username?: string | null
        }
        Update: {
          avatar_color?: string
          avatar_emoji?: string
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[]
          onboarded?: boolean
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          boosted_until: string | null
          budget: string | null
          category: string
          created_at: string
          crew_id: string | null
          decided_at: string | null
          decided_choice: string | null
          duration_hours: number
          ends_at: string | null
          hidden: boolean
          id: string
          kind: string
          occasion: string | null
          option_a_image: string
          option_a_label: string
          option_b_image: string
          option_b_label: string
          option_c_image: string | null
          option_d_image: string | null
          title: string
          user_id: string
          visibility: string
        }
        Insert: {
          boosted_until?: string | null
          budget?: string | null
          category?: string
          created_at?: string
          crew_id?: string | null
          decided_at?: string | null
          decided_choice?: string | null
          duration_hours?: number
          ends_at?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          occasion?: string | null
          option_a_image: string
          option_a_label?: string
          option_b_image: string
          option_b_label?: string
          option_c_image?: string | null
          option_d_image?: string | null
          title?: string
          user_id: string
          visibility?: string
        }
        Update: {
          boosted_until?: string | null
          budget?: string | null
          category?: string
          created_at?: string
          crew_id?: string | null
          decided_at?: string | null
          decided_choice?: string | null
          duration_hours?: number
          ends_at?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          occasion?: string | null
          option_a_image?: string
          option_a_label?: string
          option_b_image?: string
          option_b_label?: string
          option_c_image?: string | null
          option_d_image?: string | null
          title?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          anonymous: boolean
          created_at: string
          details: string | null
          id: string
          moderator_note: string | null
          question_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          anonymous?: boolean
          created_at?: string
          details?: string | null
          id?: string
          moderator_note?: string | null
          question_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          anonymous?: boolean
          created_at?: string
          details?: string | null
          id?: string
          moderator_note?: string | null
          question_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      share_events: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          kind: string
          question_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          kind: string
          question_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          kind?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_events_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vote_feedback: {
        Row: {
          anonymous: boolean
          comment: string | null
          created_at: string
          id: string
          question_id: string
          tags: string[]
          voter_id: string
        }
        Insert: {
          anonymous?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          question_id: string
          tags?: string[]
          voter_id: string
        }
        Update: {
          anonymous?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          question_id?: string
          tags?: string[]
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          anonymous: boolean
          choice: string
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          anonymous?: boolean
          choice: string
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          anonymous?: boolean
          choice?: string
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_stats: { Args: { p_days?: number }; Returns: Json }
      boost_question: { Args: { p_question: string }; Returns: string }
      create_crew: {
        Args: { p_emoji: string; p_name: string }
        Returns: string
      }
      crew_preview: {
        Args: { p_code: string }
        Returns: {
          emoji: string
          id: string
          is_member: boolean
          members: number
          name: string
        }[]
      }
      decide_question: {
        Args: { p_choice: string; p_question: string }
        Returns: undefined
      }
      feed_page: {
        Args: {
          p_category: string
          p_interests: string[]
          p_limit: number
          p_offset: number
          p_sort: string
          p_voter: string
        }
        Returns: {
          id: string
          matched: boolean
        }[]
      }
      has_profanity: { Args: { t: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_crew_member: {
        Args: { _crew: string; _user: string }
        Returns: boolean
      }
      join_crew: { Args: { p_code: string }; Returns: string }
      leaderboard: {
        Args: { p_category: string; p_scope?: string }
        Returns: {
          avatar_color: string
          avatar_emoji: string
          display_name: string
          points: number
          user_id: string
          username: string
        }[]
      }
      my_stats: {
        Args: never
        Returns: {
          points: number
          streak: number
        }[]
      }
      public_profile: {
        Args: { p_username: string }
        Returns: {
          avatar_color: string
          avatar_emoji: string
          display_name: string
          followers: number
          following: number
          i_follow: boolean
          id: string
          top_categories: string[]
          username: string
          votes: number
          week_points: number
        }[]
      }
      question_has_choice: {
        Args: { p_choice: string; p_question: string }
        Returns: boolean
      }
      reset_crew_invite: { Args: { p_crew: string }; Returns: string }
      set_comment_hidden: {
        Args: { p_comment: string; p_hidden: boolean }
        Returns: undefined
      }
      sync_ended_notifications: { Args: never; Returns: undefined }
      toggle_reaction: {
        Args: { p_comment: string; p_emoji: string; p_guest?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
