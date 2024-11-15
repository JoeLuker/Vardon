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
      base_skills: {
        Row: {
          ability: string
          armor_check_penalty: boolean | null
          created_at: string | null
          id: number
          name: string
          trained_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          ability: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: never
          name: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ability?: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: never
          name?: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_abp_bonuses: {
        Row: {
          bonus_type: string
          character_id: number | null
          id: number
          sync_status: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          bonus_type: string
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          bonus_type?: string
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_abp_bonuses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
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
      character_class_features: {
        Row: {
          active: boolean | null
          character_id: number | null
          feature_level: number
          feature_name: string
          id: number
          properties: Json | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          character_id?: number | null
          feature_level: number
          feature_name: string
          id?: never
          properties?: Json | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          character_id?: number | null
          feature_level?: number
          feature_name?: string
          id?: never
          properties?: Json | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_class_features_character_id_fkey"
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
      character_corruption_manifestations: {
        Row: {
          character_id: number | null
          corruption_id: number | null
          created_at: string | null
          gift_active: boolean | null
          id: number
          manifestation_name: string
          min_manifestation_level: number | null
          prerequisite_manifestation: string | null
          stain_active: boolean | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          corruption_id?: number | null
          created_at?: string | null
          gift_active?: boolean | null
          id?: never
          manifestation_name: string
          min_manifestation_level?: number | null
          prerequisite_manifestation?: string | null
          stain_active?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          corruption_id?: number | null
          created_at?: string | null
          gift_active?: boolean | null
          id?: never
          manifestation_name?: string
          min_manifestation_level?: number | null
          prerequisite_manifestation?: string | null
          stain_active?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_corruption_manifestations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_corruption_manifestations_corruption_id_fkey"
            columns: ["corruption_id"]
            isOneToOne: false
            referencedRelation: "character_corruptions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_corruptions: {
        Row: {
          blood_consumed: number | null
          blood_required: number | null
          character_id: number | null
          corruption_stage: number | null
          corruption_type: string
          created_at: string | null
          id: number
          last_feed_date: string | null
          manifestation_level: number | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          blood_consumed?: number | null
          blood_required?: number | null
          character_id?: number | null
          corruption_stage?: number | null
          corruption_type: string
          created_at?: string | null
          id?: never
          last_feed_date?: string | null
          manifestation_level?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          blood_consumed?: number | null
          blood_required?: number | null
          character_id?: number | null
          corruption_stage?: number | null
          corruption_type?: string
          created_at?: string | null
          id?: never
          last_feed_date?: string | null
          manifestation_level?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_corruptions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_discoveries: {
        Row: {
          character_id: number | null
          discovery_name: string
          id: number
          properties: Json | null
          selected_level: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          discovery_name: string
          id?: never
          properties?: Json | null
          selected_level: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          discovery_name?: string
          id?: never
          properties?: Json | null
          selected_level?: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_discoveries_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_equipment: {
        Row: {
          character_id: number | null
          equipped: boolean | null
          id: number
          name: string
          properties: Json | null
          sync_status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          equipped?: boolean | null
          id?: never
          name: string
          properties?: Json | null
          sync_status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          equipped?: boolean | null
          id?: never
          name?: string
          properties?: Json | null
          sync_status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_equipment_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_extracts: {
        Row: {
          character_id: number | null
          created_at: string | null
          extract_level: number
          extract_name: string
          id: number
          prepared: number
          sync_status: string | null
          updated_at: string | null
          used: number
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          extract_level: number
          extract_name: string
          id?: never
          prepared?: number
          sync_status?: string | null
          updated_at?: string | null
          used?: number
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          extract_level?: number
          extract_name?: string
          id?: never
          prepared?: number
          sync_status?: string | null
          updated_at?: string | null
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_extracts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_favored_class_bonuses: {
        Row: {
          character_id: number | null
          choice: string
          created_at: string | null
          id: number
          level: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          choice: string
          created_at?: string | null
          id?: never
          level: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          choice?: string
          created_at?: string | null
          id?: never
          level?: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_favored_class_bonuses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_feats: {
        Row: {
          character_id: number | null
          feat_name: string
          feat_type: string
          id: number
          properties: Json | null
          selected_level: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          feat_name: string
          feat_type: string
          id?: never
          properties?: Json | null
          selected_level: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          feat_name?: string
          feat_type?: string
          id?: never
          properties?: Json | null
          selected_level?: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_feats_character_id_fkey"
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
      character_skill_ranks: {
        Row: {
          applied_at_level: number
          character_id: number | null
          created_at: string | null
          id: number
          ranks: number
          skill_id: number | null
          source: string
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          applied_at_level: number
          character_id?: number | null
          created_at?: string | null
          id?: never
          ranks?: number
          skill_id?: number | null
          source: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_at_level?: number
          character_id?: number | null
          created_at?: string | null
          id?: never
          ranks?: number
          skill_id?: number | null
          source?: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_skill_ranks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_skill_ranks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "base_skills"
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
          max_hp: number
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
          max_hp: number
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
          max_hp?: number
          name?: string
          race?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      class_skill_relations: {
        Row: {
          class_name: string
          created_at: string | null
          id: number
          skill_id: number | null
          updated_at: string | null
        }
        Insert: {
          class_name: string
          created_at?: string | null
          id?: never
          skill_id?: number | null
          updated_at?: string | null
        }
        Update: {
          class_name?: string
          created_at?: string | null
          id?: never
          skill_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_skill_relations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "base_skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      distribute_skill_ranks: {
        Args: {
          p_character_id: number
          p_progressions: Database["public"]["CompositeTypes"]["skill_progression"][]
        }
        Returns: undefined
      }
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
      skill_progression: {
        skill_name: string | null
        ranks_per_level: number[] | null
      }
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
