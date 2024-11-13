<script lang="ts">
	import type { AttributeKey, CharacterAttributes, CharacterBuff } from '$lib/types/character';

	let { attributes, activeBuffs, onUpdateAttribute } = $props<{
		attributes: CharacterAttributes;
		activeBuffs: CharacterBuff[];
		onUpdateAttribute: (attr: AttributeKey, value: number) => Promise<void>;
	}>();

	// Use local state instead of directly modifying parent state
	let editingAttribute = $state<AttributeKey | null>(null);
	let inputValue = $state<number>(0);

	// Calculate modified attributes based on active buffs
	let modifiedAttributes = $derived.by(() => {
		const mods: Record<AttributeKey, number> = {
			str: 0,
			dex: 0,
			con: 0,
			int: 0,
			wis: 0,
			cha: 0
		};

		// Apply buff modifiers
		activeBuffs.forEach((buff: CharacterBuff) => {
			if (!buff.is_active) return;

			switch (buff.buff_type) {
				case 'cognatogen':
					mods.int += 4;
					mods.str -= 2;
					break;
				case 'dex_mutagen':
					mods.dex += 4;
					mods.wis -= 2;
					break;
			}
		});

		// Apply modifiers to base attributes
		return {
			str: attributes.str + mods.str,
			dex: attributes.dex + mods.dex,
			con: attributes.con + mods.con,
			int: attributes.int + mods.int,
			wis: attributes.wis + mods.wis,
			cha: attributes.cha + mods.cha
		};
	});

	// Use modified attributes for display
	let attributesList = $derived.by(() => [
		{ key: 'str' as const, label: 'Strength', value: modifiedAttributes.str, base: attributes.str },
		{
			key: 'dex' as const,
			label: 'Dexterity',
			value: modifiedAttributes.dex,
			base: attributes.dex
		},
		{
			key: 'con' as const,
			label: 'Constitution',
			value: modifiedAttributes.con,
			base: attributes.con
		},
		{
			key: 'int' as const,
			label: 'Intelligence',
			value: modifiedAttributes.int,
			base: attributes.int
		},
		{ key: 'wis' as const, label: 'Wisdom', value: modifiedAttributes.wis, base: attributes.wis },
		{ key: 'cha' as const, label: 'Charisma', value: modifiedAttributes.cha, base: attributes.cha }
	]);

	let modifiers = $derived.by(() =>
		attributesList.reduce(
			(acc, { key, value }) => ({
				...acc,
				[key]: Math.floor((value - 10) / 2)
			}),
			{} as Record<AttributeKey, number>
		)
	);

	function startEditing(attr: AttributeKey) {
		editingAttribute = attr;
		inputValue = attributes[attr];
	}

	async function handleQuickUpdate(attr: AttributeKey, amount: number) {
		const newValue = Math.max(1, Math.min(30, attributes[attr] + amount));
		if (newValue === attributes[attr]) return;

		// Only invoke callback, don't modify state directly
		await onUpdateAttribute(attr, newValue);
	}

	function handleInputChange(value: string) {
		const parsed = parseInt(value) || 0;
		inputValue = Math.max(1, Math.min(30, parsed));
	}

	async function handleInputBlur() {
		if (!editingAttribute || inputValue === attributes[editingAttribute]) {
			editingAttribute = null;
			return;
		}

		const attr = editingAttribute;
		editingAttribute = null;

		// Only invoke callback, don't modify state directly
		await onUpdateAttribute(attr, inputValue);
	}

	let formatModifier = $derived.by(() => (num: number): string => 
		num >= 0 ? `+${num}` : num.toString()
	);

	function focusInput(node: HTMLInputElement) {
		node.focus();
		node.select();
		return {};
	}
</script>

<section class="card">
	<h2 class="mb-4 text-xl font-bold">Attributes</h2>

	<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
		{#each attributesList as { key, label, value, base }}
			<div class="rounded bg-gray-50 p-4 transition-colors hover:bg-gray-100">
				<div class="mb-2 flex items-center justify-between">
					<label for={`${key}-input`} class="text-sm font-medium text-gray-700">
						{label}
					</label>
					<div class="flex gap-1">
						<button
							class="btn btn-secondary px-2 py-1 text-xs"
							onclick={() => handleQuickUpdate(key, -1)}
							disabled={base <= 1}
						>
							-1
						</button>
						<button
							class="btn btn-secondary px-2 py-1 text-xs"
							onclick={() => handleQuickUpdate(key, 1)}
							disabled={base >= 30}
						>
							+1
						</button>
					</div>
				</div>

				<div class="flex items-center gap-2">
					{#if editingAttribute === key}
						<input
							id={`${key}-input`}
							type="number"
							class="input w-20 text-center"
							value={inputValue}
							min="1"
							max="30"
							oninput={(e) => handleInputChange(e.currentTarget.value)}
							onblur={handleInputBlur}
							use:focusInput
						/>
					{:else}
						<div class="flex items-center gap-2">
							<button
								class="min-w-[3rem] rounded px-2 py-1 text-center text-2xl font-bold hover:bg-gray-200
                                       focus:outline-none focus:ring-2 focus:ring-primary/50"
								onclick={() => startEditing(key)}
							>
								{base}
							</button>
							{#if value !== base}
								<span class="text-sm text-gray-500">
									→ {value}
								</span>
							{/if}
						</div>
					{/if}
					<span class="min-w-[3rem] text-lg text-gray-600">
						{formatModifier(modifiers[key])}
					</span>
				</div>
			</div>
		{/each}
	</div>
</section>