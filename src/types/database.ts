export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      verification_requests: {
        Row: {
          created_at: string
          id: string
          link_type: string
          link_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type: string
          link_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          link_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_gaps: {
        Row: {
          created_at: string
          era: string | null
          geography: string | null
          id: string
          mode: string
          query_text: string
          similarity_score: number | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          era?: string | null
          geography?: string | null
          id?: string
          mode?: string
          query_text: string
          similarity_score?: number | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          era?: string | null
          geography?: string | null
          id?: string
          mode?: string
          query_text?: string
          similarity_score?: number | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archive_gaps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          chunk_id: string | null
          created_at: string
          document_id: string
          excerpt: string | null
          id: string
          message_id: string
          position: number
          similarity_score: number | null
        }
        Insert: {
          chunk_id?: string | null
          created_at?: string
          document_id: string
          excerpt?: string | null
          id?: string
          message_id: string
          position?: number
          similarity_score?: number | null
        }
        Update: {
          chunk_id?: string | null
          created_at?: string
          document_id?: string
          excerpt?: string | null
          id?: string
          message_id?: string
          position?: number
          similarity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "citations_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contentions: {
        Row: {
          claims: Json
          created_at: string
          description: string | null
          detected_by: string | null
          document_ids: string[]
          essay_ids: string[]
          id: string
          resolution_notes: string | null
          status: string
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          claims?: Json
          created_at?: string
          description?: string | null
          detected_by?: string | null
          document_ids?: string[]
          essay_ids?: string[]
          id?: string
          resolution_notes?: string | null
          status?: string
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          claims?: Json
          created_at?: string
          description?: string | null
          detected_by?: string | null
          document_ids?: string[]
          essay_ids?: string[]
          id?: string
          resolution_notes?: string | null
          status?: string
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contentions_detected_by_fkey"
            columns: ["detected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          active_lens_id: string | null
          created_at: string
          id: string
          mode: string
          scope_document_id: string | null
          scope_topic_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_lens_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          scope_document_id?: string | null
          scope_topic_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_lens_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          scope_document_id?: string | null
          scope_topic_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_active_lens_id_fkey"
            columns: ["active_lens_id"]
            isOneToOne: false
            referencedRelation: "living_essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_scope_document_id_fkey"
            columns: ["scope_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_scope_topic_id_fkey"
            columns: ["scope_topic_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: unknown
          fts: unknown
          id: string
          page_number: number | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: unknown
          fts?: unknown
          id?: string
          page_number?: number | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: unknown
          fts?: unknown
          id?: string
          page_number?: number | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          document_id: string
          tag_id: string
        }
        Insert: {
          document_id: string
          tag_id: string
        }
        Update: {
          document_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      document_validations: {
        Row: {
          created_at: string
          decision: string
          document_id: string
          id: string
          notes: string | null
          validator_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          document_id: string
          id?: string
          notes?: string | null
          validator_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          document_id?: string
          id?: string
          notes?: string | null
          validator_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_validations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_validations_validator_id_fkey"
            columns: ["validator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          author_name: string | null
          created_at: string
          date_of_origin: string | null
          description: string | null
          document_type: string | null
          file_size_bytes: number | null
          fts: unknown
          id: string
          language: string | null
          mime_type: string | null
          origin_location: string | null
          original_filename: string | null
          page_count: number | null
          published_at: string | null
          status: string
          storage_path: string | null
          submitter_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          date_of_origin?: string | null
          description?: string | null
          document_type?: string | null
          file_size_bytes?: number | null
          fts?: unknown
          id?: string
          language?: string | null
          mime_type?: string | null
          origin_location?: string | null
          original_filename?: string | null
          page_count?: number | null
          published_at?: string | null
          status?: string
          storage_path?: string | null
          submitter_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          created_at?: string
          date_of_origin?: string | null
          description?: string | null
          document_type?: string | null
          file_size_bytes?: number | null
          fts?: unknown
          id?: string
          language?: string | null
          mime_type?: string | null
          origin_location?: string | null
          original_filename?: string | null
          page_count?: number | null
          published_at?: string | null
          status?: string
          storage_path?: string | null
          submitter_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      essay_reviews: {
        Row: {
          created_at: string
          decision: string
          essay_id: string
          id: string
          notes: string | null
          reviewer_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          essay_id: string
          id?: string
          notes?: string | null
          reviewer_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          essay_id?: string
          id?: string
          notes?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_reviews_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "living_essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "essay_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_paths: {
        Row: {
          author_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          fts: unknown
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_paths_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      living_essays: {
        Row: {
          author_id: string
          content: string
          created_at: string
          fts: unknown
          id: string
          lens_label: string | null
          published_at: string | null
          related_document_ids: string[]
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          fts?: unknown
          id?: string
          lens_label?: string | null
          published_at?: string | null
          related_document_ids?: string[]
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          fts?: unknown
          id?: string
          lens_label?: string | null
          published_at?: string | null
          related_document_ids?: string[]
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "living_essays_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          topic_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          topic_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      path_nodes: {
        Row: {
          body: string | null
          created_at: string
          document_id: string | null
          essay_id: string | null
          id: string
          node_type: string
          path_id: string
          position: number
        }
        Insert: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          essay_id?: string | null
          id?: string
          node_type: string
          path_id: string
          position: number
        }
        Update: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          essay_id?: string | null
          id?: string
          node_type?: string
          path_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "path_nodes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "path_nodes_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "living_essays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "path_nodes_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "knowledge_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          institution: string | null
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          institution?: string | null
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          institution?: string | null
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_tier: { Args: { min_tier: string }; Returns: boolean }
      tier_rank: { Args: { tier: string }; Returns: number }
      user_tier: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

