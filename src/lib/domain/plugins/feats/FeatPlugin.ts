/**
 * Feat Plugin
 *
 * This module provides a base implementation for feat plugins.
 * Feats are special abilities that characters can acquire.
 */

import type { Entity, Capability } from '../../kernel/types';
import { BasePlugin } from '../BasePlugin';
import type { BasePluginOptions } from '../BasePlugin';

/**
 * Feat plugin options
 */
export interface FeatPluginOptions extends BasePluginOptions {
	/** Whether the feat is combat-related */
	isCombatFeat?: boolean;

	/** Whether the feat is metamagic */
	isMetamagic?: boolean;

	/** Whether the feat is teamwork */
	isTeamwork?: boolean;

	/** Prerequisites for the feat (in human-readable form) */
	prerequisites?: string;

	/** Whether the feat can be selected multiple times */
	isRepeatable?: boolean;

	/** Benefit description */
	benefit?: string;

	/** Special notes */
	special?: string;
}

/**
 * Base implementation for feat plugins
 */
export abstract class FeatPlugin extends BasePlugin {
	/** Whether the feat is combat-related */
	public readonly isCombatFeat: boolean;

	/** Whether the feat is metamagic */
	public readonly isMetamagic: boolean;

	/** Whether the feat is teamwork */
	public readonly isTeamwork: boolean;

	/** Prerequisites for the feat (in human-readable form) */
	public readonly prerequisites?: string;

	/** Whether the feat can be selected multiple times */
	public readonly isRepeatable: boolean;

	/** Benefit description */
	public readonly benefit?: string;

	/** Special notes */
	public readonly special?: string;

	constructor(options: FeatPluginOptions) {
		super(options);
		this.isCombatFeat = options.isCombatFeat || false;
		this.isMetamagic = options.isMetamagic || false;
		this.isTeamwork = options.isTeamwork || false;
		this.prerequisites = options.prerequisites;
		this.isRepeatable = options.isRepeatable || false;
		this.benefit = options.benefit;
		this.special = options.special;
	}

	/**
	 * Add the feat to the entity
	 * @param entity Entity to add the feat to
	 */
	protected addFeatToEntity(entity: Entity): void {
		// Ensure the feats property exists
		if (!entity.properties.feats) {
			entity.properties.feats = [];
		}

		// Check if the entity already has this feat
		const hasFeat = entity.properties.feats.some((feat: any) => feat.id === this.id);

		// Add the feat if it doesn't exist already
		if (!hasFeat) {
			entity.properties.feats.push({
				id: this.id,
				name: this.name,
				isActive: true,
				appliedAt: Date.now()
			});

			this.log(`Added feat ${this.name} to entity ${entity.id}`);
		} else if (this.isRepeatable) {
			// If the feat is repeatable, increment the count
			const feat = entity.properties.feats.find((feat: any) => feat.id === this.id);
			if (feat) {
				feat.count = (feat.count || 1) + 1;
				this.log(`Incremented feat ${this.name} count to ${feat.count} for entity ${entity.id}`);
			}
		} else {
			this.log(`Entity ${entity.id} already has feat ${this.name}`);
		}
	}

	/**
	 * Get the number of times a feat has been taken
	 * @param entity Entity to check
	 * @returns Number of times the feat has been taken
	 */
	protected getFeatCount(entity: Entity): number {
		if (!entity.properties.feats) return 0;

		const feat = entity.properties.feats.find((feat: any) => feat.id === this.id);
		return feat ? feat.count || 1 : 0;
	}

	/**
	 * Check if the entity has this feat
	 * @param entity Entity to check
	 * @returns Whether the entity has this feat
	 */
	protected hasFeat(entity: Entity): boolean {
		if (!entity.properties.feats) return false;
		return entity.properties.feats.some((feat: any) => feat.id === this.id);
	}

	/**
	 * Remove the feat from the entity
	 * @param entity Entity to remove the feat from
	 */
	protected removeFeatFromEntity(entity: Entity): void {
		if (!entity.properties.feats) return;

		// Check if the entity has this feat
		const hasFeat = entity.properties.feats.some((feat: any) => feat.id === this.id);

		if (hasFeat) {
			// If repeatable, decrement the count
			if (this.isRepeatable) {
				const feat = entity.properties.feats.find((feat: any) => feat.id === this.id);
				if (feat && feat.count && feat.count > 1) {
					feat.count--;
					this.log(`Decremented feat ${this.name} count to ${feat.count} for entity ${entity.id}`);
					return;
				}
			}

			// Remove the feat
			entity.properties.feats = entity.properties.feats.filter((feat: any) => feat.id !== this.id);
			this.log(`Removed feat ${this.name} from entity ${entity.id}`);
		}
	}
}
