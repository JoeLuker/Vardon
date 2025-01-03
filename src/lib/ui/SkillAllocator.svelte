<script lang="ts">
	import { getCharacter, fetchSkillData } from '$lib/state/characterStore';
	import { onMount } from 'svelte';
	import {
		getClassSkillRanks,
		deleteSkillRanksByIds,
		upsertSkillRanks,
		type SkillRankInsert
	} from '$lib/db/skillRanks';

	let { onClose, characterId } = $props<{
		onClose: () => void;
		characterId: number;
	}>();

	// Derive character and stats reactivity
	let character = $derived(getCharacter(characterId));
	let stats = $derived.by(() => calculateCharacterStats(character));

	let pendingChanges = $state<SkillRankInsert[]>([]);
	let isSaving = $state(false);
	let updateState = $state<UpdateState>({
		status: 'idle' as const,
		error: null
	});

	let isMobileView = $state(false);
	let isLoading = $state(true);
	let uncheckedRanks = $state<number[]>([]); // Store IDs of ranks that were unchecked

	function handleResize() {
		isMobileView = window.innerWidth < 768;
	}

	onMount(() => {
		handleResize();
		window.addEventListener('resize', handleResize);

		// Load skill data
		fetchSkillData(character.id)
			.catch((error) => {
				console.error('Failed to load skill data:', error);
				updateState.error = error instanceof Error ? error : new Error('Failed to load skills');
			})
			.finally(() => {
				isLoading = false;
			});

		// Cleanup on unmount
		return () => window.removeEventListener('resize', handleResize);
	});

	function canAddRankAtLevel(skillName: string, level: number): boolean {
		if (!character) return false;
		const skillData = stats?.skills?.byName[skillName];
		if (!skillData) {
			console.warn(`No skill data found for ${skillName}`);
			return false;
		}

		const levelData = stats.skills.byLevel[level];
		if (!levelData) {
			console.warn(`No level data found for level ${level}`);
			return false;
		}

		const existingRanks = skillData.ranks.byLevel[level] ?? [];
		const hasExistingClassRank = existingRanks.some(
			(rank) => rank.source === SKILL_RANK_SOURCES.CLASS
		);

		// If we already have a class rank at this level, we can toggle it off
		if (hasExistingClassRank) {
			return true;
		}

		// Check skill points availability
		const pendingRanksAtLevel = pendingChanges.filter(
			(change) => change.applied_at_level === level
		).length;
		const availablePoints = levelData.available - levelData.used + pendingRanksAtLevel;

		if (availablePoints <= 0) {
			return false;
		}

		// Check if total ranks would exceed character level
		const totalRanks = existingRanks.reduce((sum, rank) => sum + rank.ranks, 0);
		return totalRanks < level;
	}

	function handleRankChange(skillName: string, level: number, checked: boolean) {
		if (!character) return;
		if (checked && !canAddRankAtLevel(skillName, level)) return;

		const skill = character.base_skills?.find((s) => s.name === skillName);
		if (!skill?.id) return;

		if (checked) {
			// Add new rank with proper typing
			const newRank: SkillRankInsert = {
				skill_id: skill.id,
				character_id: character.id,
				applied_at_level: level,
				ranks: 1,
				source: SKILL_RANK_SOURCES.CLASS
			};
			pendingChanges = [...pendingChanges, newRank];

			// Optimistically update character's skill ranks
			if (character.character_skill_ranks) {
				character.character_skill_ranks = [
					...character.character_skill_ranks,
					{
						...newRank,
						id: -Math.random(),
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						sync_status: 'pending'
					}
				];
			}
		} else {
			// Uncheck rank
			const existingRank = character.character_skill_ranks?.find(
				(rank) =>
					rank.skill_id === skill.id &&
					rank.applied_at_level === level &&
					rank.source === SKILL_RANK_SOURCES.CLASS
			);

			if (existingRank?.id && existingRank.id > 0) {
				uncheckedRanks = [...uncheckedRanks, existingRank.id];
			}

			// Remove from pending changes
			pendingChanges = pendingChanges.filter(
				(change) => !(change.skill_id === skill.id && change.applied_at_level === level)
			);

			// Remove from character's skill ranks
			if (character.character_skill_ranks) {
				character.character_skill_ranks = character.character_skill_ranks.filter(
					(rank) =>
						!(
							rank.skill_id === skill.id &&
							rank.applied_at_level === level &&
							rank.source === SKILL_RANK_SOURCES.CLASS
						)
				);
			}
		}
	}

	async function handleSave() {
		if (!character || isSaving) return;
		isSaving = true;

		const originalSkillRanks = [...(character.character_skill_ranks ?? [])];

		try {
			await executeUpdate({
				key: `skills-${character.id}`,
				status: updateState,
				operation: async () => {
					const existingRanks = await getClassSkillRanks(character.id, SKILL_RANK_SOURCES.CLASS);

					const existingRankMap = new Map(
						(existingRanks ?? []).map((rank) => [`${rank.skill_id}-${rank.applied_at_level}`, rank])
					);

					// Ensure we have valid skill_ids and create properly typed updates
					const ranksToUpsert: SkillRankInsert[] = pendingChanges
						.filter(
							(change): change is Required<typeof change> =>
								change.skill_id !== null && typeof change.skill_id === 'number'
						)
						.filter((change) => {
							const key = `${change.skill_id}-${change.applied_at_level}`;
							return !existingRankMap.has(key);
						})
						.map((change) => ({
							character_id: character.id,
							skill_id: change.skill_id,
							ranks: change.ranks,
							applied_at_level: change.applied_at_level,
							source: change.source
						}));

					// Delete unchecked ranks first
					if (uncheckedRanks.length > 0) {
						await deleteSkillRanksByIds(uncheckedRanks);
					}

					// Upsert new ranks
					if (ranksToUpsert.length > 0) {
						const upsertedRanks = await upsertSkillRanks(ranksToUpsert);
						if (upsertedRanks) {
							character.character_skill_ranks = [
								...(character.character_skill_ranks?.filter(
									(rank) =>
										!ranksToUpsert.some(
											(newRank) =>
												newRank.skill_id === rank.skill_id &&
												newRank.applied_at_level === rank.applied_at_level
										)
								) ?? []),
								...upsertedRanks.map((rank) => ({
									...rank,
									source: rank.source.toLowerCase() as CharacterSkillRank['source']
								}))
							];
						}
					}
				},
				optimisticUpdate: () => {
					// Already handled in handleRankChange
				},
				rollback: () => {
					character.character_skill_ranks = originalSkillRanks;
				}
			});

			uncheckedRanks = [];
			onClose();
		} catch (error) {
			console.error('Save failed:', error);
			updateState.error = error instanceof Error ? error : new Error('Failed to save skills');
		} finally {
			isSaving = false;
		}
	}
