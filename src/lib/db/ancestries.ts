// FILE: src/lib/db/ancestries.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Json } from '$lib/domain/types/supabase';

/** Mirror your old DatabaseBaseAncestry structure as needed */
export interface DBAncestry {
	id: number;
	name: string;
	size: string;
	base_speed: number;
	ability_modifiers: Record<string, number>;
	description: string;
	created_at?: string | null;
	updated_at?: string | null;
}

/**
 * For saving (insert/update) you might want a partial shape
 * or just rely on DBAncestry for typed inserts.
 */
export interface SaveAncestryDTO {
	name: string;
	size: string;
	base_speed: number;
	ability_modifiers: Record<string, number>;
	description: string;
}

/** Mirror your DBAncestralTrait if you need it here */
export interface DBAncestralTrait {
	id: number;
	ancestry_id: number | null;
	name: string;
	description: string;
	benefits: Json;
	is_optional: boolean | null;
	created_at?: string | null;
	updated_at?: string | null;
}

/** 1) Load ancestries, returning typed array */
export async function loadAncestries(): Promise<DBAncestry[]> {
	const { data, error } = await supabase
		.from('base_ancestries')
		.select('*')
		.order('name');

	if (error) {
		console.error('Failed to load ancestries:', error);
		throw new Error(error.message);
	}

	// Ensure ability_modifiers is typed properly
	return data.map((ancestry) => ({
		...ancestry,
		// fallback to empty object if null
		ability_modifiers: ancestry.ability_modifiers ?? {}
	})) as DBAncestry[];
}

/** 2) Load ancestral traits, returning typed array */
export async function loadAncestralTraits(): Promise<DBAncestralTrait[]> {
	const { data, error } = await supabase
		.from('base_ancestral_traits')
		.select('*')
		.order('name');

	if (error) {
		console.error('Failed to load ancestral traits:', error);
		throw new Error(error.message);
	}

	return data as DBAncestralTrait[];
}

/** 3) Insert or update an ancestry */
export async function saveAncestry(dto: SaveAncestryDTO, id?: number): Promise<void> {
	if (!dto.name || !dto.size || !dto.base_speed) {
		throw new Error('Ancestry requires name, size, and base_speed');
	}

	const { error } = id
		? await supabase
				.from('base_ancestries')
				.update(dto)
				.eq('id', id)
				.select()
				.single()
		: await supabase.from('base_ancestries').insert(dto).select().single();

	if (error) {
		console.error('Failed to save ancestry:', error);
		throw new Error(`Failed to save ancestry: ${error.message}`);
	}
}

/** 4) Delete an ancestry */
export async function deleteAncestry(id: number): Promise<void> {
	const { error } = await supabase.from('base_ancestries').delete().eq('id', id);

	if (error) {
		console.error('Failed to delete ancestry:', error);
		throw new Error(`Failed to delete ancestry: ${error.message}`);
	}
}

/* ---------------------------------------------------------------------------
   REAL-TIME SUBSCRIPTIONS
   We'll provide two watchers: one for base_ancestries, one for base_ancestral_traits.
   They emit events in a store each time supabase sees INSERT/UPDATE/DELETE.
--------------------------------------------------------------------------- */

/** A single event from the 'base_ancestries' table */
export interface AncestryChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBAncestry | null;
	oldRow: DBAncestry | null;
}

/** A single event from the 'base_ancestral_traits' table */
export interface AncestralTraitChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBAncestralTrait | null;
	oldRow: DBAncestralTrait | null;
}

/**
 * watchAllAncestries()
 * 
 * Subscribes to real-time changes (INSERT, UPDATE, DELETE) on the 'base_ancestries' table,
 * returning a Svelte store that emits arrays of new events.
 *
 * Each time a new event occurs, it is appended to the store's array. It's up to you
 * to subscribe and handle them (e.g., update your local state, re-render UI, etc.).
 */
export function watchAllAncestries(): Readable<AncestryChangeEvent[]> {
	// We accumulate events in an array. The consumer can process them and optionally clear them out.
	return readable<AncestryChangeEvent[]>([], (set) => {
		// Create a channel for the entire 'base_ancestries' table
		const channel = supabase.channel('base_ancestries_all');

		const handlePayload = (payload: RealtimePostgresChangesPayload<DBAncestry>) => {
			const event: AncestryChangeEvent = {
				eventType: payload.eventType,
				newRow: payload.new ?? null,
				oldRow: payload.old ?? null
			};
			set((prev) => [...prev, event]);
		};

		// Listen to all changes in the 'base_ancestries' table
		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'base_ancestries'
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('[db/ancestries] Subscribed to base_ancestries (all rows).');
			}
		});

		// Cleanup when unsubscribed
		return () => {
			supabase.removeChannel(channel);
		};
	});
}

/**
 * watchAllAncestralTraits()
 *
 * Subscribes to real-time changes on the 'base_ancestral_traits' table.
 * Returns a Svelte store that accumulates Realtime events.
 */
export function watchAllAncestralTraits(): Readable<AncestralTraitChangeEvent[]> {
	return readable<AncestralTraitChangeEvent[]>([], (set) => {
		const channel = supabase.channel('base_ancestral_traits_all');

		const handlePayload = (payload: RealtimePostgresChangesPayload<DBAncestralTrait>) => {
			const event: AncestralTraitChangeEvent = {
				eventType: payload.eventType,
				newRow: payload.new ?? null,
				oldRow: payload.old ?? null
			};
			set((prev) => [...prev, event]);
		};

		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'base_ancestral_traits'
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('[db/ancestries] Subscribed to base_ancestral_traits (all rows).');
			}
		});

		return () => {
			supabase.removeChannel(channel);
		};
	});
}
