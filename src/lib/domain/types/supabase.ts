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
      ability: {
        Row: {
          ability_type: string | null
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          ability_type?: string | null
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          ability_type?: string | null
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      abp_bonus_type: {
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
      abp_node: {
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
            foreignKeyName: "abp_node_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "abp_node_group"
            referencedColumns: ["id"]
          },
        ]
      }
      abp_node_bonus: {
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
            foreignKeyName: "abp_node_bonus_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "abp_bonus_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abp_node_bonus_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "abp_node"
            referencedColumns: ["id"]
          },
        ]
      }
      abp_node_group: {
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
      ancestry: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          size: string
          speed: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          size?: string
          speed?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name?: string
          size?: string
          speed?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ancestry_trait: {
        Row: {
          ancestry_id: number
          created_at: string | null
          description: string | null
          id: number
          is_standard: boolean
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          is_standard?: boolean
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          is_standard?: boolean
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_trait_ancestry_id_fkey"
            columns: ["ancestry_id"]
            isOneToOne: false
            referencedRelation: "ancestry"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestry_trait_benefit: {
        Row: {
          ancestry_trait_id: number
          created_at: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          ancestry_trait_id: number
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          ancestry_trait_id?: number
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_trait_benefit_ancestry_trait_id_fkey"
            columns: ["ancestry_trait_id"]
            isOneToOne: false
            referencedRelation: "ancestry_trait"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestry_trait_benefit_bonus: {
        Row: {
          ancestry_trait_benefit_id: number
          bonus_type_id: number
          created_at: string | null
          id: number
          target_specifier_id: number
          updated_at: string | null
          value: number
        }
        Insert: {
          ancestry_trait_benefit_id: number
          bonus_type_id: number
          created_at?: string | null
          id?: number
          target_specifier_id: number
          updated_at?: string | null
          value: number
        }
        Update: {
          ancestry_trait_benefit_id?: number
          bonus_type_id?: number
          created_at?: string | null
          id?: number
          target_specifier_id?: number
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_trait_benefit_bonus_ancestry_trait_benefit_id_fkey"
            columns: ["ancestry_trait_benefit_id"]
            isOneToOne: false
            referencedRelation: "ancestry_trait_benefit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ancestry_trait_benefit_bonus_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ancestry_trait_benefit_bonus_target_specifier_id_fkey"
            columns: ["target_specifier_id"]
            isOneToOne: false
            referencedRelation: "target_specifier"
            referencedColumns: ["id"]
          },
        ]
      }
      ancestry_trait_replacement: {
        Row: {
          created_at: string | null
          id: number
          replaced_trait_id: number
          replacing_trait_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          replaced_trait_id: number
          replacing_trait_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          replaced_trait_id?: number
          replacing_trait_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ancestry_trait_replacement_replaced_trait_id_fkey"
            columns: ["replaced_trait_id"]
            isOneToOne: false
            referencedRelation: "ancestry_trait"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ancestry_trait_replacement_replacing_trait_id_fkey"
            columns: ["replacing_trait_id"]
            isOneToOne: false
            referencedRelation: "ancestry_trait"
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
          feature_level: number | null
          id: number
          updated_at: string | null
        }
        Insert: {
          archetype_id: number
          class_id: number
          created_at?: string | null
          feature_id: number
          feature_level?: number | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          archetype_id?: number
          class_id?: number
          created_at?: string | null
          feature_id?: number
          feature_level?: number | null
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
      archetype_class_feature_alteration: {
        Row: {
          altered_class_feature_id: number
          archetype_class_feature_id: number
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          altered_class_feature_id: number
          archetype_class_feature_id: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          altered_class_feature_id?: number
          archetype_class_feature_id?: number
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_class_feature_alterat_archetype_class_feature_id_fkey"
            columns: ["archetype_class_feature_id"]
            isOneToOne: false
            referencedRelation: "archetype_class_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_class_feature_alteratio_altered_class_feature_id_fkey"
            columns: ["altered_class_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
        ]
      }
      archetype_class_feature_replacement: {
        Row: {
          archetype_class_feature_id: number
          created_at: string | null
          id: number
          replaced_class_feature_id: number
          updated_at: string | null
        }
        Insert: {
          archetype_class_feature_id: number
          created_at?: string | null
          id?: number
          replaced_class_feature_id: number
          updated_at?: string | null
        }
        Update: {
          archetype_class_feature_id?: number
          created_at?: string | null
          id?: number
          replaced_class_feature_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archetype_class_feature_replace_archetype_class_feature_id_fkey"
            columns: ["archetype_class_feature_id"]
            isOneToOne: false
            referencedRelation: "archetype_class_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archetype_class_feature_replacem_replaced_class_feature_id_fkey"
            columns: ["replaced_class_feature_id"]
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
      bonus_attack_progression: {
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
      bonus_type: {
        Row: {
          created_at: string | null
          id: number
          label: string | null
          name: string
          stacking: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          label?: string | null
          name: string
          stacking?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          label?: string | null
          name?: string
          stacking?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      class: {
        Row: {
          base_attack_bonus_progression: number | null
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
          base_attack_bonus_progression?: number | null
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
          base_attack_bonus_progression?: number | null
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
        Relationships: [
          {
            foreignKeyName: "class_base_attack_bonus_progression_fkey"
            columns: ["base_attack_bonus_progression"]
            isOneToOne: false
            referencedRelation: "bonus_attack_progression"
            referencedColumns: ["id"]
          },
        ]
      }
      class_feature: {
        Row: {
          class_id: number | null
          created_at: string | null
          description: string | null
          feature_level: number | null
          id: number
          is_limited: boolean | null
          is_toggleable: boolean | null
          label: string | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          feature_level?: number | null
          id?: number
          is_limited?: boolean | null
          is_toggleable?: boolean | null
          label?: string | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          feature_level?: number | null
          id?: number
          is_limited?: boolean | null
          is_toggleable?: boolean | null
          label?: string | null
          name?: string
          type?: string | null
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
      class_feature_benefit: {
        Row: {
          class_feature_id: number
          created_at: string | null
          feature_level: number | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          class_feature_id: number
          created_at?: string | null
          feature_level?: number | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          class_feature_id?: number
          created_at?: string | null
          feature_level?: number | null
          id?: number
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_feature_benefit_class_feature_id_fkey"
            columns: ["class_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
        ]
      }
      class_feature_benefit_bonus: {
        Row: {
          bonus_type_id: number
          class_feature_benefit_id: number
          created_at: string | null
          id: number
          target_specifier_id: number
          updated_at: string | null
          value: number
        }
        Insert: {
          bonus_type_id: number
          class_feature_benefit_id: number
          created_at?: string | null
          id?: number
          target_specifier_id: number
          updated_at?: string | null
          value: number
        }
        Update: {
          bonus_type_id?: number
          class_feature_benefit_id?: number
          created_at?: string | null
          id?: number
          target_specifier_id?: number
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_feature_benefit_bonus_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_feature_benefit_bonus_class_feature_benefit_id_fkey"
            columns: ["class_feature_benefit_id"]
            isOneToOne: false
            referencedRelation: "class_feature_benefit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_feature_benefit_bonus_target_specifier_id_fkey"
            columns: ["target_specifier_id"]
            isOneToOne: false
            referencedRelation: "target_specifier"
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
          description: string | null
          id: number
          label: string | null
          manifestation_level: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          corruption_stage?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          manifestation_level?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          corruption_stage?: number | null
          created_at?: string | null
          description?: string | null
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
          description: string | null
          id: number
          label: string | null
          min_manifestation_level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          corruption_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          min_manifestation_level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          corruption_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          min_manifestation_level?: number
          name?: string
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
      corruption_manifestation_prerequisite: {
        Row: {
          corruption_manifestation_id: number
          created_at: string | null
          id: number
          prerequisite_manifestation_id: number
          updated_at: string | null
        }
        Insert: {
          corruption_manifestation_id: number
          created_at?: string | null
          id?: number
          prerequisite_manifestation_id: number
          updated_at?: string | null
        }
        Update: {
          corruption_manifestation_id?: number
          created_at?: string | null
          id?: number
          prerequisite_manifestation_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corruption_manifestation_prer_prerequisite_manifestation_i_fkey"
            columns: ["prerequisite_manifestation_id"]
            isOneToOne: false
            referencedRelation: "corruption_manifestation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corruption_manifestation_prere_corruption_manifestation_id_fkey"
            columns: ["corruption_manifestation_id"]
            isOneToOne: false
            referencedRelation: "corruption_manifestation"
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
      element: {
        Row: {
          base_skill: string | null
          created_at: string | null
          energy_type: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          base_skill?: string | null
          created_at?: string | null
          energy_type?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          base_skill?: string | null
          created_at?: string | null
          energy_type?: string | null
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
            referencedRelation: "bonus_type"
            referencedColumns: ["id"]
          },
        ]
      }
      favored_class_choice: {
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
      feat: {
        Row: {
          created_at: string | null
          description: string | null
          feat_type: string | null
          id: number
          is_toggleable: boolean | null
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feat_type?: string | null
          id?: number
          is_toggleable?: boolean | null
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feat_type?: string | null
          id?: number
          is_toggleable?: boolean | null
          label?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feat_benefit: {
        Row: {
          benefit: string | null
          created_at: string | null
          feat_id: number
          id: number
          label: string | null
          name: string
          school_id: number | null
          updated_at: string | null
        }
        Insert: {
          benefit?: string | null
          created_at?: string | null
          feat_id: number
          id?: number
          label?: string | null
          name: string
          school_id?: number | null
          updated_at?: string | null
        }
        Update: {
          benefit?: string | null
          created_at?: string | null
          feat_id?: number
          id?: number
          label?: string | null
          name?: string
          school_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feat_benefit_feat_id_fkey"
            columns: ["feat_id"]
            isOneToOne: false
            referencedRelation: "feat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feat_benefit_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "spell_school"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_qualification_mapping: {
        Row: {
          created_at: string | null
          fulfillment_id: number
          id: number
          qualification_id: number
          qualification_type_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fulfillment_id: number
          id?: number
          qualification_id: number
          qualification_type_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fulfillment_id?: number
          id?: number
          qualification_id?: number
          qualification_type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_qualification_mapping_fulfillment_id_fkey"
            columns: ["fulfillment_id"]
            isOneToOne: false
            referencedRelation: "prerequisite_fulfillment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_qualification_mapping_qualification_type_id_fkey"
            columns: ["qualification_type_id"]
            isOneToOne: false
            referencedRelation: "qualification_type"
            referencedColumns: ["id"]
          },
        ]
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
      game_character_ability: {
        Row: {
          ability_id: number
          created_at: string | null
          game_character_id: number
          id: number
          updated_at: string | null
          value: number
        }
        Insert: {
          ability_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
          value: number
        }
        Update: {
          ability_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_ability_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "ability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_ability_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "abp_node_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_abp_choice_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "abp_node"
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
      game_character_ancestry_trait: {
        Row: {
          ancestry_trait_id: number
          created_at: string | null
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          ancestry_trait_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          ancestry_trait_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_ancestry_trait_ancestry_trait_id_fkey"
            columns: ["ancestry_trait_id"]
            isOneToOne: false
            referencedRelation: "ancestry_trait"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_ancestry_trait_game_character_id_fkey"
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
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          armor_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          armor_id?: number
          created_at?: string | null
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
      game_character_discovery: {
        Row: {
          created_at: string | null
          discovery_id: number
          game_character_id: number
          id: number
          level_obtained: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovery_id: number
          game_character_id: number
          id?: number
          level_obtained: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovery_id?: number
          game_character_id?: number
          id?: number
          level_obtained?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_discovery_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_discovery_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_equipment: {
        Row: {
          created_at: string | null
          equipment_id: number
          game_character_id: number
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id: number
          game_character_id: number
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: number
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
            referencedRelation: "favored_class_choice"
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
          is_active: boolean
          level_obtained: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feat_id: number
          game_character_id: number
          id?: number
          is_active?: boolean
          level_obtained?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feat_id?: number
          game_character_id?: number
          id?: number
          is_active?: boolean
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
          updated_at: string | null
        }
        Insert: {
          applied_at_level?: number
          created_at?: string | null
          game_character_id: number
          id?: number
          skill_id: number
          updated_at?: string | null
        }
        Update: {
          applied_at_level?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          skill_id?: number
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
        ]
      }
      game_character_spell: {
        Row: {
          created_at: string | null
          game_character_id: number
          id: number
          level: number
          prepared: number
          spell_id: number
          updated_at: string | null
          used: number
        }
        Insert: {
          created_at?: string | null
          game_character_id: number
          id?: number
          level: number
          prepared?: number
          spell_id: number
          updated_at?: string | null
          used?: number
        }
        Update: {
          created_at?: string | null
          game_character_id?: number
          id?: number
          level?: number
          prepared?: number
          spell_id?: number
          updated_at?: string | null
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_spell_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_spell_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_spell_slot: {
        Row: {
          class_id: number
          created_at: string | null
          game_character_id: number
          id: number
          is_used: boolean
          spell_level: number
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          game_character_id: number
          id?: number
          is_used?: boolean
          spell_level: number
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          game_character_id?: number
          id?: number
          is_used?: boolean
          spell_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_spell_slot_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_spell_slot_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_trait: {
        Row: {
          created_at: string | null
          game_character_id: number
          id: number
          trait_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_character_id: number
          id?: number
          trait_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_character_id?: number
          id?: number
          trait_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_character_trait_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_trait_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait"
            referencedColumns: ["id"]
          },
        ]
      }
      game_character_weapon: {
        Row: {
          created_at: string | null
          enhancement: number
          game_character_id: number
          id: number
          masterwork: boolean
          updated_at: string | null
          weapon_id: number
        }
        Insert: {
          created_at?: string | null
          enhancement?: number
          game_character_id: number
          id?: number
          masterwork?: boolean
          updated_at?: string | null
          weapon_id: number
        }
        Update: {
          created_at?: string | null
          enhancement?: number
          game_character_id?: number
          id?: number
          masterwork?: boolean
          updated_at?: string | null
          weapon_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_character_weapon_game_character_id_fkey"
            columns: ["game_character_id"]
            isOneToOne: false
            referencedRelation: "game_character"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_character_weapon_weapon_id_fkey"
            columns: ["weapon_id"]
            isOneToOne: false
            referencedRelation: "weapon"
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
      legendary_gift_type: {
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
      monk_unchained_ki_power: {
        Row: {
          class_id: number | null
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          min_level: number | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          min_level?: number | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          min_level?: number | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monk_unchained_ki_power_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisite_fulfillment: {
        Row: {
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      prerequisite_requirement: {
        Row: {
          created_at: string | null
          id: number
          requirement_id: number
          requirement_type_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          requirement_id: number
          requirement_type_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          requirement_id?: number
          requirement_type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prerequisite_requirement_requirement_type_id_fkey"
            columns: ["requirement_type_id"]
            isOneToOne: false
            referencedRelation: "prerequisite_requirement_type"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisite_requirement_fulfillment_mapping: {
        Row: {
          created_at: string | null
          id: number
          prerequisite_fulfillment_id: number
          prerequisite_requirement_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          prerequisite_fulfillment_id: number
          prerequisite_requirement_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          prerequisite_fulfillment_id?: number
          prerequisite_requirement_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prerequisite_requirement_fulfi_prerequisite_fulfillment_id_fkey"
            columns: ["prerequisite_fulfillment_id"]
            isOneToOne: false
            referencedRelation: "prerequisite_fulfillment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prerequisite_requirement_fulfi_prerequisite_requirement_id_fkey"
            columns: ["prerequisite_requirement_id"]
            isOneToOne: false
            referencedRelation: "prerequisite_requirement"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisite_requirement_type: {
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
      qinggong_monk_ki_power: {
        Row: {
          class_id: number
          created_at: string | null
          id: number
          ki_cost: number
          min_level: number
          power_id: number
          power_type_id: number
          type: string | null
          updated_at: string | null
        }
        Insert: {
          class_id: number
          created_at?: string | null
          id?: number
          ki_cost: number
          min_level: number
          power_id: number
          power_type_id: number
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: number
          created_at?: string | null
          id?: number
          ki_cost?: number
          min_level?: number
          power_id?: number
          power_type_id?: number
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qinggong_monk_ki_power_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qinggong_monk_ki_power_power_type_id_fkey"
            columns: ["power_type_id"]
            isOneToOne: false
            referencedRelation: "qinggong_monk_ki_power_type"
            referencedColumns: ["id"]
          },
        ]
      }
      qinggong_monk_ki_power_type: {
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
      qualification_type: {
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
      rule: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill: {
        Row: {
          ability_id: number
          armor_check_penalty: boolean | null
          created_at: string | null
          id: number
          knowledge_skill: boolean | null
          label: string | null
          name: string
          trained_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          ability_id: number
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          knowledge_skill?: boolean | null
          label?: string | null
          name: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ability_id?: number
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          knowledge_skill?: boolean | null
          label?: string | null
          name?: string
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "ability"
            referencedColumns: ["id"]
          },
        ]
      }
      sorcerer_bloodline: {
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
      spell: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name?: string
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spell_casting_time: {
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
      spell_casting_time_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_casting_time_id: number
          spell_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_casting_time_id: number
          spell_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_casting_time_id?: number
          spell_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_casting_time_mapping_spell_casting_time_id_fkey"
            columns: ["spell_casting_time_id"]
            isOneToOne: false
            referencedRelation: "spell_casting_time"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_casting_time_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_component: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: number
          type_id: number
          updated_at: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          type_id: number
          updated_at?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_component_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "spell_component_type"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_component_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_component_id: number
          spell_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_component_id: number
          spell_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_component_id?: number
          spell_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_component_mapping_spell_component_id_fkey"
            columns: ["spell_component_id"]
            isOneToOne: false
            referencedRelation: "spell_component"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_component_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_component_type: {
        Row: {
          abbreviation: string | null
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          abbreviation?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name?: string
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
          label: string | null
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
          label?: string | null
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
          label?: string | null
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
      spell_duration: {
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
      spell_duration_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_duration_id: number
          spell_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_duration_id: number
          spell_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_duration_id?: number
          spell_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_duration_mapping_spell_duration_id_fkey"
            columns: ["spell_duration_id"]
            isOneToOne: false
            referencedRelation: "spell_duration"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_duration_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_list: {
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
      spell_list_class_feature_benefit_mapping: {
        Row: {
          class_feature_benefit_id: number
          created_at: string | null
          id: number
          spell_list_id: number
          updated_at: string | null
        }
        Insert: {
          class_feature_benefit_id: number
          created_at?: string | null
          id?: number
          spell_list_id: number
          updated_at?: string | null
        }
        Update: {
          class_feature_benefit_id?: number
          created_at?: string | null
          id?: number
          spell_list_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_list_class_feature_benefit__class_feature_benefit_id_fkey"
            columns: ["class_feature_benefit_id"]
            isOneToOne: false
            referencedRelation: "class_feature_benefit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_list_class_feature_benefit_mapping_spell_list_id_fkey"
            columns: ["spell_list_id"]
            isOneToOne: false
            referencedRelation: "spell_list"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_list_feat_mapping: {
        Row: {
          created_at: string | null
          feat_id: number
          id: number
          spell_list_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feat_id: number
          id?: number
          spell_list_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feat_id?: number
          id?: number
          spell_list_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_list_feat_mapping_feat_id_fkey"
            columns: ["feat_id"]
            isOneToOne: false
            referencedRelation: "feat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_list_feat_mapping_spell_list_id_fkey"
            columns: ["spell_list_id"]
            isOneToOne: false
            referencedRelation: "spell_list"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_list_spell_mapping: {
        Row: {
          created_at: string | null
          id: number
          level: number
          spell_id: number
          spell_list_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          level: number
          spell_id: number
          spell_list_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          level?: number
          spell_id?: number
          spell_list_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_list_spell_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_list_spell_mapping_spell_list_id_fkey"
            columns: ["spell_list_id"]
            isOneToOne: false
            referencedRelation: "spell_list"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_progression: {
        Row: {
          class_level: number
          created_at: string | null
          id: number
          progression_type_id: number
          slots: number
          spell_level: number
          updated_at: string | null
        }
        Insert: {
          class_level: number
          created_at?: string | null
          id?: number
          progression_type_id: number
          slots: number
          spell_level: number
          updated_at?: string | null
        }
        Update: {
          class_level?: number
          created_at?: string | null
          id?: number
          progression_type_id?: number
          slots?: number
          spell_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_progression_progression_type_id_fkey"
            columns: ["progression_type_id"]
            isOneToOne: false
            referencedRelation: "spell_progression_type"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_progression_type: {
        Row: {
          created_at: string | null
          id: number
          is_spontaneous: boolean
          label: string | null
          max_spell_level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_spontaneous: boolean
          label?: string | null
          max_spell_level: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_spontaneous?: boolean
          label?: string | null
          max_spell_level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spell_range: {
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
      spell_range_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_id: number
          spell_range_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_id: number
          spell_range_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_id?: number
          spell_range_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_range_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_range_mapping_spell_range_id_fkey"
            columns: ["spell_range_id"]
            isOneToOne: false
            referencedRelation: "spell_range"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_school: {
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
      spell_school_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_id: number
          spell_school_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_id: number
          spell_school_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_id?: number
          spell_school_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_school_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_school_mapping_spell_school_id_fkey"
            columns: ["spell_school_id"]
            isOneToOne: false
            referencedRelation: "spell_school"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_sorcerer_bloodline_mapping: {
        Row: {
          created_at: string | null
          id: number
          level: number
          sorcerer_bloodline_id: number
          spell_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          level: number
          sorcerer_bloodline_id: number
          spell_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          level?: number
          sorcerer_bloodline_id?: number
          spell_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_sorcerer_bloodline_mapping_sorcerer_bloodline_id_fkey"
            columns: ["sorcerer_bloodline_id"]
            isOneToOne: false
            referencedRelation: "sorcerer_bloodline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_sorcerer_bloodline_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_subdomain_mapping: {
        Row: {
          created_at: string | null
          id: number
          level: number
          spell_id: number
          subdomain_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          level: number
          spell_id: number
          subdomain_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          level?: number
          spell_id?: number
          subdomain_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_subdomain_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_subdomain_mapping_subdomain_id_fkey"
            columns: ["subdomain_id"]
            isOneToOne: false
            referencedRelation: "subdomain"
            referencedColumns: ["id"]
          },
        ]
      }
      spell_target: {
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
      spell_target_mapping: {
        Row: {
          created_at: string | null
          id: number
          spell_id: number
          spell_target_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          spell_id: number
          spell_target_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          spell_id?: number
          spell_target_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spell_target_mapping_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spell"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spell_target_mapping_spell_target_id_fkey"
            columns: ["spell_target_id"]
            isOneToOne: false
            referencedRelation: "spell_target"
            referencedColumns: ["id"]
          },
        ]
      }
      spellcasting_class_feature: {
        Row: {
          ability_id: number
          class_feature_id: number
          created_at: string | null
          id: number
          progression_type_id: number
          spellcasting_type_id: number
          updated_at: string | null
        }
        Insert: {
          ability_id: number
          class_feature_id: number
          created_at?: string | null
          id?: number
          progression_type_id: number
          spellcasting_type_id: number
          updated_at?: string | null
        }
        Update: {
          ability_id?: number
          class_feature_id?: number
          created_at?: string | null
          id?: number
          progression_type_id?: number
          spellcasting_type_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spellcasting_class_feature_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "ability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spellcasting_class_feature_class_feature_id_fkey"
            columns: ["class_feature_id"]
            isOneToOne: false
            referencedRelation: "class_feature"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spellcasting_class_feature_progression_type_id_fkey"
            columns: ["progression_type_id"]
            isOneToOne: false
            referencedRelation: "spell_progression_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spellcasting_class_feature_spellcasting_type_id_fkey"
            columns: ["spellcasting_type_id"]
            isOneToOne: false
            referencedRelation: "spellcasting_type"
            referencedColumns: ["id"]
          },
        ]
      }
      spellcasting_type: {
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
      subdomain: {
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
      target_specifier: {
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
      trait: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          name: string
          trait_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          name: string
          trait_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
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
      wild_talent: {
        Row: {
          associated_blasts: string | null
          burn: number | null
          class_id: number | null
          created_at: string | null
          description: string | null
          id: number
          label: string | null
          level: number | null
          name: string
          saving_throw: string | null
          updated_at: string | null
          wild_talent_type_id: number | null
        }
        Insert: {
          associated_blasts?: string | null
          burn?: number | null
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          level?: number | null
          name: string
          saving_throw?: string | null
          updated_at?: string | null
          wild_talent_type_id?: number | null
        }
        Update: {
          associated_blasts?: string | null
          burn?: number | null
          class_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          label?: string | null
          level?: number | null
          name?: string
          saving_throw?: string | null
          updated_at?: string | null
          wild_talent_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wild_talent_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wild_talent_wild_talent_type_id_fkey"
            columns: ["wild_talent_type_id"]
            isOneToOne: false
            referencedRelation: "wild_talent_type"
            referencedColumns: ["id"]
          },
        ]
      }
      wild_talent_type: {
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
