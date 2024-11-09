export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      character_attributes: {
        Row: {
          cha: number
          character_id: number | null
          con: number
          created_at: string | null
          dex: number
          id: number
          int: number
          is_temporary: boolean | null
          str: number
          sync_status: string | null
          wis: number
        }
        Insert: {
          cha: number
          character_id?: number | null
          con: number
          created_at?: string | null
          dex: number
          id?: never
          int: number
          is_temporary?: boolean | null
          str: number
          sync_status?: string | null
          wis: number
        }
        Update: {
          cha?: number
          character_id?: number | null
          con?: number
          created_at?: string | null
          dex?: number
          id?: never
          int?: number
          is_temporary?: boolean | null
          str?: number
          sync_status?: string | null
          wis?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_attributes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_buffs: {
        Row: {
          buff_type: string
          character_id: number | null
          id: number
          is_active: boolean | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          buff_type: string
          character_id?: number | null
          id?: never
          is_active?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          buff_type?: string
          character_id?: number | null
          id?: never
          is_active?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_buffs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_combat_stats: {
        Row: {
          base_attack_bonus: number
          bombs_left: number
          character_id: number | null
          id: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          base_attack_bonus?: number
          bombs_left?: number
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_attack_bonus?: number
          bombs_left?: number
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_combat_stats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_consumables: {
        Row: {
          acid: number
          alchemist_fire: number
          character_id: number | null
          id: number
          sync_status: string | null
          tanglefoot: number
          updated_at: string | null
        }
        Insert: {
          acid?: number
          alchemist_fire?: number
          character_id?: number | null
          id?: never
          sync_status?: string | null
          tanglefoot?: number
          updated_at?: string | null
        }
        Update: {
          acid?: number
          alchemist_fire?: number
          character_id?: number | null
          id?: never
          sync_status?: string | null
          tanglefoot?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_consumables_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_known_spells: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          spell_level: number
          spell_name: string
          sync_status: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          spell_level: number
          spell_name: string
          sync_status?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          spell_level?: number
          spell_name?: string
          sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_known_spells_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skills: {
        Row: {
          ability: string
          character_id: number | null
          class_skill: boolean | null
          id: number
          ranks: number
          skill_name: string
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          ability: string
          character_id?: number | null
          class_skill?: boolean | null
          id?: never
          ranks?: number
          skill_name: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          ability?: string
          character_id?: number | null
          class_skill?: boolean | null
          id?: never
          ranks?: number
          skill_name?: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_skills_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_spell_slots: {
        Row: {
          character_id: number | null
          id: number
          remaining: number
          spell_level: number
          sync_status: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          id?: never
          remaining: number
          spell_level: number
          sync_status?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          id?: never
          remaining?: number
          spell_level?: number
          sync_status?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_spell_slots_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          class: string
          created_at: string | null
          current_hp: number
          id: number
          is_offline: boolean | null
          last_synced_at: string | null
          level: number
          name: string
          race: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          class: string
          created_at?: string | null
          current_hp: number
          id?: never
          is_offline?: boolean | null
          last_synced_at?: string | null
          level: number
          name: string
          race: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          class?: string
          created_at?: string | null
          current_hp?: number
          id?: never
          is_offline?: boolean | null
          last_synced_at?: string | null
          level?: number
          name?: string
          race?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      uuid_generate_v1: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v1mc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v3: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_generate_v4: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_generate_v5: {
        Args: {
          namespace: string
          name: string
        }
        Returns: string
      }
      uuid_nil: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_dns: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_oid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_url: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uuid_ns_x500: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never