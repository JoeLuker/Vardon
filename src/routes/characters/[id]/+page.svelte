<!-- FILE: src/routes/characters/[id]/+page.svelte -->
<script lang="ts">
	// SvelteKit & Svelte 5
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';

	// Types
	import type { PageData } from './$types';
	import type { ValueWithBreakdown, EnrichedCharacter } from '$lib/domain/characterCalculations';
	import type { CompleteCharacter } from '$lib/db/gameRules.api';

	// Child components
	import CharacterHeader from '$lib/ui/CharacterHeader.svelte';
	import HPTracker from '$lib/ui/HPTracker.svelte';
	import AbilityScores from '$lib/ui/AbilityScores.svelte';
	import Skills from '$lib/ui/Skills.svelte';
	import Saves from '$lib/ui/Saves.svelte';
	import CombatStats from '$lib/ui/CombatStats.svelte';
	import ACStats from '$lib/ui/ACStats.svelte';
	import ClassFeatures from '$lib/ui/ClassFeatures.svelte';
	import Feats from '$lib/ui/Feats.svelte';
	import Spells from '$lib/ui/Spells.svelte';
	import SpellSlots from '$lib/ui/SpellSlots.svelte';
	import Corruptions from '$lib/ui/Corruptions.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import * as Sheet from '$lib/components/ui/sheet';

	// Game Rules API
	import { GameRulesAPI, supabase } from '$lib/db';

	// Props from the load function
	let { data } = $props<{ data: PageData }>();

	// Create GameRules instance
	const gameRules = new GameRulesAPI(supabase);

	// Svelte 5 runic state for reactivity
	let rawCharacter = $state<CompleteCharacter | null>(null);
	let character = $state<EnrichedCharacter | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	
	// Track pending skill updates to prevent double application
	let pendingSkillUpdates = $state(new Set<string>());

	// ----- NEW UNIFIED STATE FOR SKILLS OPTIMISTIC UI -----
	// Timing constants
	const DEBOUNCE_MS = 200; // Reduce from 400ms to 200ms for faster response
	const OPERATION_TIMEOUT_MS = 10000; // 10 seconds timeout
	const ERROR_TIMEOUT_MS = 3000; // 3 seconds for errors
	
	// Maps to track optimistic state for Skills component
	let pendingOperations = $state(new Map<string, { type: 'add' | 'remove', timestamp: number }>());
	let operationErrors = $state(new Map<string, { message: string, expiresAt: number }>());
	let optimisticRanks = $state(new Map<string, boolean>());
	let optimisticPoints = $state(new Map<number, number>());
	
	// Single source of truth for skill ranks - populated on character load
	let serverSkillRanks = $state(new Map<string, { id: number, skillId: number, level: number }>());

	// Function to get skill-level key (same format as in Skills component)
	function getSkillLevelKey(skillId: number, level: number): string {
		return `${skillId}-${level}`;
	}

	// Function to get operation key
	function getOperationKey(skillId: number, level: number, type: 'add' | 'remove'): string {
		return `${skillId}-${level}-${type}`;
	}
	
	// Function to check if an operation is pending for a skill rank
	function isOperationPending(skillId: number, level: number): boolean {
		const key = getSkillLevelKey(skillId, level);
		const isPending = pendingOperations.has(key);
		const isUpdating = skillUpdateTimers[key]?.updating || false;
		return isPending || isUpdating;
	}
	
	// Function to clean up expired errors
	function cleanupExpiredErrors() {
		const now = Date.now();
		let hasChanges = false;
		let newOperationErrors = operationErrors;
		
		for (const [key, error] of operationErrors.entries()) {
			if (now > error.expiresAt) {
				if (newOperationErrors === operationErrors) {
					newOperationErrors = new Map(operationErrors);
				}
				newOperationErrors.delete(key);
				hasChanges = true;
			}
		}
		
		if (hasChanges) {
			operationErrors = newOperationErrors;
		}
		
		return hasChanges;
	}
	
	// Function to sync server skill ranks with local cache
	function syncServerSkillRanks() {
		if (!character?.game_character_skill_rank) return;
		
		// Clear the existing map
		serverSkillRanks.clear();
		
		// Populate from character data
		for (const rank of character.game_character_skill_rank) {
			const key = getSkillLevelKey(rank.skill_id, rank.applied_at_level);
			serverSkillRanks.set(key, { 
				id: rank.id, 
				skillId: rank.skill_id, 
				level: rank.applied_at_level 
			});
		}
		
		console.log('Synced server skill ranks:', Object.fromEntries(serverSkillRanks));
	}
	
	// Setup periodic cleanup
	$effect(() => {
		// Clean up expired errors every second
		const errorCleanupInterval = setInterval(() => {
			cleanupExpiredErrors();
		}, 1000);
		
		// Clean up stale operations every 5 seconds
		const operationCleanupInterval = setInterval(() => {
			const now = Date.now();
			let hasChanges = false;
			
			for (const [key, operation] of pendingOperations.entries()) {
				if (now - operation.timestamp > OPERATION_TIMEOUT_MS) {
					console.log(`Operation timed out: ${key}`);
					pendingOperations.delete(key);
					
					// Add error for this operation
					const [skillId, level] = key.split('-').map(Number);
					if (!isNaN(skillId) && !isNaN(level)) {
						const skillLevelKey = getSkillLevelKey(skillId, level);
						operationErrors.set(skillLevelKey, {
							message: "Operation timed out. Please try again.",
							expiresAt: now + ERROR_TIMEOUT_MS
						});
					}
					
					hasChanges = true;
				}
			}
			
			return hasChanges;
		}, 5000);
		
		return () => {
			clearInterval(errorCleanupInterval);
			clearInterval(operationCleanupInterval);
		};
	});
	
	// Reset optimistic state when character changes
	$effect(() => {
		if (character?.id) {
			pendingOperations.clear();
			operationErrors.clear();
			optimisticRanks.clear();
			optimisticPoints.clear();
			
			// Sync server skill ranks whenever character data changes
			syncServerSkillRanks();
		}
	});
	// ----- END NEW UNIFIED STATE -----

	// Track debounced skill updates
	let skillUpdateTimers = $state<Record<string, { 
		timer: ReturnType<typeof setTimeout>;
		latestValue: boolean;
		updating: boolean; 
	}>>({});

	// Optional: reference maps if we want to fetch class/feat details
	let classMap = new Map<number, any>();
	let featMap = new Map<number, any>();

	// Watchers
	let watchersInitialized = false;
	let currentCharId: number | null = null;

	// Breakdown sheet
	let selectedStatBreakdown = $state<ValueWithBreakdown | null>(null);
	let breakdownSheetOpen = $state(false);

	let isUnmounting = $state(false);

	// Import enrichCharacterData
	import { enrichCharacterData, updateCharacter } from '$lib/domain/characterCalculations';

	// Add this helper function near the top of the script section
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}

	/**
	 * Remove timestamp fields recursively from an object
	 */
	function removeTimestamps<T>(obj: T): T {
		if (!obj || typeof obj !== 'object') return obj;
		
		if (Array.isArray(obj)) {
			return obj.map(removeTimestamps) as T;
		}
		
		const newObj = { ...obj } as any;
		delete newObj.created_at;
		delete newObj.updated_at;
		
		for (const key in newObj) {
			if (typeof newObj[key] === 'object') {
				newObj[key] = removeTimestamps(newObj[key]);
			}
		}
		
		return newObj;
	}

	/**
	 * initReferenceData: optional function to fetch classes/feats
	 */
	async function initReferenceData(): Promise<void> {
		try {
			const [classes, feats] = await Promise.all([
				gameRules.getAllClass(),
				gameRules.getAllFeat()
			]);
			classes.forEach((c) => classMap.set(c.id, c));
			feats.forEach((f) => featMap.set(f.id, f));
		} catch (err) {
			console.error('Failed to load reference data:', err);
			error = 'Failed to load reference data';
		}
	}

	/**
	 * Debounce the database update for skill ranks
	 */
	async function debouncedUpdateSkillRank(skillId: number, level: number, isAdding: boolean) {
		if (!character?.id || !rawCharacter) return;

		const key = getSkillLevelKey(skillId, level);
		const characterId = character.id; // Store the ID for later use in closure
		
		console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Setting up debounced update for ${key}:`, {
			action: isAdding ? 'add' : 'remove',
			currentServerValue: serverSkillRanks.has(key) ? 'exists on server' : 'does not exist on server',
			currentOptimisticValue: optimisticRanks.has(key) ? optimisticRanks.get(key) : 'not set',
			pendingOps: pendingOperations.has(key) ? 'operation pending' : 'no pending operation'
		});
		
		// If we're already updating this skill, just update the latest value
		if (skillUpdateTimers[key]?.updating) {
			skillUpdateTimers[key].latestValue = isAdding;
			console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Skill ${key} is already updating, setting latest value to ${isAdding}`);
			return;
		}
		
		// Cancel previous timer if it exists
		if (skillUpdateTimers[key]?.timer) {
			console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Canceling previous timer for ${key}`);
			clearTimeout(skillUpdateTimers[key].timer);
		}
		
		// Setup new debounce timer
		const timer = setTimeout(async () => {
			console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Timer fired for ${key}, executing DB update`);
			try {
				// Safety check - make sure character is still defined
				if (!character) {
					console.error(`[${getTimestamp()}] [PARENT DEBOUNCED] Character became null during debounced update`);
					return;
				}
				
				// Mark as updating
				skillUpdateTimers[key] = {
					...skillUpdateTimers[key],
					updating: true
				};

				// Get the latest desired state
				const finalIsAdding = skillUpdateTimers[key].latestValue;
				console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Executing DB update for ${key}:`, {
					finalIsAdding,
					currentOptimisticValue: optimisticRanks.has(key) ? optimisticRanks.get(key) : 'not set'
				});

				// Check current server state from our cache
				const existsOnServer = serverSkillRanks.has(key);
				console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Server state for ${key}:`, {
					existsOnServer,
					finalIsAdding,
					requiresUpdate: finalIsAdding !== existsOnServer
				});

				// Only proceed if there's a mismatch between desired state and server state
				if (finalIsAdding !== existsOnServer) {
					// Update the database
					if (finalIsAdding) {
						try {
							// Create the skill rank - with a direct check of our server cache
							if (!existsOnServer) {
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Creating skill rank ${key} in database`);
								await gameRules.createGameCharacterSkillRank({
									game_character_id: characterId,
									skill_id: skillId,
									applied_at_level: level,
								});
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Created skill rank ${key} successfully`);
								
								// Update our server cache to reflect the new state
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Updating server cache for ${key}: Setting to true`);
								serverSkillRanks.set(key, { id: -1, skillId, level });
							} else {
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Skill rank ${key} already exists in our cache, skipping create`);
							}
						} catch (err) {
							// If we get a duplicate key error, the rank was created by someone else
							// after our check - this should be rare with our cache but can still happen
							if (err && typeof err === 'object' && 'code' in err && err.code === '23505') {
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Skill rank ${key} was created concurrently, ignoring error`);
								
								// Update our cache to reflect this new reality
								console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Updating server cache for ${key}: Setting to true (after concurrent create)`);
								serverSkillRanks.set(key, { id: -1, skillId, level });
							} else {
								throw err;
							}
						}
					} else {
						// For removal, first find the existing rank
						console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Finding existing skill rank ${key} for removal`);
						const { data: existingRanks } = await supabase
							.from('game_character_skill_rank')
							.select('id')
							.match({
								game_character_id: characterId,
								skill_id: skillId,
								applied_at_level: level
							})
							.limit(1);
						
						// Only try to delete if we found a record
						if (existingRanks && existingRanks.length > 0) {
							console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Deleting skill rank ${key} with id ${existingRanks[0].id}`);
							await gameRules.deleteGameCharacterSkillRank(existingRanks[0].id);
							console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Deleted skill rank ${key} successfully`);
							
							// Update our server cache to reflect the new state
							console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Updating server cache for ${key}: Setting to false`);
							serverSkillRanks.delete(key);
						} else {
							console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Skill rank ${key} doesn't exist on server, skipping delete`);
						}
					}

					// After successful DB update, remove from pending operations
					const operationKey = getOperationKey(skillId, level, finalIsAdding ? 'add' : 'remove');
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Removing from pending operations:`, {
						pendingOperationsKey: key,
						pendingSkillUpdatesKey: operationKey
					});
					const newPendingOperations = new Map(pendingOperations);
					newPendingOperations.delete(key);
					pendingOperations = newPendingOperations;

					const newPendingSkillUpdates = new Set(pendingSkillUpdates);
					newPendingSkillUpdates.delete(operationKey);
					pendingSkillUpdates = newPendingSkillUpdates;
					
					// Log the state after updates
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Final state after DB update for ${key}:`, {
						serverValue: serverSkillRanks.has(key),
						optimisticValue: optimisticRanks.has(key) ? optimisticRanks.get(key) : 'not set',
						pendingOperations: pendingOperations.has(key),
						effectiveValueForUI: serverSkillRanks.has(key) // This is what hasSkillRank will return
					});
					
					// After successful operation, we should have the correct server state
					// Let's schedule a refresh to ensure everything is in sync
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Scheduling refresh of character data for ${key}`);
					setTimeout(() => {
						if (currentCharId) {
							console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Refreshing character data from server for ${key}`);
							gameRules.getCompleteCharacterData(currentCharId).then(fetched => {
								if (fetched) {
									console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Refresh complete for ${key}, updating character data`);
									rawCharacter = fetched;
									enrichCharacterData(fetched, gameRules).then(enriched => {
										character = enriched;
										console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Character data updated for ${key}`);
										
										// NOW clear the optimistic state after character refresh
										const newOptimisticRanks = new Map(optimisticRanks);
										newOptimisticRanks.delete(key);
										optimisticRanks = newOptimisticRanks;
									});
								}
							}).catch(err => {
								console.error(`[${getTimestamp()}] [PARENT DEBOUNCED] Error refreshing character data:`, err);
							});
						}
					}, 500); // Small delay to allow server to process
				} else {
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] No update required for ${key}:`, {
						finalIsAdding,
						existsOnServer,
						note: 'Server state already matches desired state'
					});
				}
			} catch (err) {
				console.error(`[${getTimestamp()}] [PARENT DEBOUNCED] Error in debounced skill update:`, err);
				
				// On error, update the error state
				const now = Date.now();
				const newOperationErrors = new Map(operationErrors);
				newOperationErrors.set(key, {
					message: err instanceof Error ? err.message : 'Unknown error',
					expiresAt: now + ERROR_TIMEOUT_MS
				});
				operationErrors = newOperationErrors;
				console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Setting error for ${key}:`, operationErrors.get(key));
				
				// Remove from pending operations
				console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Clearing pending operation for ${key} due to error`);
				const newPendingOperations = new Map(pendingOperations);
				newPendingOperations.delete(key);
				pendingOperations = newPendingOperations;
				
				// Revert optimistic changes
				console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Reverting optimistic changes for ${key} due to error`);
				const newOptimisticRanks = new Map(optimisticRanks);
				newOptimisticRanks.delete(key);
				optimisticRanks = newOptimisticRanks;
				
				// On error, refresh from server
				if (currentCharId) {
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Refreshing character data from server due to error`);
					const fetched = await gameRules.getCompleteCharacterData(currentCharId);
					if (fetched) {
						console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Refresh complete, updating character data after error`);
						rawCharacter = fetched;
						character = await enrichCharacterData(fetched, gameRules);
					}
				}
			} finally {
				// Clear the timer regardless of success/failure
				if (skillUpdateTimers[key]) {
					console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Cleaning up timer for ${key}`);
					skillUpdateTimers[key] = {
						...skillUpdateTimers[key],
						timer: setTimeout(() => {}, 0), // Create a dummy timer to satisfy type
						updating: false
					};
					// Clear the dummy timer immediately
					clearTimeout(skillUpdateTimers[key].timer);
				}
			}
		}, DEBOUNCE_MS); // 200ms debounce time
		
		// Store the timer and latest value
		skillUpdateTimers[key] = {
			timer,
			latestValue: isAdding,
			updating: false
		};
		console.log(`[${getTimestamp()}] [PARENT DEBOUNCED] Timer set for ${key}, will execute in ${DEBOUNCE_MS}ms`);
	}

	// Setup onMount
	onMount(() => {
		if (data.id !== null) {
			currentCharId = data.id;

			(async () => {
				if (isUnmounting) return;
				
				try {
					await initReferenceData();
					
					rawCharacter = data.rawCharacter ?? null;
					if (rawCharacter) {
						console.log('Raw character before enrichment:', JSON.stringify(removeTimestamps(rawCharacter), null, 2));
						(async () => {
							character = await enrichCharacterData(rawCharacter, gameRules);
							console.log('Enriched character (mount):', JSON.stringify(removeTimestamps(character), null, 2));
						})();
					} else {
						console.error('Game rules not loaded');
					}

					if (!isUnmounting) {
						initWatchers();
					}
				} catch (err) {
					console.error('Failed to load game rules:', err);
					error = 'Failed to load game rules';
				}
			})();
		}

		return () => {
			isUnmounting = true;
			cleanupWatchers();
			
			// Clear all debounce timers
			Object.values(skillUpdateTimers).forEach(item => {
				if (item.timer) clearTimeout(item.timer);
			});
		};
	});

	// If the user navigates to a different ID without a full refresh
	afterNavigate(async () => {
		const newId = Number($page.params.id);
		if (newId !== currentCharId && !isUnmounting) {
			cleanupWatchers();
			currentCharId = newId;
			
			await loadCharacter(newId, gameRules);

			if (!isUnmounting) {
				initWatchers();
			}
		}
	});

	/**
	 * loadCharacter: fetch from DB and re-enrich
	 */
	async function loadCharacter(charId: number, rules: GameRulesAPI | null) {
		if (!rules) {
			error = 'Game rules not loaded';
			return;
		}
		
		try {
			isLoading = true;
			const fetched = await rules.getCompleteCharacterData(charId);
			rawCharacter = fetched;
			character = fetched ? await enrichCharacterData(fetched, rules) : null;
			console.log('Enriched character (load):', removeTimestamps(character));
			
			// Sync server skill ranks after loading character
			if (character) {
				syncServerSkillRanks();
			}
			
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			isLoading = false;
			character = null;
		}
	}

	/**
	 * initWatchers: attach supabase watchers
	 */
	function initWatchers() {
		if (watchersInitialized) return;
		watchersInitialized = true;

		// Main character table watcher
		gameRules.watchGameCharacter((type, row) => {
			if (row?.id !== currentCharId) return;
			
			if (type === 'DELETE') {
				rawCharacter = null;
				character = null;
				return;
			}

			// For simple updates, patch the existing character
			if (type === 'UPDATE' && rawCharacter) {
				rawCharacter = {
					...rawCharacter,
					current_hp: row.current_hp,
					max_hp: row.max_hp,
					name: row.name,
					label: row.label
				};
				if (gameRules) {
					(async () => {
						character = await enrichCharacterData(rawCharacter, gameRules);
					})();
				}
				return;
			}
		});

		// Watch for skill rank changes 
		gameRules.watchGameCharacterSkillRank(async (type, row) => {
			const currentCharId = character?.id;
			
			if (row?.game_character_id === currentCharId && currentCharId && rawCharacter) {
				console.log(`Received skill rank ${type} notification:`, row);
				
				// Generate the key for our cache
				const key = row ? getSkillLevelKey(row.skill_id, row.applied_at_level) : '';
				if (!row || !key) return; // Safety check
				
				// For ADD or UPDATE operations, patch the rawCharacter directly
				if ((type === 'INSERT' || type === 'UPDATE')) {
					// Check if this is a pending operation we're already handling
					if (pendingOperations.has(key)) {
						console.log(`Ignoring ${type} for ${key} as we're handling it locally`);
						pendingOperations.delete(key);
						optimisticRanks.delete(key);
						return;
					}
				
					// Make sure the array exists
					if (!rawCharacter.game_character_skill_rank) {
						rawCharacter.game_character_skill_rank = [];
					}
					
					// Check if this rank already exists in our local data
					const existingIndex = rawCharacter.game_character_skill_rank.findIndex(
						rank => rank.id === row.id
					);
					
					// Update our cache
					serverSkillRanks.set(key, {
						id: row.id,
						skillId: row.skill_id,
						level: row.applied_at_level
					});
					
					// Use a proper type assertion to satisfy TypeScript
					// We need to cast this as "any" first to bypass TypeScript's strict checking
					const rowWithSkill = {
						...row,
						skill: null
					} as any;
					
					if (existingIndex >= 0) {
						// Update existing entry
						rawCharacter.game_character_skill_rank[existingIndex] = rowWithSkill;
					} else {
						// Add new entry
						rawCharacter.game_character_skill_rank.push(rowWithSkill);
					}
					
					// Clear any optimistic rank for this skill-level pair
					optimisticRanks.delete(key);
					
					// Simplified approach: Just refresh the character
					// This avoids complex partial updates that can get out of sync
					if (gameRules) {
						try {
							character = await enrichCharacterData(rawCharacter, gameRules);
						} catch (err) {
							console.error('Error enriching character data:', err);
						}
					}
				}
				// For DELETE operations, remove the entry from rawCharacter
				else if (type === 'DELETE' && row?.id) {
					// Check if this is a pending operation we're handling
					if (pendingOperations.has(key)) {
						console.log(`Ignoring DELETE for ${key} as we're handling it locally`);
						pendingOperations.delete(key);
						optimisticRanks.delete(key);
						return;
					}
					
					// Remove from our cache
					serverSkillRanks.delete(key);
					
					if (rawCharacter.game_character_skill_rank) {
						// Remove from array
						rawCharacter.game_character_skill_rank = rawCharacter.game_character_skill_rank.filter(
							rank => rank.id !== row.id
						);
						
						// Clear any optimistic rank for this skill-level pair
						optimisticRanks.delete(key);
						
						// Simplified approach: Just refresh the character
						// This avoids complex partial updates that can get out of sync
						if (gameRules) {
							try {
								character = await enrichCharacterData(rawCharacter, gameRules);
							} catch (err) {
								console.error('Error enriching character data:', err);
							}
						}
					}
				}
			}
		});

		// Watch all other character-related tables
		const watchFunctions = [
			'watchGameCharacterAbility',
			'watchGameCharacterClass',
			'watchGameCharacterFeat',
			'watchGameCharacterArchetype',
			'watchGameCharacterAncestry',
			'watchGameCharacterClassFeature',
			'watchGameCharacterCorruption',
			'watchGameCharacterCorruptionManifestation',
			'watchGameCharacterWildTalent',
			'watchGameCharacterEquipment',
			'watchGameCharacterArmor',
			'watchGameCharacterAbpChoice'
		] as const;

		// Generic function to handle all character-related table watchers
		function handleCharacterTableUpdate(tableName: string, type: 'INSERT' | 'UPDATE' | 'DELETE', row: any) {
			if (!row?.game_character_id || row.game_character_id !== currentCharId || !rawCharacter) {
				return;
			}
			
			// Determine the property name in rawCharacter for this table
			// Convert watchGameCharacterAbility -> game_character_ability
			const propertyName = tableName
				.replace('watch', '')
				.replace(/([A-Z])/g, '_$1')
				.toLowerCase()
				.substring(1);
			
			// Safely access/update the property with type checking
			// Using type assertion since we know these properties exist on the character
			const characterAny = rawCharacter as any;
			
			// For INSERT or UPDATE operations, patch the rawCharacter directly
			if ((type === 'INSERT' || type === 'UPDATE') && row) {
				// Make sure the array exists
				if (!characterAny[propertyName]) {
					characterAny[propertyName] = [];
				}
				
				// Check if this entity already exists in our local data
				const existingIndex = characterAny[propertyName].findIndex(
					(item: any) => item.id === row.id
				);
				
				if (existingIndex >= 0) {
					// Update existing entry
					characterAny[propertyName][existingIndex] = row;
				} else {
					// Add new entry
					characterAny[propertyName].push(row);
				}
			}
			// For DELETE operations, remove the entry from rawCharacter
			else if (type === 'DELETE' && row?.id) {
				if (characterAny[propertyName]) {
					characterAny[propertyName] = characterAny[propertyName].filter(
						(item: any) => item.id !== row.id
					);
				}
			}
			
			// Re-enrich the character with our updated raw data
			if (gameRules) {
				(async () => {
					character = await enrichCharacterData(rawCharacter, gameRules);
				})();
			}
		}

		for (const watchFn of watchFunctions) {
			gameRules[watchFn](async (type, row: any) => {
				handleCharacterTableUpdate(watchFn, type, row);
			});
		}
	}

	/**
	 * cleanupWatchers: stop them
	 */
	function cleanupWatchers() {
		if (!watchersInitialized) return;

		try {
			// First cancel any pending timers
			Object.values(skillUpdateTimers).forEach(item => {
				if (item.timer) clearTimeout(item.timer);
			});
			
			// Clear optimistic state
			pendingOperations.clear();
			operationErrors.clear();
			optimisticRanks.clear();
			optimisticPoints.clear();
			
			// Clear server cache
			serverSkillRanks.clear();
			
			// Then stop all watchers
			gameRules.stopAllWatchers();
			console.log('Stopped all watchers');
		} catch (err) {
			console.error('Error cleaning up watchers:', err);
		} finally {
			watchersInitialized = false;
		}
	}

	/**
	 * handleSelectValue: show breakdown in the sheet
	 */
	function handleSelectValue(breakdown: ValueWithBreakdown) {
		selectedStatBreakdown = breakdown;
		breakdownSheetOpen = true;
	}

	/**
	 * Handle skill updates initiated from UI
	 */
	async function onUpdateDB(skillId: number, level: number, isAdding: boolean): Promise<void> {
		if (!character?.id || !rawCharacter) return;
		
		try {
			// Create keys for tracking
			const skillLevelKey = getSkillLevelKey(skillId, level);
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Processing skill update for ${skillLevelKey}:`, {
				type: isAdding ? 'add' : 'remove',
				skillId,
				level,
				isAdding
			});
			
			// Check if we're already processing this operation
			if (pendingOperations.has(skillLevelKey)) {
				console.log(`[${getTimestamp()}] [PARENT DEBUG] Operation already pending for ${skillLevelKey}, ignoring request`);
				return;
			}
			
			// Check server state
			const existsOnServer = serverSkillRanks.has(skillLevelKey);
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Server state for ${skillLevelKey}:`, {
				existsOnServer,
				serverSkillRanks: Object.fromEntries(serverSkillRanks),
				serverSkillRanksHasKey: serverSkillRanks.has(skillLevelKey)
			});
			
			// Only proceed if there's actually a change to make
			if (isAdding === existsOnServer) {
				console.log(`[${getTimestamp()}] [PARENT DEBUG] No change needed for ${skillLevelKey}:`, {
					isAdding,
					existsOnServer
				});
				return;
			}
			
			// Debug: Before setting optimistic state
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Current optimisticRanks:`, optimisticRanks ? Object.fromEntries(optimisticRanks) : 'null');
			
			// Track in pendingOperations map
			const newPendingOperations = new Map(pendingOperations);
			newPendingOperations.set(skillLevelKey, {
				type: isAdding ? 'add' : 'remove',
				timestamp: Date.now()
			});
			pendingOperations = newPendingOperations;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Updated pendingOperations for ${skillLevelKey}:`, {
				pendingOperations: Object.fromEntries(pendingOperations)
			});
			
			// Update optimistic state - explicitly set the rank state
			const newOptimisticRanks = new Map(optimisticRanks);
			newOptimisticRanks.set(skillLevelKey, isAdding);
			optimisticRanks = newOptimisticRanks;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Updated optimisticRanks for ${skillLevelKey}:`, {
				newValue: isAdding,
				optimisticRanks: Object.fromEntries(optimisticRanks)
			});
			
			// Debug after setting optimistic state - log what hasSkillRank would return
			const serverHasRank = character.game_character_skill_rank?.some(
				rank => rank.skill_id === skillId && rank.applied_at_level === level
			) ?? false;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] After setting optimistic state, skill rank status:`, {
				skillLevelKey,
				optimisticValue: optimisticRanks.get(skillLevelKey),
				serverHasRank,
				effectiveValue: optimisticRanks.has(skillLevelKey) ? optimisticRanks.get(skillLevelKey) : serverHasRank
			});
			
			// Update optimistic points
			if (character.skillPoints?.remaining && character.skillPoints.remaining[level] !== undefined) {
				const currentRemaining = character.skillPoints.remaining[level];
				const newOptimisticPoints = new Map(optimisticPoints);
				newOptimisticPoints.set(level, currentRemaining + (isAdding ? -1 : 1));
				optimisticPoints = newOptimisticPoints;
				console.log(`[${getTimestamp()}] [PARENT DEBUG] Updated optimisticPoints for level ${level}:`, {
					oldValue: currentRemaining,
					newValue: optimisticPoints.get(level)
				});
			}
			
			// Step 1: Use the unified optimized update function for immediate UI update
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Calling updateCharacter for immediate UI update`);
			const result = await updateCharacter({
				type: 'skillRank',
				skillId: skillId,
				isAdding: isAdding,
				level: level,
				currentCharacter: character,
				rawCharacter,
				gameRules
			});
			
			// Update both character and rawCharacter with the results
			character = result.enrichedCharacter;
			rawCharacter = result.updatedRawCharacter;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Character updated via updateCharacter`, {
				hasRank: character.game_character_skill_rank?.some(
					rank => rank.skill_id === skillId && rank.applied_at_level === level
				) ?? false
			});
			
			// Check optimistic state after character update
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Optimistic state after character update:`, {
				skillLevelKey,
				optimisticRanks: Object.fromEntries(optimisticRanks),
				optimisticValueForKey: optimisticRanks.has(skillLevelKey) ? optimisticRanks.get(skillLevelKey) : 'not set'
			});
			
			// Step 2: Debounce the database update
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Scheduling debounced DB update for ${skillLevelKey}`);
			debouncedUpdateSkillRank(
				skillId,
				level,
				isAdding
			);
		} catch (err) {
			console.error(`[${getTimestamp()}] [PARENT DEBUG] Error updating skill rank:`, err);
			
			// Set error
			const skillLevelKey = getSkillLevelKey(skillId, level);
			const newOperationErrors = new Map(operationErrors);
			newOperationErrors.set(skillLevelKey, {
				message: err instanceof Error ? err.message : 'Failed to update skill rank',
				expiresAt: Date.now() + ERROR_TIMEOUT_MS
			});
			operationErrors = newOperationErrors;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Set error for ${skillLevelKey}:`, operationErrors.get(skillLevelKey));
			
			// Clear pending operation
			const newPendingOperations = new Map(pendingOperations);
			newPendingOperations.delete(skillLevelKey);
			pendingOperations = newPendingOperations;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Cleared pendingOperation for ${skillLevelKey}`);
			
			// Revert optimistic update
			const newOptimisticRanks = new Map(optimisticRanks);
			newOptimisticRanks.delete(skillLevelKey);
			optimisticRanks = newOptimisticRanks;
			
			const newOptimisticPoints = new Map(optimisticPoints);
			newOptimisticPoints.delete(level);
			optimisticPoints = newOptimisticPoints;
			console.log(`[${getTimestamp()}] [PARENT DEBUG] Reverted optimistic updates for ${skillLevelKey}`);
			
			// On error, refresh from server
			if (currentCharId) {
				console.log(`[${getTimestamp()}] [PARENT DEBUG] Refreshing character data from server due to error`);
				const fetched = await gameRules.getCompleteCharacterData(currentCharId);
				if (fetched) {
					rawCharacter = fetched;
					character = await enrichCharacterData(fetched, gameRules);
					// Sync our server ranks cache
					syncServerSkillRanks();
				}
			}
		}
	}

