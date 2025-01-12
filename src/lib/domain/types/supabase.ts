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
      ancestral_trait: {
        Row: {
          ancestry_id: number | null
          created_at: string | null
          id: number
          is_optional: boolean | null
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_id?: number | null
          created_at?: string | null
          id?: number
          is_optional?: boolean | null
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number | null
          created_at?: string | null
          id?: number
          is_optional?: boolean | null
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestral_trait_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestry"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestry: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          size: string
          speed: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          size?: string
          speed?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          size?: string
          speed?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestry_attribute: {
        Row: {
          ancestry_id: number
          attribute_id: number
          created_at: string | null
          id: number
          label: string | null
          modifier: number
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_id: number
          attribute_id: number
          created_at?: string | null
          id?: number
          label?: string | null
          modifier: number
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number
          attribute_id?: number
          created_at?: string | null
          id?: number
          label?: string | null
          modifier?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_attribute_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ancestry_attribute_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "ref_attribute"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype: {
        Row: {
          class_id: number | null
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_class_feature: {
        Row: {
          archetype_id: number
          class_id: number
          created_at: string | null
          feature_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          archetype_id: number
          class_id: number
          created_at?: string | null
          feature_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          archetype_id?: number
          class_id?: number
          created_at?: string | null
          feature_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_class_feature_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetype"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_class_feature_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_class_feature_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_feature_replacement: {
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
            foreignKeyName: "archetype_feature_replacement_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetype"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_feature_replacement_new_feature_id_fkey"
            columns: ["new_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_feature_replacement_replaced_feature_id_fkey"
            columns: ["replaced_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
        ]
      }
      armor: {
        Row: {
          arcane_spell_failure_chance: number | null
          armor_bonus: number
          armor_check_penalty: number | null
          armor_type: string
          created_at: string | null
          id: number
          label: string | null
          max_dex: number | null
          name: string
          price: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          arcane_spell_failure_chance?: number | null
          armor_bonus: number
          armor_check_penalty?: number | null
          armor_type: string
          created_at?: string | null
          id?: number
          label?: string | null
          max_dex?: number | null
          name: string
          price?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          arcane_spell_failure_chance?: number | null
          armor_bonus?: number
          armor_check_penalty?: number | null
          armor_type?: string
          created_at?: string | null
          id?: number
          label?: string | null
          max_dex?: number | null
          name?: string
          price?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      attribute: {
        Row: {
          attribute_type: string | null
          created_at: string | null
          default_value: number | null
          id: number
          is_core_attribute: boolean | null
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          attribute_type?: string | null
          created_at?: string | null
          default_value?: number | null
          id?: number
          is_core_attribute?: boolean | null
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          attribute_type?: string | null
          created_at?: string | null
          default_value?: number | null
          id?: number
          is_core_attribute?: boolean | null
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      buff: {
        Row: {
          buff_type_id: number | null
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          buff_type_id?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          buff_type_id?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buff_buff_type_id_fkey"
            columns: ["buff_type_id"]
            isOneToOne: false
            referencedRelation: "ref_buff_type"
            referencedColumns: ["id"]
          },
        ]
      }
      class: {
        Row: {
          created_at: string | null
          description: string | null
          fortitude: string | null
          hit_die: number | null
          id: number
          label: string | null
          name: string
          reflex: string | null
          skill_ranks_per_level: number | null
          updated_at: string | null
          will: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fortitude?: string | null
          hit_die?: number | null
          id?: number
          label?: string | null
          name: string
          reflex?: string | null
          skill_ranks_per_level?: number | null
          updated_at?: string | null
          will?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fortitude?: string | null
          hit_die?: number | null
          id?: number
          label?: string | null
          name?: string
          reflex?: string | null
          skill_ranks_per_level?: number | null
          updated_at?: string | null
          will?: string | null
        }
        Relationships: []
      }
      class_feature: {
        Row: {
          class_id: number
          created_at: string | null
          feature_level: number
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          feature_level: number
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          feature_level?: number
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_feature_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
        ]
      }
      class_skill: {
        Row: {
          class_id: number
          created_at: string | null
          id: number
          skill_id: number
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          id?: number
          skill_id: number
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          id?: number
          skill_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_skill_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_skill_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
        ]
      }
      consumable: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      corruption: {
        Row: {
          corruption_stage: number | null
          created_at: string | null
          id: number
          label: string | null
          manifestation_level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          corruption_stage?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          manifestation_level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          corruption_stage?: number | null
          created_at?: string | null
          id?: number
          label?: string | null
          manifestation_level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      corruption_manifestation: {
        Row: {
          corruption_id: number
          created_at: string | null
          id: number
          label: string | null
          min_manifestation_level: number
          name: string
          prerequisite_manifestation: string | null
          updated_at: string | null
        }
        Insert: {
          corruption_id: number
          created_at?: string | null
          id?: number
          label?: string | null
          min_manifestation_level?: number
          name: string
          prerequisite_manifestation?: string | null
          updated_at?: string | null
        }
        Update: {
          corruption_id?: number
          created_at?: string | null
          id?: number
          label?: string | null
          min_manifestation_level?: number
          name?: string
          prerequisite_manifestation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corruption_manifestation_corruption_id_fkey"
            columns: ["corruption_id"]
            isOneToOne: false
            referencedRelation: "corruption"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery: {
        Row: {
          created_at: string | null
          discovery_level: number | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovery_level?: number | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovery_level?: number | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          bonus: number | null
          bonus_type_id: number | null
          cost: number | null
          created_at: string | null
          equipment_category: string | null
          equippable: boolean | null
          id: number
          label: string | null
          name: string
          slot: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          bonus?: number | null
          bonus_type_id?: number | null
          cost?: number | null
          created_at?: string | null
          equipment_category?: string | null
          equippable?: boolean | null
          id?: number
          label?: string | null
          name: string
          slot?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          bonus?: number | null
          bonus_type_id?: number | null
          cost?: number | null
          created_at?: string | null
          equipment_category?: string | null
          equippable?: boolean | null
          id?: number
          label?: string | null
          name?: string
          slot?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "ref_bonus_type"
            referencedColumns: ["id"]
          },
        ]
      }
      feat: {
        Row: {
          created_at: string | null
          feat_label: string | null
          feat_type: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feat_label?: string | null
          feat_type?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feat_label?: string | null
          feat_type?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      game_character: {
        Row: {
          created_at: string | null
          current_hp: number
          id: number
          is_offline: boolean | null
          label: string | null
          max_hp: number
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
          label?: string | null
          max_hp?: number
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
          label?: string | null
          max_hp?: number
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_character_abp_choice: {
        Row: {
          created_at: string | null
          game_character_id: number
          group_id: number
          id: number
          node_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_character_id: number
          group_id: number
          id?: number
          node_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_character_id?: number
          group_id?: number
          id?: number
          node_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_abp_choice_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_abp_choice_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ref_abp_node_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_abp_choice_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "ref_abp_node"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_ancestry: {
        Row: {
          ancestry_id: number
          created_at: string | null
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          ancestry_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_ancestry_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_ancestry_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_archetype: {
        Row: {
          archetype_id: number
          created_at: string | null
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          archetype_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          archetype_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_archetype_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "archetype"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_archetype_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_armor: {
        Row: {
          armor_id: number
          created_at: string | null
          equipped: boolean
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          armor_id: number
          created_at?: string | null
          equipped?: boolean
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          armor_id?: number
          created_at?: string | null
          equipped?: boolean
          game_character_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_armor_armor_id_fkey"
            columns: ["armor_id"]
            isOneToOne: false
            referencedRelation: "armor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_armor_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_attribute: {
        Row: {
          attribute_id: number
          created_at: string | null
          game_character_id: number
          id: number
          updated_at: string | null
          value: number
        }
        Insert: {
          attribute_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
          value: number
        }
        Update: {
          attribute_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_attribute_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attribute"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_attribute_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_class: {
        Row: {
          class_id: number
          created_at: string | null
          game_character_id: number
          id: number
          level: number
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          level: number
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_class_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_class_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_class_feature: {
        Row: {
          class_feature_id: number
          created_at: string | null
          game_character_id: number
          id: number
          level_obtained: number
          updated_at: string | null
        }
        Insert: {
          class_feature_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          level_obtained: number
          updated_at?: string | null
        }
        Update: {
          class_feature_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          level_obtained?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_class_feature_class_feature_id_fkey"
            columns: ["class_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_class_feature_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_consumable: {
        Row: {
          consumable_id: number
          created_at: string | null
          game_character_id: number
          id: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          consumable_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          consumable_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_consumable_consumable_id_fkey"
            columns: ["consumable_id"]
            isOneToOne: false
            referencedRelation: "consumable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_consumable_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_corruption: {
        Row: {
          blood_consumed: number
          blood_required: number
          corruption_id: number
          corruption_stage: number
          created_at: string | null
          game_character_id: number
          id: number
          manifestation_level: number
          updated_at: string | null
        }
        Insert: {
          blood_consumed?: number
          blood_required?: number
          corruption_id: number
          corruption_stage?: number
          created_at?: string | null
          game_character_id: number
          id?: number
          manifestation_level?: number
          updated_at?: string | null
        }
        Update: {
          blood_consumed?: number
          blood_required?: number
          corruption_id?: number
          corruption_stage?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          manifestation_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_corruption_corruption_id_fkey"
            columns: ["corruption_id"]
            isOneToOne: false
            referencedRelation: "corruption"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_corruption_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_corruption_manifestation: {
        Row: {
          active: boolean
          created_at: string | null
          game_character_id: number
          id: number
          manifestation_id: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          game_character_id: number
          id?: number
          manifestation_id: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string | null
          game_character_id?: number
          id?: number
          manifestation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_corruption_manifestation_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_corruption_manifestation_manifestation_id_fkey"
            columns: ["manifestation_id"]
            isOneToOne: false
            referencedRelation: "corruption_manifestation"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_equipment: {
        Row: {
          created_at: string | null
          equipment_id: number
          equipped: boolean
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: number
          equipped?: boolean
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: number
          equipped?: boolean
          game_character_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_equipment_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_extract: {
        Row: {
          created_at: string | null
          game_character_id: number
          id: number
          level: number
          prepared: number
          spell_extract_id: number
          updated_at: string | null
          used: number
        }
        Insert: {
          created_at?: string | null
          game_character_id: number
          id?: number
          level: number
          prepared?: number
          spell_extract_id: number
          updated_at?: string | null
          used?: number
        }
        Update: {
          created_at?: string | null
          game_character_id?: number
          id?: number
          level?: number
          prepared?: number
          spell_extract_id?: number
          updated_at?: string | null
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_extract_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_extract_spell_extract_id_fkey"
            columns: ["spell_extract_id"]
            isOneToOne: false
            referencedRelation: "spell_extract"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_favored_class_bonus: {
        Row: {
          choice_id: number
          class_id: number
          created_at: string | null
          game_character_id: number
          id: number
          level: number
          updated_at: string | null
        }
        Insert: {
          choice_id: number
          class_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          level: number
          updated_at?: string | null
        }
        Update: {
          choice_id?: number
          class_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_favored_class_bonus_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "ref_favored_class_choice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_favored_class_bonus_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_favored_class_bonus_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_feat: {
        Row: {
          created_at: string | null
          feat_id: number
          game_character_id: number
          id: number
          level_obtained: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feat_id: number
          game_character_id: number
          id?: number
          level_obtained?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feat_id?: number
          game_character_id?: number
          id?: number
          level_obtained?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_feat_feat_id_fkey"
            columns: ["feat_id"]
            isOneToOne: false
            referencedRelation: "feat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_feat_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_skill_rank: {
        Row: {
          applied_at_level: number
          created_at: string | null
          game_character_id: number
          id: number
          skill_id: number
          source_id: number | null
          updated_at: string | null
        }
        Insert: {
          applied_at_level?: number
          created_at?: string | null
          game_character_id: number
          id?: number
          skill_id: number
          source_id?: number | null
          updated_at?: string | null
        }
        Update: {
          applied_at_level?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          skill_id?: number
          source_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_skill_rank_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_skill_rank_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skill"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_skill_rank_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ref_skill_rank_source"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_wild_talent: {
        Row: {
          created_at: string | null
          game_character_id: number
          id: number
          level_obtained: number
          updated_at: string | null
          wild_talent_id: number
        }
        Insert: {
          created_at?: string | null
          game_character_id: number
          id?: number
          level_obtained: number
          updated_at?: string | null
          wild_talent_id: number
        }
        Update: {
          created_at?: string | null
          game_character_id?: number
          id?: number
          level_obtained?: number
          updated_at?: string | null
          wild_talent_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_wild_talent_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_wild_talent_wild_talent_id_fkey"
            columns: ["wild_talent_id"]
            isOneToOne: false
            referencedRelation: "wild_talent"
            referencedColumns: ["id"]
          },
        ]
      }
      natural_attack: {
        Row: {
          attack_count: number | null
          attack_type: string
          created_at: string | null
          damage: string
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          attack_count?: number | null
          attack_type: string
          created_at?: string | null
          damage: string
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          attack_count?: number | null
          attack_type?: string
          created_at?: string | null
          damage?: string
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_abp_bonus_type: {
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
      ref_abp_node: {
        Row: {
          created_at: string | null
          description: string | null
          group_id: number
          id: number
          label: string | null
          name: string
          requires_choice: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_id: number
          id?: number
          label?: string | null
          name: string
          requires_choice?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_id?: number
          id?: number
          label?: string | null
          name?: string
          requires_choice?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ref_abp_node_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ref_abp_node_group"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_abp_node_bonus: {
        Row: {
          bonus_type_id: number
          created_at: string | null
          id: number
          node_id: number
          target_specifier: string | null
          updated_at: string | null
          value: number
        }
        Insert: {
          bonus_type_id: number
          created_at?: string | null
          id?: number
          node_id: number
          target_specifier?: string | null
          updated_at?: string | null
          value: number
        }
        Update: {
          bonus_type_id?: number
          created_at?: string | null
          id?: number
          node_id?: number
          target_specifier?: string | null
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ref_abp_node_bonus_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "ref_abp_bonus_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ref_abp_node_bonus_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "ref_abp_node"
            referencedColumns: ["id"]
          },
        ]
      }
      ref_abp_node_group: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          level: number
          name: string
          requires_choice: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          level: number
          name: string
          requires_choice?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          level?: number
          name?: string
          requires_choice?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_attribute: {
        Row: {
          attribute_type: string | null
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          attribute_type?: string | null
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          attribute_type?: string | null
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ref_bonus_type: {
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
      ref_buff_type: {
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
      ref_favored_class_choice: {
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
      ref_legendary_gift_type: {
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
      ref_skill_rank_source: {
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
      skill: {
        Row: {
          ability: string
          armor_check_penalty: boolean | null
          created_at: string | null
          id: number
          label: string | null
          name: string
          trained_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          ability: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ability?: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_bonus: {
        Row: {
          bonus: number
          created_at: string | null
          id: number
          label: string | null
          name: string
          skill_name: string
          updated_at: string | null
        }
        Insert: {
          bonus: number
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          skill_name: string
          updated_at?: string | null
        }
        Update: {
          bonus?: number
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          skill_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spell: {
        Row: {
          casting_time: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          id: number
          level: number
          name: string
          school: string | null
          spell_range: string | null
          target: string | null
          updated_at: string | null
        }
        Insert: {
          casting_time?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          level: number
          name: string
          school?: string | null
          spell_range?: string | null
          target?: string | null
          updated_at?: string | null
        }
        Update: {
          casting_time?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          id?: number
          level?: number
          name?: string
          school?: string | null
          spell_range?: string | null
          target?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spell_consumable: {
        Row: {
          caster_level: number | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          spell_id: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          caster_level?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          spell_id?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          caster_level?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          spell_id?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_consumable_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_extract: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          level?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trait: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          trait_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          trait_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          trait_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weapon: {
        Row: {
          created_at: string | null
          crit_mult: number
          crit_range: number
          damage_die_count: number
          damage_die_size: number
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crit_mult?: number
          crit_range?: number
          damage_die_count?: number
          damage_die_size?: number
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crit_mult?: number
          crit_range?: number
          damage_die_count?: number
          damage_die_size?: number
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      weapon_proficiency: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
          weapon_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
          weapon_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
          weapon_name?: string
        }
        Relationships: []
      }
      wild_talent: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          talent_level: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          talent_level?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          talent_level?: number | null
          updated_at?: string | null
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