</script>

<!-- The rest of your component’s markup / styles remain mostly the same. -->
<div class="skill-allocator">
	{#if isMobileView}
		<div class="mobile-view">
			{#each character.base_skills ?? [] as skill}
				{@const skillData = stats.skills.byName[skill.name]}
				<div class="skill-card">
					<div class="skill-header">
						<h3>{skill.name}</h3>
						<div class="skill-meta">
							<span>Ability: {skill.ability}</span>
							{#if skillData.classSkill}
								<span class="class-skill">Class Skill</span>
							{/if}
						</div>
					</div>
					<div class="level-grid">
						{#each Array(character.level) as _, level}
							{@const levelNum = level + 1}
							{@const existingRanks = skillData.ranks.byLevel[levelNum] ?? []}
							<div class="level-item">
								<label>
									<span>Lvl {levelNum}</span>
									<input
										type="checkbox"
										checked={existingRanks.length > 0}
										disabled={!canAddRankAtLevel(skill.name, levelNum)}
										onchange={(e) =>
											handleRankChange(skill.name, levelNum, e.currentTarget.checked)}
									/>
								</label>
								{#if existingRanks.length > 0}
									<small class="rank-source">
										({existingRanks.map((r: { source: string }) => r.source).join(', ')})
									</small>
								{/if}
							</div>
						{/each}
					</div>
					<div class="skill-footer">
						<span>Total: {skillData.total}</span>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th class="sticky-col">Skill</th>
						<th class="sticky-col">Ability</th>
						<th class="sticky-col">Class</th>
						{#each Array(character.level) as _, level}
							<th>
								Level {level + 1}
								<div class="points-info">
									({stats.skills.byLevel[level + 1].used}/{stats.skills.byLevel[level + 1]
										.available})
								</div>
							</th>
						{/each}
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{#each character.base_skills ?? [] as skill}
						{@const skillData = stats.skills.byName[skill.name]}
						<tr>
							<td class="sticky-col">{skill.name}</td>
							<td class="sticky-col">{skill.ability}</td>
							<td class="sticky-col">{skillData.classSkill ? '✓' : ''}</td>
							{#each Array(character.level) as _, level}
								{@const levelNum = level + 1}
								{@const existingRanks = skillData.ranks.byLevel[levelNum] ?? []}
								<td>
									<input
										type="checkbox"
										checked={existingRanks.length > 0}
										disabled={!canAddRankAtLevel(skill.name, levelNum)}
										onchange={(e) =>
											handleRankChange(skill.name, levelNum, e.currentTarget.checked)}
									/>
									{#if existingRanks.length > 0}
										<span class="rank-source">
											({existingRanks.map((r: { source: string }) => r.source).join(', ')})
										</span>
									{/if}
								</td>
							{/each}
							<td>{skillData.total}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="actions">
		<button disabled={pendingChanges.length === 0 || isSaving} onclick={handleSave}>
			{#if isSaving}
				<div class="spinner"></div>
			{/if}
			{isSaving ? 'Saving...' : 'Save Changes'}
		</button>
		<button
			class="btn btn-secondary"
			onclick={onClose}
			disabled={isSaving || updateState.status === 'syncing'}
		>
			Cancel
		</button>
	</div>

	{#if updateState.error}
		<div class="error">Failed to save changes. Please try again.</div>
	{/if}
</div>

<style>
	/* 
      The CSS remains largely unchanged. 
      Only the script has been refactored to remove direct supabase calls.
    */
	.skill-allocator {
		width: 100%;
		max-width: 100%;
		position: relative;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.table-container {
		max-width: 100%;
		overflow-x: auto;
		overflow-y: auto;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, #ddd);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		flex: 1;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--color-background, white);
	}

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border, #ddd);
		white-space: nowrap;
	}

	th {
		background: var(--color-background-alt, #f5f5f5);
		font-weight: 600;
		position: sticky;
		top: 0;
		z-index: 1;
		box-shadow: 0 1px 0 var(--color-border, #ddd);
	}

	.sticky-col {
		position: sticky;
		left: 0;
		background: var(--color-background, white);
		z-index: 2;
	}

	td.sticky-col:nth-child(1),
	th.sticky-col:nth-child(1) {
		left: 0;
		min-width: 240px;
		width: 240px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	td.sticky-col:nth-child(2),
	th.sticky-col:nth-child(2) {
		left: 240px;
		min-width: 100px;
		width: 100px;
	}

	td.sticky-col:nth-child(3),
	th.sticky-col:nth-child(3) {
		left: 340px;
		min-width: 80px;
		width: 80px;
	}

	th.sticky-col {
		z-index: 3;
		background: var(--color-background-alt, #f5f5f5);
	}

	tr:hover .sticky-col {
		background: var(--color-background-hover, #f9f9f9);
	}

	.points-info {
		font-size: 0.75rem;
		color: var(--color-text-muted, #666);
		margin-top: 0.25rem;
		white-space: nowrap;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		margin-top: 1rem;
		color: var(--color-error, #dc2626);
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: var(--color-error-bg, #fef2f2);
		border: 1px solid var(--color-error-border, #fecaca);
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.table-container {
			border-radius: 0;
			border-left: 0;
			border-right: 0;
		}
	}

	.mobile-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		overflow-y: auto;
	}

	.skill-card {
		background: var(--color-background, white);
		border: 1px solid var(--color-border, #ddd);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.skill-header {
		margin-bottom: 1rem;
	}

	.skill-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.skill-meta {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-text-muted, #666);
	}

	.class-skill {
		color: var(--color-success, #16a34a);
	}

	.level-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.level-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.level-item label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.level-item span {
		font-size: 0.875rem;
	}

	.level-item small {
		font-size: 0.75rem;
		color: var(--color-text-muted, #666);
	}

	.skill-footer {
		font-weight: 500;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border, #ddd);
	}

	@media (max-width: 768px) {
		.skill-allocator {
			height: calc(100vh - 4rem);
			max-height: none;
		}

		.actions {
			position: sticky;
			bottom: 0;
			background: var(--color-background, white);
			padding: 1rem;
			border-top: 1px solid var(--color-border, #ddd);
			margin-top: 0;
		}
	}
</style>
