// FILE: src/lib/state/characterStore.svelte.ts
import { browser } from '$app/environment';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readable, type Readable } from 'svelte/store';

// ------------------------------------------------------
// Domain & DB imports
// ------------------------------------------------------
import {
    dbUpdateHP,
    dbToggleBuff,
    dbUpdateConsumable,
    dbUpdateBombs,
    dbUpdateSpellSlot,
    dbPrepareExtract,
    dbUseExtract,
    dbLoadBaseFeats,
    dbCreateBaseFeat,
    dbUpdateBaseFeat,
    dbRemoveBaseFeat,
    dbGetFeatsForCharacter,
    dbSaveCharacterFeat,
    dbRemoveCharacterFeat,
    dbLoadAllBuffs,
    dbUpdateABPBonus,
    dbEquipmentRemove,
    dbEquipmentSave,
    dbEquipmentToggle,
    dbCorruptionUpsert,
    dbCorruptionRemove,
    dbDiscoverySave,
    dbDiscoveryRemove,
    dbFavoredClassBonusSave,
    dbFavoredClassBonusRemove,
    dbAncestryLoadAll,
    dbAncestrySave,
    dbAncestryDelete,
    dbAncestralTraitsLoadAll,
    dbAttributesUpdate,
    dbSkillDataFetch,
    dbSkillSaveBase,
    dbSkillRemoveBase,
    dbSkillRanksDeleteByIds,
    dbSkillRanksUpsert,
    dbSaveClassFeature,
    dbDeleteClassFeature,
    dbAddBuff
} from '$lib/db';


	// ------------------------------------------------------
	// In-memory store for all Character objects
	// ------------------------------------------------------
	const characterRecords = $state(new Map<number, Character>());

	// ------------------------------------------------------
	// UpdateQueue for optimistic updates
	// ------------------------------------------------------
	interface QueueUpdate {
		key: string;
		execute: () => Promise<void>;
		optimisticUpdate: () => void;
		rollback: () => void;
	}

	class UpdateQueue {
		private status = $state<'idle' | 'processing' | 'error' | 'offline'>('idle');
		private pendingUpdates = $state(new Map<string, QueueUpdate>());

		constructor() {
			if (browser) {
				window.addEventListener('offline', () => {
					this.status = 'offline';
				});
				window.addEventListener('online', () => {
					this.status = this.pendingUpdates.size > 0 ? 'processing' : 'idle';
				});
			}
		}

		getStatus() {
			return this.status;
		}

		async enqueue(update: QueueUpdate): Promise<void> {
			// 1) Immediately apply optimistic update
			update.optimisticUpdate();

			// 2) Remove any existing update for the same key
			if (this.pendingUpdates.has(update.key)) {
				this.pendingUpdates.delete(update.key);
			}
			// 3) Add to pending
			this.pendingUpdates.set(update.key, update);
			this.status = 'processing';

			try {
				// 4) Execute the real DB operation
				await update.execute();
				this.pendingUpdates.delete(update.key);

				// 5) If we have no pending updates left => go idle
				if (this.pendingUpdates.size === 0) {
					this.status = 'idle';
				}
			} catch (err) {
				console.error('UpdateQueue error:', err);
				update.rollback();
				this.pendingUpdates.delete(update.key);
				this.status = 'error';
			}
		}
	}

	// We’ll store a single instance
	const updateQueue = new UpdateQueue();

	interface UpdateState {
		status: 'idle' | 'syncing' | 'error';
		error: Error | null;
	}

	/**
	 * Helper to wrap the queue logic in a neat call.
	 */
	async function executeUpdate({
		key,
		operation,
		optimisticUpdate,
		rollback
	}: {
		key: string;
		operation: () => Promise<void>;
		optimisticUpdate: () => void;
		rollback: () => void;
	}) {
		await updateQueue.enqueue({
			key,
			execute: operation,
			optimisticUpdate,
			rollback
		});
	}

	// ------------------------------------------------------
	// Create an empty fallback Character
	// ------------------------------------------------------
	function createEmptyCharacter(): Character {
		return {
			id: 0,
			user_id: '',
			name: '',
			ancestry: '',
			class: '',
			level: 1,
			current_hp: 0,
			max_hp: 0,
			created_at: null,
			updated_at: null,
			last_synced_at: null,
			is_offline: null,

			base_skills: [],
			character_skill_ranks: [],
			class_skill_relations: [],
			character_attributes: [],
			character_buffs: [],
			character_combat_stats: [],
			character_consumables: [],
			character_spell_slots: [],
			character_known_spells: [],
			character_class_features: [],
			character_discoveries: [],
			character_favored_class_bonuses: [],
			character_equipment: [],
			character_feats: [],
			character_extracts: [],
			character_corruption_manifestations: [],
			character_corruptions: [],
			character_traits: [],
			character_ancestries: [],
			character_ancestral_traits: [],
			archetype: null
		};
	}

	// ------------------------------------------------------
	// Core store methods
	// ------------------------------------------------------

	/** Initialize or update a character in memory. */
	function initializeCharacter(c: Character) {
		if (!c || !c.id) {
			console.error('Invalid character passed to initializeCharacter:', c);
			return;
		}
		if (characterRecords.has(c.id)) {
			// If it already exists, just merge
			const existing = characterRecords.get(c.id)!;
			Object.assign(existing, c);
		} else {
			// If it's new, create a reactive copy
			const reactiveChar = $state({
				...createEmptyCharacter(),
				...c
			});
			characterRecords.set(c.id, reactiveChar);
		}
	}

	/** Remove a character from memory by ID. */
	function cleanupCharacter(characterId: number) {
		characterRecords.delete(characterId);
	}

	/** Retrieve a character by ID, or an empty fallback if not found. */
	function getCharacter(characterId: number): Character {
		return characterRecords.get(characterId) ?? createEmptyCharacter();
	}

	// ------------------------------------------------------
	// HP management
	// ------------------------------------------------------
	async function setHP(characterId: number, newHP: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const prevHP = char.current_hp;
		char.current_hp = newHP;

		await updateQueue.enqueue({
			key: `hp-${characterId}`,
			async execute() {
				await dbUpdateHP(characterId, newHP);
			},
			optimisticUpdate() {},
			rollback() {
				char.current_hp = prevHP;
			}
		});
	}

	// ------------------------------------------------------
	// Buff management
	// ------------------------------------------------------
	async function toggleBuff(characterId: number, buffType: KnownBuffType) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const buff = char.character_buffs?.find((b) => b.buff_type === buffType);
		if (!buff) return;

		const wasActive = buff.is_active ?? false;
		buff.is_active = !wasActive;

		await executeUpdate({
			key: `buff-${characterId}-${buffType}`,
			async operation() {
				await dbToggleBuff(characterId, buffType, !wasActive);
			},
			optimisticUpdate() {},
			rollback() {
				buff.is_active = wasActive;
			}
		});
	}

	// ------------------------------------------------------
	// Consumables
	// ------------------------------------------------------
	async function updateConsumable(characterId: number, key: ConsumableKey, amount: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const row = char.character_consumables?.[0];
		if (!row) return;

		const prevVal = row[key];
		row[key] = amount;

		await executeUpdate({
			key: `consumable-${characterId}-${key}`,
			async operation() {
				await dbUpdateConsumable(characterId, key, amount);
			},
			optimisticUpdate() {},
			rollback() {
				row[key] = prevVal;
			}
		});
	}

	// ------------------------------------------------------
	// Bombs / Resource Management
	// ------------------------------------------------------
	async function updateBombs(characterId: number, newCount: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const combatRow = char.character_combat_stats?.[0];
		if (!combatRow) return;

		const prevVal = combatRow.bombs_left;
		combatRow.bombs_left = newCount;

		await executeUpdate({
			key: `bombs-${characterId}`,
			async operation() {
				await dbUpdateBombs(characterId, newCount);
			},
			optimisticUpdate() {},
			rollback() {
				combatRow.bombs_left = prevVal;
			}
		});
	}

	// ------------------------------------------------------
	// Spell Slots
	// ------------------------------------------------------
	async function setSpellSlotRemaining(characterId: number, spellLevel: number, remaining: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const slot = char.character_spell_slots?.find((s) => s.spell_level === spellLevel);
		if (!slot) return;

		const prevVal = slot.remaining;
		slot.remaining = remaining;

		await executeUpdate({
			key: `spell-slot-${characterId}-${spellLevel}`,
			async operation() {
				await dbUpdateSpellSlot(characterId, spellLevel, remaining);
			},
			optimisticUpdate() {},
			rollback() {
				slot.remaining = prevVal;
			}
		});
	}

	// ------------------------------------------------------
	// Extracts
	// ------------------------------------------------------
	async function prepareExtract(characterId: number, extractId: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;
		const ext = char.character_extracts?.find((e) => e.id === extractId);
		if (!ext) return;

		const prevPrepared = ext.prepared ?? 0;
		ext.prepared = 1;

		await executeUpdate({
			key: `extract-prepare-${characterId}-${extractId}`,
			async operation() {
				await dbPrepareExtract(characterId, extractId);
			},
			optimisticUpdate() {},
			rollback() {
				ext.prepared = prevPrepared;
			}
		});
	}

	async function useExtract(characterId: number, extractId: number) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;
		const ext = char.character_extracts?.find((e) => e.id === extractId);
		if (!ext) return;

		const prevUsed = ext.used ?? 0;
		ext.used = 1;

		await executeUpdate({
			key: `extract-use-${characterId}-${extractId}`,
			async operation() {
				await dbUseExtract(characterId, extractId);
			},
			optimisticUpdate() {},
			rollback() {
				ext.used = prevUsed;
			}
		});
	}

	// ------------------------------------------------------
	// Feats
	// ------------------------------------------------------
	async function loadAllBaseFeats() {
		return dbLoadBaseFeats();
	}

	async function createBaseFeat(featData: any) {
		await dbCreateBaseFeat(featData);
		// Optionally store or refresh local states
	}

	async function updateBaseFeat(featId: number, data: any) {
		await dbUpdateBaseFeat(featId, data);
	}

	async function deleteBaseFeat(featId: number) {
		await dbRemoveBaseFeat(featId);
	}

	async function loadCharacterFeats(characterId: number) {
		return dbGetFeatsForCharacter(characterId, false);
	}

	/**
	 * Save (create or update) a character feat with optimistic approach
	 */
	async function saveCharacterFeat(characterId: number, featPayload: any) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		if (!char.character_feats) {
			char.character_feats = [];
		}

		const isNew = !featPayload.id;
		const backup = [...char.character_feats];
		let tempFeat: DatabaseCharacterFeat | null = null;

		if (isNew) {
			// Create a local temp
			tempFeat = {
				...featPayload,
				id: -Math.random(),
				character_id: characterId,
				base_feat_id: featPayload.base_feat_id ?? null,
				selected_level: featPayload.selected_level ?? 1,
				sync_status: 'pending',
				properties: featPayload.properties ?? null,
				updated_at: new Date().toISOString()
			};
			char.character_feats.push(tempFeat);
		}

		await executeUpdate({
			key: `charFeat-${characterId}-${featPayload.id ?? 'new'}`,
			async operation() {
				const saved = await dbSaveCharacterFeat(featPayload); // returns the real row
				// Replace or update in local store
				if (isNew && tempFeat) {
					const idx = char.character_feats.findIndex((f) => f.id === tempFeat?.id);
					if (idx >= 0) {
						char.character_feats[idx] = saved;
					}
				} else {
					// update existing
					const idx2 = char.character_feats.findIndex((f) => f.id === featPayload.id);
					if (idx2 >= 0) {
						char.character_feats[idx2] = saved;
					}
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_feats = backup;
			}
		});
	}

	/**
	 * Remove an existing character feat by ID
	 */
	async function removeCharacterFeat(characterId: number, charFeatId: number) {
		const char = getCharacter(characterId);
		if (!char.character_feats) return;

		const backup = [...char.character_feats];
		char.character_feats = char.character_feats.filter((f) => f.id !== charFeatId);

		await executeUpdate({
			key: `charFeat-del-${characterId}-${charFeatId}`,
			async operation() {
				await dbRemoveCharacterFeat(charFeatId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_feats = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Equipment
	// ------------------------------------------------------
	async function saveEquipment(characterId: number, eqData: any) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;
		const isUpdate = !!eqData.id;

		let prevEquipment = char.character_equipment ?? [];
		let backup = [...prevEquipment];

		if (!char.character_equipment) {
			char.character_equipment = [];
		}

		let tempItem: DatabaseCharacterEquipment | undefined;

		if (!isUpdate) {
			// new
			tempItem = {
				...eqData,
				id: -Math.random(),
				character_id: characterId
			};
			char.character_equipment.push(tempItem);
		}

		await executeUpdate({
			key: `equip-${characterId}-${eqData.id ?? 'new'}`,
			async operation() {
				const saved = await dbEquipmentSave(eqData);
				if (isUpdate) {
					const idx = char.character_equipment.findIndex((e) => e.id === eqData.id);
					if (idx >= 0) {
						char.character_equipment[idx] = saved;
					}
				} else if (tempItem) {
					const idxTemp = char.character_equipment.findIndex((e) => e.id === tempItem!.id);
					if (idxTemp >= 0) {
						char.character_equipment[idxTemp] = saved;
					}
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_equipment = backup;
			}
		});
	}

	async function deleteEquipment(characterId: number, eqId: number) {
		const char = getCharacter(characterId);
		if (!char.character_equipment) return;
		const backup = [...char.character_equipment];

		char.character_equipment = char.character_equipment.filter((e) => e.id !== eqId);

		await executeUpdate({
			key: `equip-del-${characterId}-${eqId}`,
			async operation() {
				await dbEquipmentRemove(eqId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_equipment = backup;
			}
		});
	}

	async function toggleEquipment(characterId: number, eqId: number) {
		const char = getCharacter(characterId);
		if (!char.character_equipment) return;
		const item = char.character_equipment.find((x) => x.id === eqId);
		if (!item) return;

		const wasEquipped = item.equipped ?? false;
		item.equipped = !wasEquipped;

		await executeUpdate({
			key: `equip-toggle-${characterId}-${eqId}`,
			async operation() {
				await dbEquipmentToggle(eqId, !wasEquipped);
			},
			optimisticUpdate() {},
			rollback() {
				item.equipped = wasEquipped;
			}
		});
	}

	// ------------------------------------------------------
	// Corruptions
	// ------------------------------------------------------
	async function saveCorruption(characterId: number, corruptionData: any) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		const backup = [...(char.character_corruptions ?? [])];
		if (!char.character_corruptions) {
			char.character_corruptions = [];
		}

		const isNew = !corruptionData.id;
		let tempCorruption: DatabaseCharacterCorruption | undefined;

		if (isNew) {
			tempCorruption = {
				...corruptionData,
				id: -Math.random(),
				character_id: characterId
			};
			char.character_corruptions.push(tempCorruption);
		}

		await executeUpdate({
			key: `corruption-${characterId}-${corruptionData.id ?? 'new'}`,
			async operation() {
				const saved = await dbCorruptionUpsert(corruptionData);
				if (isNew && tempCorruption) {
					const idx = char.character_corruptions.findIndex((c) => c.id === tempCorruption?.id);
					if (idx >= 0) char.character_corruptions[idx] = saved;
				} else {
					const idx2 = char.character_corruptions.findIndex((c) => c.id === corruptionData.id);
					if (idx2 >= 0) char.character_corruptions[idx2] = saved;
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_corruptions = backup;
			}
		});
	}

	async function deleteCorruption(characterId: number, corruptionId: number) {
		const char = getCharacter(characterId);
		if (!char.character_corruptions) return;
		const backup = [...char.character_corruptions];

		char.character_corruptions = char.character_corruptions.filter((c) => c.id !== corruptionId);

		await executeUpdate({
			key: `corruption-del-${characterId}-${corruptionId}`,
			async operation() {
				await dbCorruptionRemove(corruptionId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_corruptions = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Discoveries
	// ------------------------------------------------------
	async function saveDiscovery(characterId: number, discoveryData: any) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		if (!char.character_discoveries) {
			char.character_discoveries = [];
		}
		const isNew = !discoveryData.id;
		const backup = [...char.character_discoveries];

		let tempDisc: DatabaseCharacterDiscovery | null = null;
		if (isNew) {
			tempDisc = {
				...discoveryData,
				id: -Math.random(),
				character_id: characterId
			};
			char.character_discoveries.push(tempDisc);
		}

		await executeUpdate({
			key: `discovery-${characterId}-${discoveryData.id ?? 'new'}`,
			async operation() {
				const saved = await dbDiscoverySave(discoveryData);
				if (isNew && tempDisc) {
					const idx = char.character_discoveries.findIndex((d) => d.id === tempDisc?.id);
					if (idx >= 0) char.character_discoveries[idx] = saved;
				} else {
					const idx2 = char.character_discoveries.findIndex((d) => d.id === discoveryData.id);
					if (idx2 >= 0) char.character_discoveries[idx2] = saved;
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_discoveries = backup;
			}
		});
	}

	async function deleteDiscovery(characterId: number, discoveryId: number) {
		const char = getCharacter(characterId);
		if (!char.character_discoveries) return;

		const backup = [...char.character_discoveries];
		char.character_discoveries = char.character_discoveries.filter((d) => d.id !== discoveryId);

		await executeUpdate({
			key: `discovery-del-${characterId}-${discoveryId}`,
			async operation() {
				await dbDiscoveryRemove(discoveryId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_discoveries = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Favored Class Bonuses
	// ------------------------------------------------------
	async function saveFavoredClassBonus(characterId: number, fcbData: any) {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		let backup = [...(char.character_favored_class_bonuses ?? [])];
		if (!char.character_favored_class_bonuses) {
			char.character_favored_class_bonuses = [];
		}

		const isNew = !fcbData.id;
		let tempFcb: any; // or a typed object, if you like

		if (isNew) {
			tempFcb = {
				...fcbData,
				id: -Math.random(),
				character_id: characterId
			};
			char.character_favored_class_bonuses.push(tempFcb);
		}

		await executeUpdate({
			key: `fcb-${characterId}-${fcbData.id ?? 'new'}`,
			async operation() {
				const saved = await dbFavoredClassBonusSave(fcbData);
				if (isNew && tempFcb) {
					const idx = char.character_favored_class_bonuses.findIndex((f) => f.id === tempFcb.id);
					if (idx >= 0) char.character_favored_class_bonuses[idx] = saved;
				} else {
					const idx2 = char.character_favored_class_bonuses.findIndex((f) => f.id === fcbData.id);
					if (idx2 >= 0) char.character_favored_class_bonuses[idx2] = saved;
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_favored_class_bonuses = backup;
			}
		});
	}

	async function deleteFavoredClassBonus(characterId: number, fcbId: number) {
		const char = getCharacter(characterId);
		if (!char.character_favored_class_bonuses) return;
		const backup = [...char.character_favored_class_bonuses];

		char.character_favored_class_bonuses = char.character_favored_class_bonuses.filter((f) => f.id !== fcbId);

		await executeUpdate({
			key: `fcb-del-${characterId}-${fcbId}`,
			async operation() {
				await dbFavoredClassBonusRemove(fcbId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_favored_class_bonuses = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Ancestry
	// ------------------------------------------------------
	async function loadAllAncestries() {
		return dbAncestryLoadAll();
	}

	async function saveAncestry(characterId: number, ancestryData: any) {
		await dbAncestrySave(ancestryData);
	}

	async function deleteAncestry(ancestryId: number) {
		await dbAncestryDelete(ancestryId);
	}

	async function loadAncestralTraits() {
		return dbAncestralTraitsLoadAll();
	}

	// ------------------------------------------------------
	// Attributes
	// ------------------------------------------------------
	async function updateCharacterAttributes(characterId: number, newAttributes: Record<string, number>) {
		const char = getCharacter(characterId);
		if (!char.character_attributes) return;
		const row = char.character_attributes[0];
		if (!row) return;

		const oldValues = { ...row };
		Object.entries(newAttributes).forEach(([key, val]) => {
			(row as any)[key] = val;
		});

		await executeUpdate({
			key: `attrs-${characterId}`,
			async operation() {
				await dbAttributesUpdate(characterId, newAttributes);
			},
			optimisticUpdate() {},
			rollback() {
				Object.assign(row, oldValues);
			}
		});
	}

	// ------------------------------------------------------
	// Skills & skill ranks
	// ------------------------------------------------------
	async function fetchSkillData(characterId: number) {
		await dbSkillDataFetch(characterId);
	}

	async function saveBaseSkill(characterId: number, skillData: any) {
		await dbSkillSaveBase(skillData);
		// optionally store in local state
	}

	async function removeBaseSkill(characterId: number, skillId: number) {
		await dbSkillRemoveBase(skillId);
		// optionally remove from local state
	}

	async function deleteSkillRanksByIds(rankIds: number[]) {
		await dbSkillRanksDeleteByIds(rankIds);
	}

	async function upsertSkillRanks(ranks: any[]) {
		const saved = await dbSkillRanksUpsert(ranks);
		return saved;
	}

	// ------------------------------------------------------
	// Class Features
	// ------------------------------------------------------
	async function saveClassFeature(characterId: number, featureData: any) {
		const char = getCharacter(characterId);
		if (!char.character_class_features) {
			char.character_class_features = [];
		}
		const isNew = !featureData.id;
		const backup = [...char.character_class_features];
		let tmp: DBClassFeature | undefined;

		if (isNew) {
			tmp = {
				...featureData,
				id: -Math.random(),
				character_id: characterId
			};
			char.character_class_features.push(tmp);
		}

		await executeUpdate({
			key: `classFeature-${characterId}-${featureData.id ?? 'new'}`,
			async operation() {
				const saved = await dbSaveClassFeature(featureData, featureData.id);
				if (isNew && tmp) {
					const idx = char.character_class_features.findIndex((cf) => cf.id === tmp!.id);
					if (idx >= 0) char.character_class_features[idx] = saved;
				} else {
					const idx2 = char.character_class_features.findIndex((cf) => cf.id === featureData.id);
					if (idx2 >= 0) char.character_class_features[idx2] = saved;
				}
			},
			optimisticUpdate() {},
			rollback() {
				char.character_class_features = backup;
			}
		});
	}

	async function removeClassFeature(characterId: number, featureId: number) {
		const char = getCharacter(characterId);
		if (!char.character_class_features) return;
		const backup = [...char.character_class_features];

		char.character_class_features = char.character_class_features.filter((f) => f.id !== featureId);

		await executeUpdate({
			key: `classFeature-del-${characterId}-${featureId}`,
			async operation() {
				await dbDeleteClassFeature(featureId);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_class_features = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Real-time watchers
	// ------------------------------------------------------
	function watchCharacter(characterId: number): Readable<Character> {
		return readable(getCharacter(characterId), (set) => {
			// Update the store whenever the character changes in our Map
			const interval = setInterval(() => {
				set(getCharacter(characterId));
			}, 100); // Poll every 100ms

			return () => clearInterval(interval);
		});
	}

	function watchBuffs(characterId: number): Readable<CharacterBuff[]> {
		return readable(getCharacter(characterId).character_buffs ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_buffs ?? []);
			}, 100);

			return () => clearInterval(interval);
		});
	}

	// ------------------------------------------------------
	// Additional CRUD Operations
	// ------------------------------------------------------
	function listAllCharacters(): Character[] {
		return Array.from(characterRecords.values());
	}

	async function addBuff(characterId: number, buffType: KnownBuffType): Promise<void> {
		const char = getCharacter(characterId);
		if (char.id === 0) return;

		if (!char.character_buffs) {
			char.character_buffs = [];
		}

		const newBuff = {
			character_id: characterId,
			buff_type: buffType,
			is_active: false
		};

		const backup = [...char.character_buffs];
		char.character_buffs.push(newBuff);

		await executeUpdate({
			key: `buff-add-${characterId}-${buffType}`,
			async operation() {
				// Assuming you have a DB function for this
				await dbAddBuff(characterId, buffType);
			},
			optimisticUpdate() {},
			rollback() {
				char.character_buffs = backup;
			}
		});
	}

	// ------------------------------------------------------
	// Network Status & Queue Management
	// ------------------------------------------------------
	function getUpdateQueueStatus(): 'idle' | 'processing' | 'error' | 'offline' {
		return updateQueue.getStatus();
	}

	async function retryPendingUpdates(): Promise<void> {
		// Implementation depends on how you want to handle retries
		// This is just a basic example
		const status = updateQueue.getStatus();
		if (status === 'error') {
			// Reset status and try again
			updateQueue['status'] = 'processing';
			// ... implement retry logic ...
		}
	}

	function watchCombatStats(characterId: number): Readable<any> {
		return readable(getCharacter(characterId).character_combat_stats?.[0] ?? null, (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_combat_stats?.[0] ?? null);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchConsumables(characterId: number): Readable<DatabaseCharacterConsumable[]> {
		return readable(getCharacter(characterId).character_consumables ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_consumables ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchCharacterFeats(characterId: number): Readable<DatabaseCharacterFeat[]> {
		return readable(getCharacter(characterId).character_feats ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_feats ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchClassFeatures(characterId: number): Readable<DBClassFeature[]> {
		return readable(getCharacter(characterId).character_class_features ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_class_features ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchDiscoveries(characterId: number): Readable<DatabaseCharacterDiscovery[]> {
		return readable(getCharacter(characterId).character_discoveries ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_discoveries ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchCharacterAncestries(characterId: number): Readable<any[]> {
		return readable(getCharacter(characterId).character_ancestries ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_ancestries ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchCharacterTraits(characterId: number): Readable<any[]> {
		return readable(getCharacter(characterId).character_traits ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_traits ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchCharacterAttributes(characterId: number): Readable<any> {
		return readable(getCharacter(characterId).character_attributes?.[0] ?? null, (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_attributes?.[0] ?? null);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchCorruptionsForCharacter(characterId: number): Readable<DatabaseCharacterCorruption[]> {
		return readable(getCharacter(characterId).character_corruptions ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_corruptions ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchKnownSpells(characterId: number): Readable<any[]> {
		return readable(getCharacter(characterId).character_known_spells ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_known_spells ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchExtracts(characterId: number): Readable<any[]> {
		return readable(getCharacter(characterId).character_extracts ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_extracts ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchFavoredClassBonuses(characterId: number): Readable<any[]> {
		return readable(getCharacter(characterId).character_favored_class_bonuses ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_favored_class_bonuses ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchSpellSlots(characterId: number): Readable<DatabaseCharacterSpellSlot[]> {
		return readable(getCharacter(characterId).character_spell_slots ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_spell_slots ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	function watchEquipmentForCharacter(characterId: number): Readable<DatabaseCharacterEquipment[]> {
		return readable(getCharacter(characterId).character_equipment ?? [], (set) => {
			const interval = setInterval(() => {
				set(getCharacter(characterId).character_equipment ?? []);
			}, 100);
			return () => clearInterval(interval);
		});
	}

	// ... existing code ...

async function updateABPBonus(characterId: number, bonusType: string, newValue: number) {
    const char = getCharacter(characterId);
    if (char.id === 0) return;

    // You'll need to adjust this based on your actual data structure
    const abpBonus = char.character_abp_bonuses?.find(b => b.bonus_type === bonusType);
    if (!abpBonus) return;

    const prevValue = abpBonus.value;
    abpBonus.value = newValue;

    await executeUpdate({
        key: `abp-${characterId}-${bonusType}`,
        async operation() {
            await dbUpdateABPBonus(characterId, bonusType, newValue);
        },
        optimisticUpdate() {},
        rollback() {
            abpBonus.value = prevValue;
        }
    });
}

async function updateAttribute(
    characterId: number, 
    attrKey: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', 
    newValue: number
) {
    const char = getCharacter(characterId);
    if (!char.character_attributes?.[0]) return;

    const attrs = char.character_attributes[0];
    const prevValue = attrs[attrKey];
    attrs[attrKey] = newValue;

    await executeUpdate({
        key: `attr-${characterId}-${attrKey}`,
        async operation() {
            await dbAttributesUpdate(characterId, { [attrKey]: newValue });
        },
        optimisticUpdate() {},
        rollback() {
            attrs[attrKey] = prevValue;
        }
    });
}

async function saveSpellSlot(characterId: number, slotData: Partial<DatabaseCharacterSpellSlot>) {
    const char = getCharacter(characterId);
    if (char.id === 0) return;

    if (!char.character_spell_slots) {
        char.character_spell_slots = [];
    }

    const isNew = !slotData.id;
    const backup = [...char.character_spell_slots];
    let tempSlot: any;

    if (isNew) {
        tempSlot = {
            ...slotData,
            id: -Math.random(),
            character_id: characterId
        };
        char.character_spell_slots.push(tempSlot);
    }

    await executeUpdate({
        key: `spell-slot-${characterId}-${slotData.id ?? 'new'}`,
        async operation() {
            const saved = await dbSaveSpellSlot(slotData);
            if (isNew && tempSlot) {
                const idx = char.character_spell_slots.findIndex(s => s.id === tempSlot.id);
                if (idx >= 0) char.character_spell_slots[idx] = saved;
            } else {
                const idx = char.character_spell_slots.findIndex(s => s.id === slotData.id);
                if (idx >= 0) char.character_spell_slots[idx] = saved;
            }
        },
        optimisticUpdate() {},
        rollback() {
            char.character_spell_slots = backup;
        }
    });
}

async function removeSpellSlot(characterId: number, slotId: number) {
    const char = getCharacter(characterId);
    if (!char.character_spell_slots) return;

    const backup = [...char.character_spell_slots];
    char.character_spell_slots = char.character_spell_slots.filter(s => s.id !== slotId);

    await executeUpdate({
        key: `spell-slot-del-${characterId}-${slotId}`,
        async operation() {
            await dbRemoveSpellSlot(slotId);
        },
        optimisticUpdate() {},
        rollback() {
            char.character_spell_slots = backup;
        }
    });
}

async function saveKnownSpell(characterId: number, spellData: any) {
    const char = getCharacter(characterId);
    if (char.id === 0) return;

    if (!char.character_known_spells) {
        char.character_known_spells = [];
    }

    const isNew = !spellData.id;
    const backup = [...char.character_known_spells];
    let tempSpell: any;

    if (isNew) {
        tempSpell = {
            ...spellData,
            id: -Math.random(),
            character_id: characterId
        };
        char.character_known_spells.push(tempSpell);
    }

    await executeUpdate({
        key: `known-spell-${characterId}-${spellData.id ?? 'new'}`,
        async operation() {
            const saved = await dbSaveKnownSpell(spellData);
            if (isNew && tempSpell) {
                const idx = char.character_known_spells.findIndex(s => s.id === tempSpell.id);
                if (idx >= 0) char.character_known_spells[idx] = saved;
            } else {
                const idx = char.character_known_spells.findIndex(s => s.id === spellData.id);
                if (idx >= 0) char.character_known_spells[idx] = saved;
            }
        },
        optimisticUpdate() {},
        rollback() {
            char.character_known_spells = backup;
        }
    });
}

async function removeKnownSpell(characterId: number, spellId: number) {
    const char = getCharacter(characterId);
    if (!char.character_known_spells) return;

    const backup = [...char.character_known_spells];
    char.character_known_spells = char.character_known_spells.filter(s => s.id !== spellId);

    await executeUpdate({
        key: `known-spell-del-${characterId}-${spellId}`,
        async operation() {
            await dbRemoveKnownSpell(spellId);
        },
        optimisticUpdate() {},
        rollback() {
            char.character_known_spells = backup;
        }
    });
}
	// ------------------------------------------------------
	// Exports
	// ------------------------------------------------------
	export {
		// Classes / types
		UpdateQueue,
		updateQueue,
		type QueueUpdate,
		type UpdateState,

		// Methods
		initializeCharacter,
		cleanupCharacter,
		getCharacter,

		setHP,
		toggleBuff,
		updateConsumable,
		updateBombs,
		setSpellSlotRemaining,
		prepareExtract,
		useExtract,

		loadAllBaseFeats,
		createBaseFeat,
		updateBaseFeat,
		deleteBaseFeat,
		loadCharacterFeats,
		saveCharacterFeat,
		removeCharacterFeat,

		saveEquipment,
		deleteEquipment,
		toggleEquipment,

		saveCorruption,
		deleteCorruption,

		saveDiscovery,
		deleteDiscovery,

		saveFavoredClassBonus,
		deleteFavoredClassBonus,

		loadAllAncestries,
		saveAncestry,
		deleteAncestry,
		loadAncestralTraits,

		updateCharacterAttributes,

		fetchSkillData,
		saveBaseSkill,
		removeBaseSkill,
		deleteSkillRanksByIds,
		upsertSkillRanks,

		saveClassFeature,
		removeClassFeature,

		executeUpdate, // helper

		// New exports
		watchCharacter,
		watchBuffs,
		listAllCharacters,
		addBuff,
		getUpdateQueueStatus,
		retryPendingUpdates,
		watchSpellSlots,
		watchEquipmentForCharacter,
		watchCombatStats,
		watchConsumables,
		watchCharacterFeats,
		watchClassFeatures,
		watchDiscoveries,
		watchCharacterAncestries,
		watchCharacterTraits,
		watchCharacterAttributes,
		watchCorruptionsForCharacter,
		watchKnownSpells,
		watchExtracts,
		watchFavoredClassBonuses,
		updateABPBonus,
		updateAttribute,
		saveSpellSlot,
		removeSpellSlot,
		saveKnownSpell,
		removeKnownSpell
	};