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
      abp_bonus_types: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alt_trait_replacements: {
        Row: {
          alt_trait_id: number
          created_at: string | null
          id: number
          replaced_trait_id: number
          updated_at: string | null
        }
        Insert: {
          alt_trait_id: number
          created_at?: string | null
          id?: number
          replaced_trait_id: number
          updated_at?: string | null
        }
        Update: {
          alt_trait_id?: number
          created_at?: string | null
          id?: number
          replaced_trait_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alt_trait_replacements_alt_trait_id_fkey"
            columns: ["alt_trait_id"]
            isOneToOne: false
            referencedRelation: "base_alt_ancestral_traits"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestral_trait_bonus_feats: {
        Row: {
          ancestral_trait_id: number | null
          created_at: string | null
          feat_name: string
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id?: number | null
          created_at?: string | null
          feat_name: string
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number | null
          created_at?: string | null
          feat_name?: string
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestral_trait_conditional_bonuses: {
        Row: {
          ancestral_trait_id: number
          apply_to: string
          bonus_type: string
          condition: string | null
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          value: number
        }
        Insert: {
          ancestral_trait_id: number
          apply_to: string
          bonus_type: string
          condition?: string | null
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          value: number
        }
        Update: {
          ancestral_trait_id?: number
          apply_to?: string
          bonus_type?: string
          condition?: string | null
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      ancestral_trait_natural_attacks: {
        Row: {
          ancestral_trait_id: number
          attack_count: number | null
          attack_type: string
          created_at: string | null
          damage: string
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id: number
          attack_count?: number | null
          attack_type: string
          created_at?: string | null
          damage: string
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number
          attack_count?: number | null
          attack_type?: string
          created_at?: string | null
          damage?: string
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestral_trait_skill_bonuses: {
        Row: {
          ancestral_trait_id: number
          bonus: number
          created_at: string | null
          id: number
          skill_name: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id: number
          bonus: number
          created_at?: string | null
          id?: number
          skill_name: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number
          bonus?: number
          created_at?: string | null
          id?: number
          skill_name?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestral_trait_specials: {
        Row: {
          ancestral_trait_id: number
          created_at: string | null
          id: number
          special_label: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id: number
          created_at?: string | null
          id?: number
          special_label: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number
          created_at?: string | null
          id?: number
          special_label?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestral_trait_visions: {
        Row: {
          ancestral_trait_id: number | null
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          vision_label: string
        }
        Insert: {
          ancestral_trait_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          vision_label: string
        }
        Update: {
          ancestral_trait_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          vision_label?: string
        }
        Relationships: []
      }
      ancestral_trait_weapon_proficiencies: {
        Row: {
          ancestral_trait_id: number
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          weapon_name: string
        }
        Insert: {
          ancestral_trait_id: number
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          weapon_name: string
        }
        Update: {
          ancestral_trait_id?: number
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          weapon_name?: string
        }
        Relationships: []
      }
      ancestry_ability_modifiers: {
        Row: {
          ability_name: string
          ancestry_id: number
          created_at: string | null
          id: number
          modifier: number
          updated_at: string | null
        }
        Insert: {
          ability_name: string
          ancestry_id: number
          created_at?: string | null
          id?: number
          modifier: number
          updated_at?: string | null
        }
        Update: {
          ability_name?: string
          ancestry_id?: number
          created_at?: string | null
          id?: number
          modifier?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_ability_modifiers_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "base_ancestries"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_feature_replacements: {
        Row: {
          archetype_id: number
          created_at: string | null
          id: number
          new_feature_id: number | null
          replaced_feature_id: number
          replacement_level: number | null
          updated_at: string | null
        }
        Insert: {
          archetype_id: number
          created_at?: string | null
          id?: number
          new_feature_id?: number | null
          replaced_feature_id: number
          replacement_level?: number | null
          updated_at?: string | null
        }
        Update: {
          archetype_id?: number
          created_at?: string | null
          id?: number
          new_feature_id?: number | null
          replaced_feature_id?: number
          replacement_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_feature_replacements_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_feature_replacements_new_feature_id_fkey"
            columns: ["new_feature_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_feature_replacements_replaced_feature_id_fkey"
            columns: ["replaced_feature_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_alt_ancestral_traits: {
        Row: {
          ancestry_id: number
          created_at: string | null
          description: string
          id: number
          is_optional: boolean | null
          is_pfs_legal: boolean | null
          name: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          ancestry_id: number
          created_at?: string | null
          description: string
          id?: number
          is_optional?: boolean | null
          is_pfs_legal?: boolean | null
          name: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number
          created_at?: string | null
          description?: string
          id?: number
          is_optional?: boolean | null
          is_pfs_legal?: boolean | null
          name?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      base_ancestral_traits: {
        Row: {
          ancestry_name: string | null
          created_at: string | null
          id: number
          is_optional: boolean | null
          updated_at: string | null
        }
        Insert: {
          ancestry_name?: string | null
          created_at?: string | null
          id: number
          is_optional?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ancestry_name?: string | null
          created_at?: string | null
          id?: number
          is_optional?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_ancestral_traits_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_ancestries: {
        Row: {
          base_speed: number
          created_at: string | null
          description: string | null
          id: number
          name: string
          size: string
          updated_at: string | null
        }
        Insert: {
          base_speed?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          size: string
          updated_at?: string | null
        }
        Update: {
          base_speed?: number
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          size?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      base_archetypes: {
        Row: {
          class_id: number | null
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_archetypes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "base_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_archetypes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_buff_effects: {
        Row: {
          base_buff_id: number
          created_at: string
          description: string | null
          effect_type: string
          id: number
          modifier: number | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          target: string | null
          updated_at: string
        }
        Insert: {
          base_buff_id: number
          created_at?: string
          description?: string | null
          effect_type: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string
        }
        Update: {
          base_buff_id?: number
          created_at?: string
          description?: string | null
          effect_type?: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_buffs: {
        Row: {
          buff_type_id: number | null
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          buff_type_id?: number | null
          created_at?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          buff_type_id?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_buffs_buff_type_id_fkey"
            columns: ["buff_type_id"]
            isOneToOne: false
            referencedRelation: "buff_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_buffs_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_class_feature_effects: {
        Row: {
          base_class_feature_id: number
          created_at: string | null
          description: string | null
          effect_type: string
          id: number
          modifier: number | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          target: string | null
          updated_at: string | null
        }
        Insert: {
          base_class_feature_id: number
          created_at?: string | null
          description?: string | null
          effect_type: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string | null
        }
        Update: {
          base_class_feature_id?: number
          created_at?: string | null
          description?: string | null
          effect_type?: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      base_class_feature_prerequisites: {
        Row: {
          base_class_feature_id: number
          created_at: string | null
          id: number
          prereq_type: string
          prereq_value: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          base_class_feature_id: number
          created_at?: string | null
          id?: number
          prereq_type: string
          prereq_value: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          base_class_feature_id?: number
          created_at?: string | null
          id?: number
          prereq_type?: string
          prereq_value?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      base_class_features: {
        Row: {
          class_id: number
          created_at: string | null
          feature_level: number
          id: number
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          feature_level: number
          id: number
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          feature_level?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_class_features_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "base_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_class_features_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_class_progression: {
        Row: {
          base_attack_bonus: number
          class_id: number
          created_at: string | null
          id: number
          level: number
          updated_at: string | null
        }
        Insert: {
          base_attack_bonus: number
          class_id: number
          created_at?: string | null
          id?: number
          level: number
          updated_at?: string | null
        }
        Update: {
          base_attack_bonus?: number
          class_id?: number
          created_at?: string | null
          id?: number
          level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      base_classes: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      base_corruptions: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_corruptions_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_feats: {
        Row: {
          created_at: string | null
          feat_label: string | null
          feat_type: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feat_label?: string | null
          feat_type?: string | null
          id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feat_label?: string | null
          feat_type?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_feats_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
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
          id?: number
          name: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ability?: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          name?: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      base_traits: {
        Row: {
          created_at: string | null
          id: number
          trait_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          trait_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          trait_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_traits_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_types: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      buff_types: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      character_abp_bonus_targets: {
        Row: {
          abp_bonus_id: number
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          target_key: string
          target_value: string
          updated_at: string | null
        }
        Insert: {
          abp_bonus_id: number
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target_key: string
          target_value: string
          updated_at?: string | null
        }
        Update: {
          abp_bonus_id?: number
          created_at?: string | null
          id?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target_key?: string
          target_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_abp_bonus_targets_abp_bonus_id_fkey"
            columns: ["abp_bonus_id"]
            isOneToOne: false
            referencedRelation: "character_abp_bonuses"
            referencedColumns: ["id"]
          },
        ]
      }
      character_abp_bonuses: {
        Row: {
          bonus_type_id: number | null
          character_id: number | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
          value: number
        }
        Insert: {
          bonus_type_id?: number | null
          character_id?: number | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          value: number
        }
        Update: {
          bonus_type_id?: number | null
          character_id?: number | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      character_alt_ancestral_traits: {
        Row: {
          alt_trait_id: number
          character_id: number
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          alt_trait_id: number
          character_id: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          alt_trait_id?: number
          character_id?: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_alt_ancestral_traits_alt_trait_id_fkey"
            columns: ["alt_trait_id"]
            isOneToOne: false
            referencedRelation: "base_alt_ancestral_traits"
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestral_trait_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestral_trait_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_ancestries: {
        Row: {
          ancestry_id: number | null
          character_id: number | null
          created_at: string | null
          id: number
          is_primary: boolean | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          ancestry_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number | null
          character_id?: number | null
          created_at?: string | null
          id?: never
          is_primary?: boolean | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_attributes: {
        Row: {
          cha: number
          character_id: number
          con: number
          created_at: string | null
          dex: number
          id: number
          int: number
          str: number
          updated_at: string | null
          wis: number
        }
        Insert: {
          cha?: number
          character_id: number
          con?: number
          created_at?: string | null
          dex?: number
          id?: number
          int?: number
          str?: number
          updated_at?: string | null
          wis?: number
        }
        Update: {
          cha?: number
          character_id?: number
          con?: number
          created_at?: string | null
          dex?: number
          id?: number
          int?: number
          str?: number
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
      character_bombs: {
        Row: {
          bomb_type: string
          bombs_left: number
          character_id: number | null
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          bomb_type?: string
          bombs_left?: number
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          bomb_type?: string
          bombs_left?: number
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_buffs: {
        Row: {
          base_buff_id: number | null
          character_id: number | null
          id: number
          is_active: boolean | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string
        }
        Insert: {
          base_buff_id?: number | null
          character_id?: number | null
          id?: number
          is_active?: boolean | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Update: {
          base_buff_id?: number | null
          character_id?: number | null
          id?: number
          is_active?: boolean | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      character_class_feature_properties: {
        Row: {
          class_feature_id: number
          created_at: string | null
          id: number
          property_key: string
          property_value: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          class_feature_id: number
          created_at?: string | null
          id?: number
          property_key: string
          property_value: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          class_feature_id?: number
          created_at?: string | null
          id?: number
          property_key?: string
          property_value?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_class_feature_properties_class_feature_id_fkey"
            columns: ["class_feature_id"]
            isOneToOne: false
            referencedRelation: "character_class_features"
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          character_id?: number | null
          feature_level: number
          feature_name: string
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          character_id?: number | null
          feature_level?: number
          feature_name?: string
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_consumables: {
        Row: {
          character_id: number
          consumable_type: string
          created_at: string | null
          id: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          character_id: number
          consumable_type: string
          created_at?: string | null
          id?: number
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          consumable_type?: string
          created_at?: string | null
          id?: number
          quantity?: number
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: [
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_discoveries: {
        Row: {
          character_id: number | null
          discovery_name: string
          id: number
          selected_level: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          discovery_name: string
          id?: never
          selected_level: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          discovery_name?: string
          id?: never
          selected_level?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_discovery_properties: {
        Row: {
          character_discovery_id: number
          created_at: string | null
          id: number
          property_key: string
          property_value: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          character_discovery_id: number
          created_at?: string | null
          id?: number
          property_key: string
          property_value: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          character_discovery_id?: number
          created_at?: string | null
          id?: number
          property_key?: string
          property_value?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_discovery_properties_character_discovery_id_fkey"
            columns: ["character_discovery_id"]
            isOneToOne: false
            referencedRelation: "character_discoveries"
            referencedColumns: ["id"]
          },
        ]
      }
      character_entity_choices: {
        Row: {
          character_entity_id: number
          choice_key: string
          choice_value: string
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          character_entity_id: number
          choice_key: string
          choice_value: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          character_entity_id?: number
          choice_key?: string
          choice_value?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      character_equipment: {
        Row: {
          character_id: number
          created_at: string | null
          equipped: boolean | null
          id: number
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          equipped?: boolean | null
          id?: number
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          equipped?: boolean | null
          id?: number
          name?: string
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
      character_equipment_properties: {
        Row: {
          created_at: string | null
          equipment_id: number
          id: number
          property_key: string
          property_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: number
          id?: number
          property_key: string
          property_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: number
          id?: number
          property_key?: string
          property_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_equipment_properties_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "character_equipment"
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
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
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
          used?: number
        }
        Relationships: []
      }
      character_favored_class_bonuses: {
        Row: {
          character_id: number | null
          created_at: string | null
          favored_choice_id: number | null
          id: number
          level: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          favored_choice_id?: number | null
          id?: never
          level: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          favored_choice_id?: number | null
          id?: never
          level?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      character_feat_properties: {
        Row: {
          character_feat_id: number
          created_at: string
          id: number
          property_key: string
          property_value: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string
        }
        Insert: {
          character_feat_id: number
          created_at?: string
          id?: number
          property_key: string
          property_value: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Update: {
          character_feat_id?: number
          created_at?: string
          id?: number
          property_key?: string
          property_value?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_feat_properties_character_feat_id_fkey"
            columns: ["character_feat_id"]
            isOneToOne: false
            referencedRelation: "character_feats"
            referencedColumns: ["id"]
          },
        ]
      }
      character_feats: {
        Row: {
          base_feat_id: number | null
          character_id: number | null
          id: number
          selected_level: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string
        }
        Insert: {
          base_feat_id?: number | null
          character_id?: number | null
          id?: number
          selected_level: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Update: {
          base_feat_id?: number | null
          character_id?: number | null
          id?: number
          selected_level?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      character_known_spells: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          spell_level: number
          spell_name: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          spell_level: number
          spell_name: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          spell_level?: number
          spell_name?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Relationships: []
      }
      character_rpg_entities: {
        Row: {
          character_id: number
          created_at: string | null
          entity_id: number
          id: number
          is_active: boolean | null
          selected_level: number | null
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          entity_id: number
          id?: number
          is_active?: boolean | null
          selected_level?: number | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          entity_id?: number
          id?: number
          is_active?: boolean | null
          selected_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_rpg_entities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_rpg_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      character_skill_ranks: {
        Row: {
          applied_at_level: number
          character_id: number
          created_at: string | null
          id: number
          skill_id: number
          source_id: number | null
          updated_at: string | null
        }
        Insert: {
          applied_at_level?: number
          character_id: number
          created_at?: string | null
          id?: number
          skill_id: number
          source_id?: number | null
          updated_at?: string | null
        }
        Update: {
          applied_at_level?: number
          character_id?: number
          created_at?: string | null
          id?: number
          skill_id?: number
          source_id?: number | null
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
          {
            foreignKeyName: "character_skill_ranks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "skill_rank_sources"
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
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          total: number
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          id?: never
          remaining: number
          spell_level: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total: number
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          id?: never
          remaining?: number
          spell_level?: number
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      character_traits: {
        Row: {
          character_id: number | null
          created_at: string | null
          id: number
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          trait_id: number | null
          updated_at: string | null
        }
        Insert: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          trait_id?: number | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number | null
          created_at?: string | null
          id?: never
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          trait_id?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          ancestry_name: string | null
          archetype_name: string | null
          class_name: string | null
          created_at: string | null
          current_hp: number
          id: number
          is_offline: boolean | null
          level: number
          max_hp: number
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_name?: string | null
          archetype_name?: string | null
          class_name?: string | null
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
          level?: number
          max_hp?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_name?: string | null
          archetype_name?: string | null
          class_name?: string | null
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
          level?: number
          max_hp?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      class_skill_relations: {
        Row: {
          class_id: number | null
          created_at: string | null
          id: number
          skill_id: number | null
          updated_at: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string | null
          id?: number
          skill_id?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string | null
          id?: number
          skill_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_skill_relations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "base_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_skill_relations_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "base_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      conditional_bonuses: {
        Row: {
          apply_to: string
          bonus_type_id: number
          condition: string | null
          created_at: string | null
          entity_id: number
          id: number
          updated_at: string | null
          value: number
        }
        Insert: {
          apply_to: string
          bonus_type_id: number
          condition?: string | null
          created_at?: string | null
          entity_id: number
          id?: number
          updated_at?: string | null
          value: number
        }
        Update: {
          apply_to?: string
          bonus_type_id?: number
          condition?: string | null
          created_at?: string | null
          entity_id?: number
          id?: number
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "conditional_bonuses_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditional_bonuses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_choices: {
        Row: {
          choice_key: string
          choice_value: string
          created_at: string | null
          entity_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          choice_key: string
          choice_value: string
          created_at?: string | null
          entity_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          choice_key?: string
          choice_value?: string
          created_at?: string | null
          entity_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_choices_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_prerequisites: {
        Row: {
          created_at: string | null
          entity_id: number
          id: number
          prereq_type: string | null
          prereq_value: string | null
          required_entity_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          id?: number
          prereq_type?: string | null
          prereq_value?: string | null
          required_entity_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          id?: number
          prereq_type?: string | null
          prereq_value?: string | null
          required_entity_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_prerequisites_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_prerequisites_required_entity_id_fkey"
            columns: ["required_entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      favored_class_choices: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feat_effects: {
        Row: {
          base_feat_id: number
          created_at: string
          description: string | null
          effect_type: string
          id: number
          modifier: number | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          target: string | null
          updated_at: string
        }
        Insert: {
          base_feat_id: number
          created_at?: string
          description?: string | null
          effect_type: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string
        }
        Update: {
          base_feat_id?: number
          created_at?: string
          description?: string | null
          effect_type?: string
          id?: number
          modifier?: number | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          target?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feat_prerequisites: {
        Row: {
          base_feat_id: number
          created_at: string
          id: number
          prereq_type: string
          prereq_value: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string
        }
        Insert: {
          base_feat_id: number
          created_at?: string
          id?: number
          prereq_type: string
          prereq_value: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Update: {
          base_feat_id?: number
          created_at?: string
          id?: number
          prereq_type?: string
          prereq_value?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      natural_attacks: {
        Row: {
          attack_count: number | null
          attack_type: string
          created_at: string | null
          damage: string
          entity_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          attack_count?: number | null
          attack_type: string
          created_at?: string | null
          damage: string
          entity_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          attack_count?: number | null
          attack_type?: string
          created_at?: string | null
          damage?: string
          entity_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "natural_attacks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      rpg_entities: {
        Row: {
          created_at: string | null
          description: string | null
          entity_type: string
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_type: string
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_type?: string
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_bonuses: {
        Row: {
          bonus: number
          created_at: string | null
          entity_id: number
          id: number
          skill_name: string
          updated_at: string | null
        }
        Insert: {
          bonus: number
          created_at?: string | null
          entity_id: number
          id?: number
          skill_name: string
          updated_at?: string | null
        }
        Update: {
          bonus?: number
          created_at?: string | null
          entity_id?: number
          id?: number
          skill_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_bonuses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_rank_sources: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trait_skill_replacements: {
        Row: {
          created_at: string | null
          from_ability: string
          id: number
          skill_name: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          to_ability: string
          trait_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_ability: string
          id?: number
          skill_name: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          to_ability: string
          trait_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_ability?: string
          id?: number
          skill_name?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          to_ability?: string
          trait_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      weapon_proficiencies: {
        Row: {
          created_at: string | null
          entity_id: number
          id: number
          updated_at: string | null
          weapon_name: string
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          id?: number
          updated_at?: string | null
          weapon_name: string
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          id?: number
          updated_at?: string | null
          weapon_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "weapon_proficiencies_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
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
      sync_status: "synced" | "pending" | "conflict"
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
