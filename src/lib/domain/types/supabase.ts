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
          id: number
          size: string
          updated_at: string | null
        }
        Insert: {
          base_speed?: number
          created_at?: string | null
          id: number
          size?: string
          updated_at?: string | null
        }
        Update: {
          base_speed?: number
          created_at?: string | null
          id?: number
          size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_ancestries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
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
      base_attributes: {
        Row: {
          attribute_type: string | null
          created_at: string | null
          default_value: number | null
          id: number
          is_core_attribute: boolean | null
          updated_at: string | null
        }
        Insert: {
          attribute_type?: string | null
          created_at?: string | null
          default_value?: number | null
          id: number
          is_core_attribute?: boolean | null
          updated_at?: string | null
        }
        Update: {
          attribute_type?: string | null
          created_at?: string | null
          default_value?: number | null
          id?: number
          is_core_attribute?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_attributes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
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
      base_classes: {
        Row: {
          created_at: string | null
          hit_die: number | null
          id: number
          skill_ranks_per_level: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hit_die?: number | null
          id: number
          skill_ranks_per_level?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hit_die?: number | null
          id?: number
          skill_ranks_per_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_classes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_corruption_manifestations: {
        Row: {
          corruption_id: number
          created_at: string | null
          id: number
          min_manifestation_level: number
          prerequisite_manifestation: string | null
          updated_at: string | null
        }
        Insert: {
          corruption_id: number
          created_at?: string | null
          id: number
          min_manifestation_level?: number
          prerequisite_manifestation?: string | null
          updated_at?: string | null
        }
        Update: {
          corruption_id?: number
          created_at?: string | null
          id?: number
          min_manifestation_level?: number
          prerequisite_manifestation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_corruption_manifestations_corruption_id_fkey"
            columns: ["corruption_id"]
            isOneToOne: false
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_corruption_manifestations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_corruptions: {
        Row: {
          corruption_stage: number | null
          created_at: string | null
          id: number
          manifestation_level: number | null
          updated_at: string | null
        }
        Insert: {
          corruption_stage?: number | null
          created_at?: string | null
          id: number
          manifestation_level?: number | null
          updated_at?: string | null
        }
        Update: {
          corruption_stage?: number | null
          created_at?: string | null
          id?: number
          manifestation_level?: number | null
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
      base_discoveries: {
        Row: {
          created_at: string | null
          discovery_level: number | null
          id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovery_level?: number | null
          id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovery_level?: number | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_discoveries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      base_equipment: {
        Row: {
          cost: number | null
          created_at: string | null
          equipment_category: string | null
          id: number
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          equipment_category?: string | null
          id: number
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          equipment_category?: string | null
          id?: number
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "base_equipment_id_fkey"
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
          trained_only: boolean | null
          updated_at: string | null
        }
        Insert: {
          ability: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id: number
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ability?: string
          armor_check_penalty?: boolean | null
          created_at?: string | null
          id?: number
          trained_only?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_skills_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "rpg_entities"
            referencedColumns: ["id"]
          },
        ]
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
      base_wild_talents: {
        Row: {
          created_at: string | null
          id: number
          talent_level: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          talent_level?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          talent_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_wild_talents_id_fkey"
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
        Relationships: [
          {
            foreignKeyName: "character_entity_choices_character_entity_id_fkey"
            columns: ["character_entity_id"]
            isOneToOne: false
            referencedRelation: "character_rpg_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      character_rpg_entities: {
        Row: {
          character_id: number
          created_at: string | null
          entity_id: number
          id: number
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          character_id: number
          created_at?: string | null
          entity_id: number
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          character_id?: number
          created_at?: string | null
          entity_id?: number
          id?: number
          is_active?: boolean | null
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
      character_rpg_entity_properties: {
        Row: {
          character_rpg_entity_id: number
          created_at: string | null
          id: number
          property_key: string
          property_value: string
          updated_at: string | null
        }
        Insert: {
          character_rpg_entity_id: number
          created_at?: string | null
          id?: number
          property_key: string
          property_value: string
          updated_at?: string | null
        }
        Update: {
          character_rpg_entity_id?: number
          created_at?: string | null
          id?: number
          property_key?: string
          property_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_rpg_entity_properties_character_rpg_entity_id_fkey"
            columns: ["character_rpg_entity_id"]
            isOneToOne: false
            referencedRelation: "character_rpg_entities"
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
      characters: {
        Row: {
          created_at: string | null
          current_hp: number
          id: number
          is_offline: boolean | null
          max_hp: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
          max_hp?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_hp?: number
          id?: number
          is_offline?: boolean | null
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
