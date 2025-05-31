import { EventBus } from '../../core/EventBus';
import type { Entity } from '../../types/EntityTypes';

/**
 * Manages the current state of a gaming session
 */
export class SessionState {
	private activeEntities: Map<string, Entity> = new Map();
	private entityConditions: Map<string, Set<string>> = new Map();
	private activeFeatures: Map<
		string,
		{
			featureId: string;
			entityId: string;
			startTime: number;
			duration?: number;
			options: any;
		}
	> = new Map();
	private turnCounter: number = 0;
	private roundCounter: number = 0;

	constructor(private events: EventBus) {
		// Subscribe to relevant events
		this.events.on('feature:activated', this.handleFeatureActivated.bind(this));
		this.events.on('feature:deactivated', this.handleFeatureDeactivated.bind(this));
		this.events.on('entity:condition:added', this.handleConditionAdded.bind(this));
		this.events.on('entity:condition:removed', this.handleConditionRemoved.bind(this));
	}

	/**
	 * Add an entity to the active session
	 */
	addEntity(entity: Entity): void {
		this.activeEntities.set(entity.id, entity);
		this.entityConditions.set(entity.id, new Set(entity.character?.conditions || []));
		this.events.emit('session:entity:added', { entityId: entity.id });
	}

	/**
	 * Remove an entity from the active session
	 */
	removeEntity(entityId: string): void {
		this.activeEntities.delete(entityId);
		this.entityConditions.delete(entityId);

		// Remove all active features for this entity
		for (const [featureId, feature] of this.activeFeatures.entries()) {
			if (feature.entityId === entityId) {
				this.activeFeatures.delete(featureId);
			}
		}

		this.events.emit('session:entity:removed', { entityId });
	}

	/**
	 * Get an active entity by ID
	 */
	getEntity(entityId: string): Entity | undefined {
		return this.activeEntities.get(entityId);
	}

	/**
	 * Get all active entities
	 */
	getAllEntities(): Entity[] {
		return Array.from(this.activeEntities.values());
	}

	/**
	 * Get active conditions for an entity
	 */
	getConditions(entityId: string): string[] {
		const conditions = this.entityConditions.get(entityId);
		return conditions ? Array.from(conditions) : [];
	}

	/**
	 * Check if an entity has a condition
	 */
	hasCondition(entityId: string, condition: string): boolean {
		const conditions = this.entityConditions.get(entityId);
		return conditions ? conditions.has(condition) : false;
	}

	/**
	 * Add a condition to an entity
	 */
	addCondition(entityId: string, condition: string): void {
		const entity = this.activeEntities.get(entityId);
		if (!entity) return;

		// Add to session state
		let conditions = this.entityConditions.get(entityId);
		if (!conditions) {
			conditions = new Set();
			this.entityConditions.set(entityId, conditions);
		}
		conditions.add(condition);

		// Add to entity
		if (!entity.character) entity.character = {};
		if (!entity.character.conditions) entity.character.conditions = [];
		if (!entity.character.conditions.includes(condition)) {
			entity.character.conditions.push(condition);
			entity.metadata.updatedAt = Date.now();
		}

		this.events.emit('session:condition:added', { entityId, condition });
	}

	/**
	 * Remove a condition from an entity
	 */
	removeCondition(entityId: string, condition: string): void {
		const entity = this.activeEntities.get(entityId);
		if (!entity) return;

		// Remove from session state
		const conditions = this.entityConditions.get(entityId);
		if (conditions) {
			conditions.delete(condition);
		}

		// Remove from entity
		if (entity.character?.conditions) {
			entity.character.conditions = entity.character.conditions.filter((c) => c !== condition);
			entity.metadata.updatedAt = Date.now();
		}

		this.events.emit('session:condition:removed', { entityId, condition });
	}

	/**
	 * Get all active features
	 */
	getActiveFeatures(): Record<string, any> {
		const result: Record<string, any> = {};
		for (const [id, feature] of this.activeFeatures.entries()) {
			result[id] = feature;
		}
		return result;
	}

	/**
	 * Get active features for an entity
	 */
	getActiveFeaturesForEntity(entityId: string): Record<string, any> {
		const result: Record<string, any> = {};
		for (const [id, feature] of this.activeFeatures.entries()) {
			if (feature.entityId === entityId) {
				result[id] = feature;
			}
		}
		return result;
	}

	/**
	 * Advance to the next combat turn
	 */
	nextTurn(): void {
		this.turnCounter++;
		this.events.emit('session:turn:advanced', { turn: this.turnCounter });

		// Check for feature expirations
		this.checkFeatureExpirations();
	}

	/**
	 * Advance to the next combat round
	 */
	nextRound(): void {
		this.roundCounter++;
		this.turnCounter = 0;
		this.events.emit('session:round:advanced', { round: this.roundCounter });

		// Check for feature expirations
		this.checkFeatureExpirations();
	}

	/**
	 * Reset the session state
	 */
	reset(): void {
		this.activeEntities.clear();
		this.entityConditions.clear();
		this.activeFeatures.clear();
		this.turnCounter = 0;
		this.roundCounter = 0;
		this.events.emit('session:reset', {});
	}

	// Private methods

	private handleFeatureActivated(data: any): void {
		const { activationId, featureId, entityId, duration, options } = data;

		this.activeFeatures.set(activationId, {
			featureId,
			entityId,
			startTime: Date.now(),
			duration,
			options
		});
	}

	private handleFeatureDeactivated(data: any): void {
		const { activationId } = data;
		this.activeFeatures.delete(activationId);
	}

	private handleConditionAdded(data: any): void {
		const { entityId, condition } = data;
		this.addCondition(entityId, condition);
	}

	private handleConditionRemoved(data: any): void {
		const { entityId, condition } = data;
		this.removeCondition(entityId, condition);
	}

	private checkFeatureExpirations(): void {
		const currentRound = this.roundCounter;

		for (const [id, feature] of this.activeFeatures.entries()) {
			// Check round-based durations
			if (feature.duration && feature.startTime + feature.duration <= currentRound) {
				this.events.emit('feature:expired', {
					activationId: id,
					featureId: feature.featureId,
					entityId: feature.entityId
				});
			}
		}
	}
}