</script>

<!-- Template -->
{#if isLoading}
	<!-- Loading spinner -->
	<div class="flex min-h-[200px] items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
	</div>
{:else if error}
	<!-- Error message -->
	<div class="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{error}
	</div>
{:else if !character}
	<!-- If no character loaded -->
	<div class="rounded-md border border-muted p-4">
		<p class="text-muted-foreground">No character data found</p>
	</div>
{:else}
	<!-- Normal content -->
	<div class="space-y-2">
		<!-- Header -->
		<CharacterHeader character={character} />

		<!-- Tabs -->
		<Tabs.Root value="stats" class="w-full">
			<Tabs.List class="grid w-full grid-cols-5">
				<Tabs.Trigger value="stats">Stats</Tabs.Trigger>
				<Tabs.Trigger value="skills">Skills</Tabs.Trigger>
				<Tabs.Trigger value="combat">Combat</Tabs.Trigger>
				<Tabs.Trigger value="features">Features</Tabs.Trigger>
				<Tabs.Trigger value="spells">Spells</Tabs.Trigger>
			</Tabs.List>

			<!-- AbilityScores -->
			<Tabs.Content value="stats">
				<div class="rounded-lg bg-secondary p-6">
					<AbilityScores
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Skills -->
			<Tabs.Content value="skills">
				<div class="rounded-lg bg-secondary p-6">
					<Skills
						character={character}
						rules={gameRules}
						onSelectValue={handleSelectValue}
						onUpdateDB={onUpdateDB}
						pendingOperations={pendingOperations}
						operationErrors={operationErrors}
						optimisticRanks={optimisticRanks}
						optimisticPoints={optimisticPoints}
						isOperationPending={isOperationPending}
					/>
				</div>
			</Tabs.Content>

			<!-- Combat -->
			<Tabs.Content value="combat">
				<div class="space-y-6 rounded-lg bg-secondary p-6">
					<HPTracker
						character={character}
						onUpdateDB={async (changes) => {
							if (!character?.id || !rawCharacter) return;
							
							try {
								// Use the optimized update for HP changes
								const result = await updateCharacter({
									type: 'hp',
									newCurrentHp: changes.current_hp ?? character.current_hp,
									newMaxHp: changes.max_hp,
									currentCharacter: character,
									rawCharacter,
									gameRules
								});
								
								// Update both character and rawCharacter with the results
								character = result.enrichedCharacter;
								rawCharacter = result.updatedRawCharacter;
								
								// Update the database
								await gameRules.updateGameCharacter(character.id, {
									...changes
								});
							} catch (err) {
								console.error('Error updating HP:', err);
								// On error, refresh from server
								if (currentCharId) {
									const fetched = await gameRules.getCompleteCharacterData(currentCharId);
									if (fetched) {
										rawCharacter = fetched;
										character = await enrichCharacterData(fetched, gameRules);
									}
								}
							}
						}}
					/>
					<Saves
						character={character}
						onSelectValue={handleSelectValue}
					/>
					<ACStats
						character={character}
						onSelectValue={handleSelectValue}
					/>
					<CombatStats
						character={character}
						onSelectValue={handleSelectValue}
					/>
				</div>
			</Tabs.Content>

			<!-- Features -->
			<Tabs.Content value="features">
				<div class="rounded-lg bg-secondary p-6">
					<!-- Sub-tabs for Features section -->
					<Tabs.Root value="classFeatures" class="w-full">
						<Tabs.List class="grid w-full grid-cols-3 mb-6">
							<Tabs.Trigger value="classFeatures">Class Features</Tabs.Trigger>
							<Tabs.Trigger value="feats">Feats</Tabs.Trigger>
							<Tabs.Trigger value="corruptions">Corruptions</Tabs.Trigger>
						</Tabs.List>
						
						<!-- Class Features sub-tab -->
						<Tabs.Content value="classFeatures">
							<ClassFeatures character={character} />
						</Tabs.Content>
						
						<!-- Feats sub-tab -->
						<Tabs.Content value="feats">
							<Feats character={character} />
						</Tabs.Content>
						
						<!-- Corruptions sub-tab -->
						<Tabs.Content value="corruptions">
							<Corruptions character={character} />
						</Tabs.Content>
					</Tabs.Root>
				</div>
			</Tabs.Content>

			<Tabs.Content value="spells">
				<div class="rounded-lg bg-secondary p-6">
					<SpellSlots
						character={character}
					/>
					<Spells
					character={character}
				/>
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<!-- Bottom sheet for breakdown -->
	<Sheet.Root bind:open={breakdownSheetOpen}>
		<Sheet.Content side="bottom">
			{#if selectedStatBreakdown}
				<Sheet.Header>
					<Sheet.Title>{selectedStatBreakdown.label} Breakdown</Sheet.Title>
					<Sheet.Description>
						A detailed breakdown of how {selectedStatBreakdown.label} is calculated.
					</Sheet.Description>
				</Sheet.Header>
				<div class="space-y-3 p-4">
					<!-- Show each modifier -->
					<ul class="space-y-1 text-sm">
						{#each selectedStatBreakdown.modifiers as m}
							<li>
								<span class="font-medium">{m.source}:</span>
								<span>{m.value >= 0 ? '+' : ''}{m.value}</span>
							</li>
						{/each}
					</ul>
					<p class="text-lg font-semibold">
						Total: {selectedStatBreakdown.total >= 0 ? '+' : ''}{selectedStatBreakdown.total}
					</p>
				</div>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
{/if}
