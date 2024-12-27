// FILE: src/lib/db/classFeatures.ts
import { supabase } from '$lib/db/supabaseClient';
import { readable, type Readable } from 'svelte/store';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Json } from '$lib/domain/types/supabase';

/**
 * DB shape for 'character_class_features'.
 */
export interface DBClassFeature {
	id: number;
	character_id: number;
	feature_name: string;
	feature_level: number;
	active: boolean;
	properties: Json | null;
	updated_at: string | null;
	sync_status: string | null; 
}

/**
 * For inserting/updating a row (create or update).
 */
export interface SaveClassFeatureDTO {
	character_id: number;
	feature_name: string;
	feature_level: number;
	active: boolean;
	properties: Json | null;
}

export async function saveClassFeature(
	dto: SaveClassFeatureDTO,
	existingId?: number
): Promise<DBClassFeature> {
	const isNew = !existingId;
	const query = isNew
		? supabase
				.from('character_class_features')
				.insert(dto)
				.select()
				.single()
		: supabase
				.from('character_class_features')
				.update(dto)
				.eq('id', existingId)
				.select()
				.single();

	const { data, error } = await query;
	if (error) {
		console.error('Failed to save class feature:', error);
		throw new Error(`Failed to save feature: ${error.message}`);
	}
	return data as DBClassFeature;
}

export async function deleteClassFeature(featureId: number): Promise<void> {
	const { error } = await supabase
		.from('character_class_features')
		.delete()
		.eq('id', featureId);

	if (error) {
		console.error('Failed to delete class feature:', error);
		throw new Error(`Failed to delete feature: ${error.message}`);
	}
}

/**
 * Real-time subscription: watch 'character_class_features' for a given `characterId`.
 * 
 * Returns a Svelte store that *emits* an array of real-time "events." 
 * Each event is { eventType, newRow, oldRow } so your app can handle them as needed.
 *
 * This function is TOTALLY AGNOSTIC about how your app processes these events.
 */
export function watchClassFeatures(
	characterId: number
): Readable<FeatureChangeEvent[]> {
	return readable<FeatureChangeEvent[]>([], (set) => {
		const channel = supabase.channel(`class_features_${characterId}`);

		const handlePayload = (payload: RealtimePostgresChangesPayload<DBClassFeature>) => {
			const change: FeatureChangeEvent = {
				eventType: payload.eventType,
				newRow: payload.new ?? null,
				oldRow: payload.old ?? null
			};

			set((prev) => [...prev, change]);
		};

		channel.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'character_class_features',
				filter: `character_id=eq.${characterId}`
			},
			handlePayload
		);

		channel.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log(`[db] Subscribed to classFeatures for character ${characterId}`);
			}
		});

		return () => {
			supabase.removeChannel(channel);
		};
	});
}

/**
 * The shape of each real-time event your store will emit.
 * 
 * - eventType: 'INSERT' | 'UPDATE' | 'DELETE'
 * - newRow: the newly inserted/updated row (or null for DELETE)
 * - oldRow: the old row data (on update/delete), or null for INSERT
 */
export interface FeatureChangeEvent {
	eventType: 'INSERT' | 'UPDATE' | 'DELETE';
	newRow: DBClassFeature | null;
	oldRow: DBClassFeature | null;
}
