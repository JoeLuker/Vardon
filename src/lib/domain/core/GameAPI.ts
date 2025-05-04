
// FILE: src/lib/db/gameRules.api.ts (Radical Realtime-Focused Revision - COMPLETE)

import type { RealtimeChannel, RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
// *** ENSURE THIS IMPORT POINTS TO TYPES GENERATED FROM YOUR MULTI-SCHEMA DB ***
import type { Database } from '$lib/domain/types/supabase';
import _ from 'lodash'; // Useful for utility functions

// --- Logger ---
const logger = {
    info: (message: string, ...args: any[]) => console.log(`%c[GameRulesAPI INFO]%c ${message}`, 'color: green; font-weight: bold;', 'color: inherit;', ...args),
    debug: (message: string, ...args: any[]) => console.debug(`%c[GameRulesAPI DEBUG]%c ${message}`, 'color: gray;', 'color: inherit;', ...args),
    warn: (message: string, ...args: any[]) => console.warn(`[GameRulesAPI WARN] ${message}`, ...args),
    error: (message: string, ...args: any[]) => console.error(`[GameRulesAPI ERROR] ${message}`, ...args),
};

/**
 * GameRules namespace organizes all types and interfaces related to game rules,
 * reflecting the new schema structure.
 */
export namespace GameRules {
  /** Base database types from different schemas */
  export namespace Base {
    type CoreTables = Database['core']['Tables'];
    type FeaturesTables = Database['features']['Tables'];
    type ConfigTables = Database['config']['Tables'];
    type StateTables = Database['state']['Tables'];
    // Add other schemas if needed

    export type CoreRow<T extends keyof CoreTables> = CoreTables[T]['Row'];
    export type FeaturesRow<T extends keyof FeaturesTables> = FeaturesTables[T]['Row'];
    export type ConfigRow<T extends keyof ConfigTables> = ConfigTables[T]['Row'];
    export type StateRow<T extends keyof StateTables> = StateTables[T]['Row'];
    // Helper for any row type (use cautiously)
     export type AnyRow<T extends string, S extends keyof Database = 'public'> =
        S extends 'core' ? CoreRow<Extract<T, keyof CoreTables>> :
        S extends 'features' ? FeaturesRow<Extract<T, keyof FeaturesTables>> :
        S extends 'config' ? ConfigRow<Extract<T, keyof ConfigTables>> :
        S extends 'state' ? StateRow<Extract<T, keyof StateTables>> :
        // Add other schemas
        never;
  }

  /** Define complex relationship types based on the expected structure of joins */
  export namespace Relationships {

    // --- Config Relations ---
    export interface AbpNodeWithBonuses extends Base.ConfigRow<'abp_node'> {
       bonuses?: (Base.ConfigRow<'abp_node_bonus'> & {
         bonus_type: Base.ConfigRow<'abp_bonus_type'>;
       })[];
     }

     export interface SkillWithAbility extends Base.ConfigRow<'skill'> {
        ability: Base.ConfigRow<'ability'>;
     }

    // --- Feature Definition Relations ---
     export interface FeatureBenefitBonus extends Base.FeaturesRow<'class_feature_benefit_bonus'> {
        bonus_type: Base.ConfigRow<'bonus_type'>;
        target_specifier: Base.ConfigRow<'target_specifier'>;
     }
     export interface FeatureBenefit extends Base.FeaturesRow<'class_feature_benefit'>{
        class_feature_benefit_bonus?: FeatureBenefitBonus[];
     }
     export interface SpellcastingFeature extends Base.FeaturesRow<'spellcasting_class_feature'> {
       spellcasting_type?: Base.ConfigRow<'spellcasting_type'>;
       spell_progression_type?: Base.ConfigRow<'spell_progression_type'> & {
          spell_progression?: Base.ConfigRow<'spell_progression'>[];
       };
       ability?: Base.ConfigRow<'ability'>;
     }
     export interface FeatureDefinitionBase { // Common fields from features tables
        id: number;
        name: string;
        label: string | null;
        description: string | null;
        feature_path: string | null;
        required_subsystems: string[] | null;
        persistent: boolean | null;
        // Potential relation fields to join
        class_feature_benefit?: FeatureBenefit[];
        spellcasting_info?: SpellcastingFeature; // If joined from spellcasting_class_feature
     }
     // Example concrete feature type extending the base
     export interface ClassFeatureDefinition extends FeatureDefinitionBase, Base.FeaturesRow<'class_feature'> {}
     export interface FeatDefinition extends FeatureDefinitionBase, Base.FeaturesRow<'feat'> {}
     // ... create others for Trait, CorruptionManifestation etc. if needed ...

     export interface ExtendedCorruptionManifestation extends Base.FeaturesRow<'corruption_manifestation'> {
        prerequisite_links?: (Base.FeaturesRow<'corruption_manifestation_prerequisite'> & {
          prerequisite?: Base.FeaturesRow<'corruption_manifestation'>;
        })[];
     }

     export interface AncestryTraitWithBenefits extends Base.FeaturesRow<'ancestry_trait'> {
         ancestry_trait_benefit?: (Base.FeaturesRow<'ancestry_trait_benefit'> & {
             ancestry_trait_benefit_bonus?: (Base.FeaturesRow<'ancestry_trait_benefit_bonus'> & {
                 bonus_type: Base.ConfigRow<'bonus_type'>;
                 target_specifier: Base.ConfigRow<'target_specifier'>;
             })[];
         })[];
     }

    // --- Character Class & Archetype Relations ---
     export interface ArchetypeClassFeature extends Base.FeaturesRow<'archetype_class_feature'> {
       class_feature?: ClassFeatureDefinition; // Joined feature definition
       archetype_class_feature_replacement?: Base.FeaturesRow<'archetype_class_feature_replacement'>[]; // Link table
       archetype_class_feature_alteration?: Base.FeaturesRow<'archetype_class_feature_alteration'>[]; // Link table
     }
     export interface ArchetypeWithFeatures extends Base.ConfigRow<'archetype'> {
        archetype_class_feature?: ArchetypeClassFeature[]; // Nested archetype features
     }
     export interface ClassWithFeatures extends Base.ConfigRow<'class'> {
        bonus_attack_progression_info?: Base.ConfigRow<'bonus_attack_progression'>;
        defined_class_features?: ClassFeatureDefinition[]; // Features intrinsically part of the class definition
     }

      // --- Spell Detail Relations ---
     export interface SpellWithDetails extends Base.FeaturesRow<'spell'> {
        spell_school_mapping?: { spell_school: Base.ConfigRow<'spell_school'> }[];
        spell_component_mapping?: { spell_component: Base.ConfigRow<'spell_component'> & { type: Base.ConfigRow<'spell_component_type'> } }[];
        spell_casting_time_mapping?: { spell_casting_time: Base.ConfigRow<'spell_casting_time'> }[];
        spell_range_mapping?: { spell_range: Base.ConfigRow<'spell_range'> }[];
        spell_duration_mapping?: { spell_duration: Base.ConfigRow<'spell_duration'> }[];
        spell_target_mapping?: { spell_target: Base.ConfigRow<'spell_target'> }[];
        // spell_list_spell_mapping?: { spell_list: Base.ConfigRow<'spell_list'>; level: number }[]; // Optional deep join
     }
  }

  /** Complete character data type for INITIAL LOAD */
  export namespace Complete {
     export interface Character extends Base.FeaturesRow<'game_character'> {
       // Direct character links (mostly from 'features' schema)
       game_character_ability?: (Base.FeaturesRow<'game_character_ability'> & { ability: Base.ConfigRow<'ability'> })[];
       game_character_class?: (Base.FeaturesRow<'game_character_class'> & { class: Relationships.ClassWithFeatures })[];
       game_character_ancestry?: (Base.FeaturesRow<'game_character_ancestry'> & { ancestry: Base.ConfigRow<'ancestry'> })[];
       game_character_ancestry_trait?: (Base.FeaturesRow<'game_character_ancestry_trait'> & { ancestry_trait: Relationships.AncestryTraitWithBenefits })[];
       game_character_archetype?: (Base.FeaturesRow<'game_character_archetype'> & { archetype: Relationships.ArchetypeWithFeatures })[]; // Includes joined archetype features
       game_character_armor?: (Base.FeaturesRow<'game_character_armor'> & { armor: Base.ConfigRow<'armor'> })[];
       game_character_equipment?: (Base.FeaturesRow<'game_character_equipment'> & { equipment: Base.ConfigRow<'equipment'> })[];
       game_character_consumable?: (Base.FeaturesRow<'game_character_consumable'> & { consumable: Base.ConfigRow<'consumable'> })[];
       game_character_feat?: (Base.FeaturesRow<'game_character_feat'> & { feat: Relationships.FeatDefinition })[]; // Use defined relationship
       game_character_trait?: (Base.FeaturesRow<'game_character_trait'> & { trait: Base.FeaturesRow<'trait'> })[]; // Use defined relationship (replace if TraitDefinition needed)
       game_character_class_feature?: (Base.FeaturesRow<'game_character_class_feature'> & { class_feature: Relationships.ClassFeatureDefinition })[];
       game_character_corruption?: (Base.FeaturesRow<'game_character_corruption'> & { corruption: Base.FeaturesRow<'corruption'> })[];
       game_character_corruption_manifestation?: (Base.FeaturesRow<'game_character_corruption_manifestation'> & { manifestation: Relationships.ExtendedCorruptionManifestation })[];
       game_character_skill_rank?: (Base.FeaturesRow<'game_character_skill_rank'> & { skill: Relationships.SkillWithAbility })[]; // Use defined relationship
       game_character_spell?: (Base.FeaturesRow<'game_character_spell'> & { spell: Relationships.SpellWithDetails })[]; // Use defined relationship
       game_character_spell_slot?: Base.FeaturesRow<'game_character_spell_slot'>[];
       game_character_favored_class_bonus?: (Base.FeaturesRow<'game_character_favored_class_bonus'> & { favored_class_choice: Base.ConfigRow<'favored_class_choice'>; class: Base.ConfigRow<'class'> })[];
       game_character_abp_choice?: (Base.FeaturesRow<'game_character_abp_choice'> & { node: Relationships.AbpNodeWithBonuses })[];
       game_character_discovery?: (Base.FeaturesRow<'game_character_discovery'> & { discovery: Base.FeaturesRow<'discovery'> })[]; // Use defined relationship (replace if DiscoveryDefinition needed)
       game_character_wild_talent?: (Base.FeaturesRow<'game_character_wild_talent'> & { wild_talent: Base.FeaturesRow<'wild_talent'> })[]; // Use defined relationship (replace if WildTalentDefinition needed)
       game_character_weapon?: (Base.FeaturesRow<'game_character_weapon'> & { weapon: Base.ConfigRow<'weapon'> })[];
     }
  }

  /** Callback types for real-time subscriptions */
  export namespace Callbacks {
    // Mapped types for flexibility across schemas
    export type TableNames<S extends keyof Database> = keyof Database[S]['Tables'];
    export type RowType<S extends keyof Database, T extends TableNames<S>> = Database[S]['Tables'][T]['Row'];

    export type RealtimeCallback<
       T extends TableNames<S>,
       S extends keyof Database
     > = (
       type: 'INSERT' | 'UPDATE' | 'DELETE',
       // Use the mapped RowType. Provide `any` as fallback if type generation is imperfect.
       row: RowType<S, T> | any | null
     ) => void | Promise<void>;
  }
}

// --- Type Aliases ---
// Example aliases for easier use
type ConfigRow<T extends GameRules.Callbacks.TableNames<'config'>> = GameRules.Base.ConfigRow<T>;
type FeaturesRow<T extends GameRules.Callbacks.TableNames<'features'>> = GameRules.Base.FeaturesRow<T>;
type RealtimeCallback<T extends GameRules.Callbacks.TableNames<S>, S extends keyof Database> = GameRules.Callbacks.RealtimeCallback<T, S>;

/**
 * GameRulesAPI provides a centralized interface for accessing and manipulating
 * game rules data in the database, adapted for the new multi-schema structure
 * and focused on realtime updates.
 */
export class GameRulesAPI {
  // Query for the initial character load. Keep it comprehensive but optimized.
   private readonly queries = {
     completeCharacterInitialLoad: `
       id, name, label, user_id, current_hp, max_hp, is_offline, entity_type, metadata, created_at, updated_at,
       game_character_ability:features.game_character_ability(id, value, ability:config.ability(id, name, label, ability_type)),
       game_character_class:features.game_character_class(id, level, class:config.class(id, name, label, hit_die, skill_ranks_per_level, fortitude, reflex, will, base_attack_bonus_progression)),
       game_character_ancestry:features.game_character_ancestry(id, ancestry:config.ancestry(id, name, label, size, speed)),
       game_character_ancestry_trait:features.game_character_ancestry_trait(id, ancestry_trait_id),
       game_character_archetype:features.game_character_archetype(id, archetype:config.archetype(id, name, label, class_id)),
       game_character_armor:features.game_character_armor(id, armor:config.armor(id, name, label, armor_type, armor_bonus, max_dex)),
       game_character_equipment:features.game_character_equipment(id, equipment:config.equipment(id, name, label, slot, bonus, bonus_type_id)),
       game_character_consumable:features.game_character_consumable(id, quantity, consumable:config.consumable(id, name, label)),
       game_character_feat:features.game_character_feat(id, level_obtained, is_active, activation_state, feat:features.feat(id, name, label, feat_type, description, feature_path, persistent)),
       game_character_trait:features.game_character_trait(id, trait:features.trait(id, name, label, trait_type, description, feature_path)),
       game_character_class_feature:features.game_character_class_feature(id, level_obtained, class_feature_id),
       game_character_corruption:features.game_character_corruption(id, corruption_stage, manifestation_level, blood_required, blood_consumed, corruption:features.corruption(id, name, label)),
       game_character_corruption_manifestation:features.game_character_corruption_manifestation(id, active, manifestation:features.corruption_manifestation(id, name, label, min_manifestation_level, description, feature_path, persistent, prerequisite_links:features.corruption_manifestation_prerequisite!corruption_manifestation_id(id, prerequisite_manifestation_id))),
       game_character_skill_rank:features.game_character_skill_rank(id, skill_id, applied_at_level),
       game_character_spell:features.game_character_spell(id, level, prepared, used, spell:features.spell(id, name, label)),
       game_character_spell_slot:features.game_character_spell_slot(id, class_id, spell_level, is_used),
       game_character_favored_class_bonus:features.game_character_favored_class_bonus(id, level, choice_id, class_id),
       game_character_abp_choice:features.game_character_abp_choice(id, group_id, node_id),
       game_character_discovery:features.game_character_discovery(id, level_obtained, discovery_id),
       game_character_wild_talent:features.game_character_wild_talent(id, level_obtained, wild_talent_id),
       game_character_weapon:features.game_character_weapon(id, enhancement, masterwork, weapon:config.weapon(id, name, label))
     `,
     // Add other minimal queries if needed, e.g., just fetching IDs or specific fields
   };

  /** Cache for STATIC CONFIG data only */
   private cache = {
     abilities: null as ConfigRow<'ability'>[] | null,
     skills: null as GameRules.Relationships.SkillWithAbility[] | null,
     classes: null as ConfigRow<'class'>[] | null,
     bonusTypes: null as ConfigRow<'bonus_type'>[] | null,
     // Add other truly static config like spell schools, components, etc.
   };

  /** Active real-time subscriptions */
  private activeSubscriptions: Map<string, RealtimeChannel> = new Map(); // Use Map for easier management

  constructor(private supabase: SupabaseClient<Database>) {}

  // --- Initial Data Loading ---

  /**
   * Fetches the necessary data for the initial load of a character sheet.
   * This should join essential definitions but avoid overly deep nesting where
   * realtime updates will handle subsequent changes.
   */
  async getInitialCharacterData(characterId: number): Promise<GameRules.Complete.Character | null> {
    logger.info(`Fetching initial data for character ID: ${characterId}`);
    try {
      const { data, error } = await this.supabase
        .from('game_character', { schema: 'features' })
        .select(this.queries.completeCharacterInitialLoad) // Use the specific initial load query
        .eq('id', characterId)
        .single();

      if (error) {
         if (error.code === 'PGRST116') { // Not found
           logger.warn(`No character found with ID ${characterId}`);
           return null;
         }
        throw error;
      }
      if (!data) return null;

      // TODO: Consider if any minimal post-processing is needed here,
      // e.g., resolving manifestation prerequisite names if not joined directly.
      // Keep it LIGHT, assembly happens client-side.

      logger.debug(`Initial data fetched successfully for character ID: ${characterId}`);
      return data as unknown as GameRules.Complete.Character; // Cast needed due to complex select
    } catch (err: any) {
       logger.error(`Failed to fetch initial character data for ID ${characterId}: ${err.message || err}`);
       return null;
    }
  }

  // --- Config Data Fetching (Cached) ---

  async getAllSkill(): Promise<GameRules.Relationships.SkillWithAbility[]> {
      if (!this.cache.skills) {
        logger.debug("Cache miss: Fetching all skills with abilities");
        const { data, error } = await this.supabase
          .from('skill', { schema: 'config' })
          .select('*, ability:config.ability(*)');
        if (error) { logger.error("Failed to fetch skills:", error); throw error; }
        this.cache.skills = (data || []) as GameRules.Relationships.SkillWithAbility[];
      }
      return this.cache.skills || [];
   }

   async getAllAbility(): Promise<ConfigRow<'ability'>[]> {
     if (!this.cache.abilities) {
        logger.debug("Cache miss: Fetching all abilities");
        const { data, error } = await this.supabase.from('ability', { schema: 'config' }).select('*');
        if (error) { logger.error("Failed to fetch abilities:", error); throw error; }
        this.cache.abilities = data || [];
     }
     return this.cache.abilities || [];
   }

   async getAllClass(): Promise<ConfigRow<'class'>[]> {
      if (!this.cache.classes) {
         logger.debug("Cache miss: Fetching all classes");
         const { data, error } = await this.supabase.from('class', { schema: 'config' }).select('*');
         if (error) { logger.error("Failed to fetch classes:", error); throw error; }
         this.cache.classes = data || [];
      }
      return this.cache.classes || [];
   }

   async getAllBonusType(): Promise<ConfigRow<'bonus_type'>[]> {
       if (!this.cache.bonusTypes) {
           logger.debug("Cache miss: Fetching all bonus types");
           const { data, error } = await this.supabase.from('bonus_type', { schema: 'config' }).select('*');
           if (error) { logger.error("Failed to fetch bonus types:", error); throw error; }
           this.cache.bonusTypes = data || [];
       }
       return this.cache.bonusTypes || [];
   }
   // ... add other simple config getters as needed ...

  // --- CRUD Operations (Targeted Updates) ---

  async updateCharacterHP(characterId: number, newHp: number): Promise<boolean> {
      logger.debug(`Updating HP for character ${characterId} to ${newHp}`);
      try {
        // Only update the specific field
        const { error, count } = await this.supabase
          .from('game_character', { schema: 'features' })
          .update({ current_hp: newHp }) // Let trigger handle updated_at
          .eq('id', characterId)
          .select({ count: 'exact' }); // Check if exactly one row was updated

        if (error) throw error;
        if (count !== 1) logger.warn(`Expected 1 row update for HP on char ${characterId}, but got ${count}`);
        return count === 1;
      } catch(err: any) {
        logger.error(`Failed to update HP for character ${characterId}: ${err.message || err}`);
        return false;
      }
  }

  async addCharacterSkillRank(
      characterId: number,
      skillId: number,
      level: number
  ): Promise<FeaturesRow<'game_character_skill_rank'> | null> {
      logger.debug(`Adding skill rank: char ${characterId}, skill ${skillId}, level ${level}`);
      try {
          const { data, error } = await this.supabase
              .from('game_character_skill_rank', { schema: 'features' })
              .insert({
                  game_character_id: characterId,
                  skill_id: skillId,
                  applied_at_level: level
              })
              .select()
              .single();

          if (error) {
               // Handle potential unique constraint violation gracefully
               if (error.code === '23505') { // unique_violation
                   logger.warn(`Skill rank already exists: char ${characterId}, skill ${skillId}, level ${level}`);
                   // Optionally fetch and return the existing rank if needed by UI
                   return null; // Or fetch existing
               }
               throw error;
          }
          return data;
      } catch (err: any) {
          logger.error(`Failed to add skill rank: ${err.message || err}`);
          return null;
      }
  }

  async removeCharacterSkillRank(
      characterId: number,
      skillId: number,
      level: number
  ): Promise<boolean> {
      logger.debug(`Removing skill rank: char ${characterId}, skill ${skillId}, level ${level}`);
      try {
          const { error, count } = await this.supabase
              .from('game_character_skill_rank', { schema: 'features' })
              .delete({ count: 'exact' })
              .match({
                  game_character_id: characterId,
                  skill_id: skillId,
                  applied_at_level: level
              });

          if (error) throw error;
          if (count === 0) logger.warn(`Attempted to delete non-existent skill rank: char ${characterId}, skill ${skillId}, level ${level}`);
          return count === 1;
      } catch (err: any) {
          // Don't throw for "not found" on delete
          logger.error(`Failed to remove skill rank: ${err.message || err}`);
          return false;
      }
  }

  async addCharacterFeat(
       characterId: number,
       featId: number,
       levelObtained: number | null = null // Make level optional
   ): Promise<FeaturesRow<'game_character_feat'> | null> {
       logger.debug(`Adding feat: char ${characterId}, feat ${featId}, level ${levelObtained}`);
       try {
           const { data, error } = await this.supabase
               .from('game_character_feat', { schema: 'features' })
               .insert({
                   game_character_id: characterId,
                   feat_id: featId,
                   level_obtained: levelObtained,
                   is_active: true // Default to active, can be toggled later
               })
               .select()
               .single();
           if (error) {
               if (error.code === '23505') { logger.warn(`Feat ${featId} already exists for char ${characterId}`); return null; }
               throw error;
           }
           return data;
       } catch (err: any) {
           logger.error(`Failed to add feat: ${err.message || err}`);
           return null;
       }
   }

   async removeCharacterFeat(characterFeatId: number): Promise<boolean> {
       logger.debug(`Removing character feat link ID: ${characterFeatId}`);
       try {
           const { error, count } = await this.supabase
               .from('game_character_feat', { schema: 'features' })
               .delete({ count: 'exact' })
               .eq('id', characterFeatId);
           if (error) throw error;
           if (count === 0) logger.warn(`Attempted to delete non-existent character feat link ID: ${characterFeatId}`);
           return count === 1;
       } catch (err: any) {
           logger.error(`Failed to remove feat link: ${err.message || err}`);
           return false;
       }
   }

   async toggleCharacterFeatActive(characterFeatId: number, isActive: boolean): Promise<boolean> {
       logger.debug(`Setting feat link ID ${characterFeatId} active status to ${isActive}`);
       try {
           const { error, count } = await this.supabase
               .from('game_character_feat', { schema: 'features' })
               .update({ is_active: isActive })
               .eq('id', characterFeatId)
               .select({ count: 'exact' });
           if (error) throw error;
           if (count !== 1) logger.warn(`Expected 1 row update for feat active toggle on ID ${characterFeatId}, but got ${count}`);
           return count === 1;
       } catch (err: any) {
           logger.error(`Failed to toggle feat active status: ${err.message || err}`);
           return false;
       }
   }

   // *** ADD MORE SPECIFIC CRUD operations as needed for other tables ***
   // (e.g., updateCorruptionManifestationActive, addEquipment, removeEquipment, addSpell, updateSpellPreparedUsed, etc.)

  // --- Realtime Watchers ---

  private watchTable<
       T extends GameRules.Callbacks.TableNames<S>,
       S extends keyof Database
   >(
       schema: S,
       table: T,
       callback: RealtimeCallback<T, S>,
       filter?: { eq?: { column: string, value: any } } // Optional filter
   ): RealtimeChannel {
       const channelName = `${String(schema)}_${String(table)}_${filter ? `${filter.eq?.column}_${filter.eq?.value}` : 'all'}`;
       // Check if already subscribed to this specific channel
       if (this.activeSubscriptions.has(channelName)) {
           logger.warn(`Already subscribed to channel: ${channelName}. Returning existing channel.`);
           return this.activeSubscriptions.get(channelName)!;
       }

       logger.debug(`Subscribing to channel: ${channelName}`);
       const channel = this.supabase.channel(channelName);

       channel.on<GameRules.Callbacks.RowType<S, T>>( // Use the specific Row type
               'postgres_changes',
               {
                   event: '*',
                   schema: String(schema),
                   table: String(table),
                   filter: filter?.eq ? `${filter.eq.column}=eq.${filter.eq.value}` : undefined
               },
               (payload) => {
                   // logger.debug(`Realtime payload received on ${channelName}:`, payload); // Can be verbose
                   const typedPayload = payload as RealtimePostgresChangesPayload<GameRules.Callbacks.RowType<S, T>>;
                   const eventType = typedPayload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                   // Use 'old' for DELETE, 'new' otherwise. Ensure row is not null before callback.
                   const row = eventType === 'DELETE' ? typedPayload.old : typedPayload.new;
                    if (row) {
                       callback(eventType, row);
                    } else {
                       logger.warn(`Received realtime event type ${eventType} without expected data for channel ${channelName}`);
                    }
               }
           )
           .subscribe((status, err) => {
               if (status === 'SUBSCRIBED') {
                   logger.info(`Successfully subscribed to ${channelName}`);
               } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                   logger.error(`Subscription error on ${channelName}: ${status}`, err);
                   // Implement retry logic or error handling here
               } else if (status === 'CLOSED') {
                   logger.info(`Subscription closed for ${channelName}`);
                   this.activeSubscriptions.delete(channelName); // Clean up map on close
               }
           });

       this.activeSubscriptions.set(channelName, channel); // Store the subscription
       return channel;
   }

  /** Unsubscribe from a specific channel */
  unsubscribe(channel: RealtimeChannel | null) {
      if (channel) {
          const channelName = channel.topic;
          logger.info(`Unsubscribing from channel: ${channelName}`);
          channel.unsubscribe()
            .then(status => logger.debug(`Unsubscribe status for ${channelName}: ${status}`))
            .catch(err => logger.error(`Error unsubscribing from ${channelName}:`, err))
            .finally(() => {
                this.activeSubscriptions.delete(channelName); // Clean up map
            });
      }
  }

  /** Unsubscribe from all currently active channels */
  stopAllWatchers(): void {
    logger.info(`Stopping all ${this.activeSubscriptions.size} watchers...`);
    this.activeSubscriptions.forEach((channel) => {
       this.unsubscribe(channel);
    });
    // Map should be cleared by individual unsubscribes, but clear just in case
    this.activeSubscriptions.clear();
  }

  // --- Specific Watcher Methods for Character Scope ---
  // These now include filtering by character ID for efficiency

   watchCharacterCore(characterId: number, callback: RealtimeCallback<'game_character', 'features'>) {
     return this.watchTable('features', 'game_character', callback, { eq: { column: 'id', value: characterId } });
   }
   watchCharacterSkillRanks(characterId: number, callback: RealtimeCallback<'game_character_skill_rank', 'features'>) {
     return this.watchTable('features', 'game_character_skill_rank', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
   watchCharacterAbilities(characterId: number, callback: RealtimeCallback<'game_character_ability', 'features'>) {
      return this.watchTable('features', 'game_character_ability', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
    watchCharacterFeats(characterId: number, callback: RealtimeCallback<'game_character_feat', 'features'>) {
      return this.watchTable('features', 'game_character_feat', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
   watchCharacterClasses(characterId: number, callback: RealtimeCallback<'game_character_class', 'features'>) {
       return this.watchTable('features', 'game_character_class', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
   watchCharacterClassFeatures(characterId: number, callback: RealtimeCallback<'game_character_class_feature', 'features'>) {
       return this.watchTable('features', 'game_character_class_feature', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
   watchCharacterCorruptions(characterId: number, callback: RealtimeCallback<'game_character_corruption', 'features'>) {
       return this.watchTable('features', 'game_character_corruption', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
   watchCharacterCorruptionManifestations(characterId: number, callback: RealtimeCallback<'game_character_corruption_manifestation', 'features'>) {
       return this.watchTable('features', 'game_character_corruption_manifestation', callback, { eq: { column: 'game_character_id', value: characterId } });
   }
    watchCharacterEquipment(characterId: number, callback: RealtimeCallback<'game_character_equipment', 'features'>) {
        return this.watchTable('features', 'game_character_equipment', callback, { eq: { column: 'game_character_id', value: characterId } });
    }
    watchCharacterArmor(characterId: number, callback: RealtimeCallback<'game_character_armor', 'features'>) {
        return this.watchTable('features', 'game_character_armor', callback, { eq: { column: 'game_character_id', value: characterId } });
    }
    watchCharacterWeapons(characterId: number, callback: RealtimeCallback<'game_character_weapon', 'features'>) {
        return this.watchTable('features', 'game_character_weapon', callback, { eq: { column: 'game_character_id', value: characterId } });
    }
    watchCharacterSpells(characterId: number, callback: RealtimeCallback<'game_character_spell', 'features'>) {
        return this.watchTable('features', 'game_character_spell', callback, { eq: { column: 'game_character_id', value: characterId } });
    }
   // ... Add specific, filtered watchers for ALL tables under `features` that start with `game_character_` ...
}

// Re-export the CompleteCharacter type for convenience from the API file
export type CompleteCharacter = GameRules.Complete.Character;
// Keep ProcessedClassFeature export ONLY if you still perform complex processing/derivation within this API layer.
// If assembly is purely client-side, this might not be needed here.
// export type ProcessedClassFeature = GameRules.Processed.ClassFeature;

