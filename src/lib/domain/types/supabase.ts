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
      base_ancestral_traits: {
        Row: {
          ancestry_id: number | null
          benefits: Json | null
          created_at: string | null
          description: string
          id: number
          is_optional: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_id?: number | null
          benefits?: Json | null
          created_at?: string | null
          description: string
          id?: never
          is_optional?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number | null
          benefits?: Json | null
          created_at?: string | null
          description?: string
          id?: never
          is_optional?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_ancestral_traits_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "base_ancestries"
            referencedColumns: ["id"]
          },
        ]
      }
      base_ancestries: {
        Row: {
          ability_modifiers: Json
          base_speed: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          size: string
          updated_at: string | null
        }
        Insert: {
          ability_modifiers: Json
          base_speed: number
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          size: string
          updated_at?: string | null
        }
        Update: {
          ability_modifiers?: Json
          base_speed?: number
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          size?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      base_buffs: {
        Row: {
          buff_type: string | null
          created_at: string
          description: string | null
          effects: Json
          id: number
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          buff_type?: string | null
          created_at?: string
          description?: string | null
          effects?: Json
          id?: number
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          buff_type?: string | null
          created_at?: string
          description?: string | null
          effects?: Json
          id?: number
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      base_feats: {
        Row: {
          created_at: string
          description: string | null
          effects: Json
          feat_type: string
          id: number
          label: string
          name: string
          prerequisites: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effects?: Json
          feat_type: string
          id?: number
          label: string
          name: string
          prerequisites?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effects?: Json
          feat_type?: string
          id?: number
          label?: string
          name?: string
          prerequisites?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      base_races: {
        Row: {
          ability_modifiers: Json
          base_speed: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          size: string
          updated_at: string | null
        }
        Insert: {
          ability_modifiers: Json
          base_speed: number
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          size: string
          updated_at?: string | null
        }
        Update: {
          ability_modifiers?: Json
          base_speed?: number
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          size?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      base_racial_traits: {
        Row: {
          benefits: Json | null
          created_at: string | null
          description: string
          id: number
          is_optional: boolean | null
          name: string
          race_id: number | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          description: string
          id?: never
          is_optional?: boolean | null
          name: string
          race_id?: number | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          description?: string
          id?: never
          is_optional?: boolean | null
          name?: string
          race_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_racial_traits_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "base_races"
            referencedColumns: ["id"]
          },
        ]
      }
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
      base_traits: {
        Row: {
          benefits: Json | null
          created_at: string | null
          description: string
          id: number
          name: string
          trait_type: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          description: string
          id?: never
          name: string
          trait_type: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          description?: string
          id?: never
          name?: string
          trait_type?: string
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
          value_target: string | null
        }
        Insert: {
          bonus_type: string
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
          value: number
          value_target?: string | null
        }
        Update: {
          bonus_type?: string
          character_id?: number | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
          value?: number
          value_target?: string | null
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
      character_ancestral_traits: {
        Row: {
          ancestral_trait_id: number | null
          character_id: number | null
          created_at: string | null
          id: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_ancestral_traits_ancestral_trait_id_fkey"
            columns: ["ancestral_trait_id"]
            isOneToOne: false
            referencedRelation: "base_ancestral_traits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ancestral_traits_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_ancestries: {
        Row: {
          ancestry_id: number | null
          character_id: number | null
          created_at: string | null
          id: number
          is_primary: boolean | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          ancestry_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_ancestries_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "base_ancestries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_ancestries_character_id_fkey"
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
          base_buff_id: number | null
          character_id: number | null
          id: number
          is_active: boolean | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          base_buff_id?: number | null
          character_id?: number | null
          id?: number
          is_active?: boolean | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          base_buff_id?: number | null
          character_id?: number | null
          id?: number
          is_active?: boolean | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_buffs_base_buff_id_fkey"
            columns: ["base_buff_id"]
            isOneToOne: false
            referencedRelation: "base_buffs"
            referencedColumns: ["id"]
          },
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
          base_feat_id: number | null
          character_id: number | null
          id: number
          properties: Json | null
          selected_level: number
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          base_feat_id?: number | null
          character_id?: number | null
          id?: number
          properties?: Json | null
          selected_level: number
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          base_feat_id?: number | null
          character_id?: number | null
          id?: number
          properties?: Json | null
          selected_level?: number
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_feats_base_feat_id_fkey"
            columns: ["base_feat_id"]
            isOneToOne: false
            referencedRelation: "base_feats"
            referencedColumns: ["id"]
          },
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
      character_races: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          is_primary: boolean | null
          race_id: number | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          race_id?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          race_id?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_races_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "base_races"
            referencedColumns: ["id"]
          },
        ]
      }
      character_racial_traits: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          racial_trait_id: number | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          racial_trait_id?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          racial_trait_id?: number | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_racial_traits_racial_trait_id_fkey"
            columns: ["racial_trait_id"]
            isOneToOne: false
            referencedRelation: "base_racial_traits"
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
          source: Database["public"]["Enums"]["skill_rank_source"]
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
          source: Database["public"]["Enums"]["skill_rank_source"]
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
          source?: Database["public"]["Enums"]["skill_rank_source"]
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
      character_traits: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          sync_status: string | null
          trait_id: number | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: string | null
          trait_id?: number | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: string | null
          trait_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_traits_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "base_traits"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          ancestry: string
          archetype: string | null
          class: string
          created_at: string | null
          current_hp: number
          id: number
          is_offline: boolean | null
          last_synced_at: string | null
          level: number
          max_hp: number
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ancestry: string
          archetype?: string | null
          class: string
          created_at?: string | null
          current_hp: number
          id?: never
          is_offline?: boolean | null
          last_synced_at?: string | null
          level: number
          max_hp: number
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ancestry?: string
          archetype?: string | null
          class?: string
          created_at?: string | null
          current_hp?: number
          id?: never
          is_offline?: boolean | null
          last_synced_at?: string | null
          level?: number
          max_hp?: number
          name?: string
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
      skill_rank_source: "class" | "favored_class" | "intelligence" | "other"
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
