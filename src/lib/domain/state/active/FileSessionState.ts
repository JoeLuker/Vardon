/**
 * Unix-style Session State Management
 *
 * This module implements session state management following Unix principles:
 * - Everything is a file
 * - Uses standard file operations
 * - Employs small composable tools
 */

import type { EventBus } from '../../kernel/EventBus';
import type { GameKernel } from '../../kernel/GameKernel';
import type { Entity } from '../../types/EntityTypes';
import { OpenMode, ErrorCode } from '../../kernel/types';

/**
 * Session state directories in the filesystem
 */
export const SESSION_PATHS = {
	SESSION_DIR: '/v_proc/session',
	ACTIVE_DIR: '/v_proc/session/active',
	ENTITIES_DIR: '/v_proc/session/entities',
	FEATURES_DIR: '/v_proc/session/features',
	CONDITIONS_DIR: '/v_proc/session/conditions',
	COUNTERS_DIR: '/v_proc/session/counters'
};

/**
 * Unix-style session state manager
 * Uses the filesystem for state tracking rather than in-memory objects
 */
export class UnixSessionState {
	/**
	 * Create session state manager
	 * @param kernel Kernel for filesystem operations
	 * @param events Event bus for notifications
	 * @param debug Whether to enable debug logging
	 */
	constructor(
		private kernel: GameKernel,
		private events: EventBus,
		private debug: boolean = false
	) {
		this.initializeSessionFilesystem();

		// Subscribe to relevant events
		this.events.on('feature:activated', this.handleFeatureActivated.bind(this));
		this.events.on('feature:deactivated', this.handleFeatureDeactivated.bind(this));
		this.events.on('entity:condition:added', this.handleConditionAdded.bind(this));
		this.events.on('entity:condition:removed', this.handleConditionRemoved.bind(this));
	}

	/**
	 * Initialize the session filesystem structure
	 */
	private initializeSessionFilesystem(): void {
		// Create required directories if they don't exist
		for (const path of Object.values(SESSION_PATHS)) {
			if (!this.kernel.exists(path)) {
				this.kernel.mkdir(path);
				if (this.debug) {
					console.log(`[UnixSessionState] Created directory: ${path}`);
				}
			}
		}

		// Initialize counter files
		const turnCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/turn`;
		const roundCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/round`;

		if (!this.kernel.exists(turnCounterPath)) {
			this.kernel.create(turnCounterPath, { value: 0 });
		}

		if (!this.kernel.exists(roundCounterPath)) {
			this.kernel.create(roundCounterPath, { value: 0 });
		}
	}

	/**
	 * Add an entity to the active session
	 * Follows Unix principle by creating a file for the entity
	 */
	addEntity(entity: Entity): void {
		// Create a symlink in active directory pointing to the entity
		const activePath = `${SESSION_PATHS.ACTIVE_DIR}/${entity.id}`;
		const entityPath = `/v_entity/${entity.id}`;

		// Create a session entry for the entity
		const sessionEntityPath = `${SESSION_PATHS.ENTITIES_DIR}/${entity.id}`;

		// Check if entity already exists in session
		if (this.kernel.exists(activePath)) {
			if (this.debug) {
				console.log(`[UnixSessionState] Entity already active: ${entity.id}`);
			}
			return;
		}

		// Create reference to entity in active directory
		this.kernel.symlink(entityPath, activePath);

		// Create conditions directory for this entity
		const conditionsPath = `${SESSION_PATHS.CONDITIONS_DIR}/${entity.id}`;
		if (!this.kernel.exists(conditionsPath)) {
			this.kernel.mkdir(conditionsPath);
		}

		// Initialize existing conditions
		if (entity.character?.conditions?.length) {
			for (const condition of entity.character.conditions) {
				const conditionPath = `${conditionsPath}/${condition}`;
				this.kernel.create(conditionPath, {
					entityId: entity.id,
					condition,
					appliedAt: Date.now()
				});
			}
		}

		// Create session entity file with metadata
		this.kernel.create(sessionEntityPath, {
			id: entity.id,
			name: entity.name,
			addedAt: Date.now()
		});

		this.events.emit('session:entity:added', { entityId: entity.id });
	}

	/**
	 * Remove an entity from the active session
	 * Follows Unix principle by unlinking files
	 */
	removeEntity(entityId: string): void {
		const activePath = `${SESSION_PATHS.ACTIVE_DIR}/${entityId}`;
		const sessionEntityPath = `${SESSION_PATHS.ENTITIES_DIR}/${entityId}`;
		const conditionsPath = `${SESSION_PATHS.CONDITIONS_DIR}/${entityId}`;

		// Remove from active directory
		if (this.kernel.exists(activePath)) {
			this.kernel.unlink(activePath);
		}

		// Remove from session entities
		if (this.kernel.exists(sessionEntityPath)) {
			this.kernel.unlink(sessionEntityPath);
		}

		// Remove conditions directory
		if (this.kernel.exists(conditionsPath)) {
			// First remove all condition files
			const files = this.kernel.readdir(conditionsPath);
			for (const file of files) {
				this.kernel.unlink(`${conditionsPath}/${file}`);
			}
			// Then remove the directory
			this.kernel.rmdir(conditionsPath);
		}

		// Remove active features for this entity
		const featureDir = SESSION_PATHS.FEATURES_DIR;
		if (this.kernel.exists(featureDir)) {
			const files = this.kernel.readdir(featureDir);
			for (const file of files) {
				const featurePath = `${featureDir}/${file}`;

				// Read feature data
				const fd = this.kernel.open(featurePath, OpenMode.READ);
				if (fd >= 0) {
					try {
						const [result, data] = this.kernel.read(fd);
						if (result === 0 && data && data.entityId === entityId) {
							// This feature belongs to the entity being removed
							this.kernel.unlink(featurePath);
						}
					} finally {
						this.kernel.close(fd);
					}
				}
			}
		}

		this.events.emit('session:entity:removed', { entityId });
	}

	/**
	 * Get an active entity by ID
	 * Follows Unix principle by reading from a file
	 */
	getEntity(entityId: string): Entity | undefined {
		const entityPath = `/v_entity/${entityId}`;

		if (!this.kernel.exists(entityPath)) {
			return undefined;
		}

		const fd = this.kernel.open(entityPath, OpenMode.READ);
		if (fd < 0) {
			return undefined;
		}

		try {
			const [result, entity] = this.kernel.read(fd);
			if (result !== 0) {
				return undefined;
			}

			return entity as Entity;
		} finally {
			this.kernel.close(fd);
		}
	}

	/**
	 * Get all active entities
	 * Follows Unix principle by listing a directory
	 */
	getAllEntities(): Entity[] {
		const activeDir = SESSION_PATHS.ACTIVE_DIR;
		const entities: Entity[] = [];

		if (!this.kernel.exists(activeDir)) {
			return entities;
		}

		const files = this.kernel.readdir(activeDir);

		for (const file of files) {
			const entity = this.getEntity(file);
			if (entity) {
				entities.push(entity);
			}
		}

		return entities;
	}

	/**
	 * Get active conditions for an entity
	 * Follows Unix principle by listing a directory
	 */
	getConditions(entityId: string): string[] {
		const conditionsPath = `${SESSION_PATHS.CONDITIONS_DIR}/${entityId}`;

		if (!this.kernel.exists(conditionsPath)) {
			return [];
		}

		return this.kernel.readdir(conditionsPath);
	}

	/**
	 * Check if an entity has a condition
	 * Follows Unix principle by checking if a file exists
	 */
	hasCondition(entityId: string, condition: string): boolean {
		const conditionPath = `${SESSION_PATHS.CONDITIONS_DIR}/${entityId}/${condition}`;
		return this.kernel.exists(conditionPath);
	}

	/**
	 * Add a condition to an entity
	 * Follows Unix principle by creating a file
	 */
	addCondition(entityId: string, condition: string): void {
		const entity = this.getEntity(entityId);
		if (!entity) return;

		// Ensure conditions directory exists
		const conditionsDir = `${SESSION_PATHS.CONDITIONS_DIR}/${entityId}`;
		if (!this.kernel.exists(conditionsDir)) {
			this.kernel.mkdir(conditionsDir);
		}

		// Create condition file
		const conditionPath = `${conditionsDir}/${condition}`;
		if (!this.kernel.exists(conditionPath)) {
			this.kernel.create(conditionPath, {
				entityId,
				condition,
				appliedAt: Date.now()
			});

			// Update entity
			const entityPath = `/v_entity/${entityId}`;
			const fd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
			if (fd >= 0) {
				try {
					const [readResult, entityData] = this.kernel.read(fd);
					if (readResult === 0) {
						// Add condition to entity
						if (!entityData.character) entityData.character = {};
						if (!entityData.character.conditions) entityData.character.conditions = [];
						if (!entityData.character.conditions.includes(condition)) {
							entityData.character.conditions.push(condition);
							entityData.metadata.updatedAt = Date.now();
							this.kernel.write(fd, entityData);
						}
					}
				} finally {
					this.kernel.close(fd);
				}
			}

			this.events.emit('session:condition:added', { entityId, condition });
		}
	}

	/**
	 * Remove a condition from an entity
	 * Follows Unix principle by deleting a file
	 */
	removeCondition(entityId: string, condition: string): void {
		const conditionPath = `${SESSION_PATHS.CONDITIONS_DIR}/${entityId}/${condition}`;

		if (this.kernel.exists(conditionPath)) {
			this.kernel.unlink(conditionPath);

			// Update entity
			const entityPath = `/v_entity/${entityId}`;
			const fd = this.kernel.open(entityPath, OpenMode.READ_WRITE);
			if (fd >= 0) {
				try {
					const [readResult, entityData] = this.kernel.read(fd);
					if (readResult === 0 && entityData.character?.conditions) {
						// Remove condition from entity
						entityData.character.conditions = entityData.character.conditions.filter(
							(c: string) => c !== condition
						);
						entityData.metadata.updatedAt = Date.now();
						this.kernel.write(fd, entityData);
					}
				} finally {
					this.kernel.close(fd);
				}
			}

			this.events.emit('session:condition:removed', { entityId, condition });
		}
	}

	/**
	 * Get all active features
	 * Follows Unix principle by listing and reading from a directory
	 */
	getActiveFeatures(): Record<string, any> {
		const featuresDir = SESSION_PATHS.FEATURES_DIR;
		const features: Record<string, any> = {};

		if (!this.kernel.exists(featuresDir)) {
			return features;
		}

		const files = this.kernel.readdir(featuresDir);

		for (const file of files) {
			const featurePath = `${featuresDir}/${file}`;
			const fd = this.kernel.open(featurePath, OpenMode.READ);
			if (fd >= 0) {
				try {
					const [result, data] = this.kernel.read(fd);
					if (result === 0) {
						features[file] = data;
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}

		return features;
	}

	/**
	 * Get active features for an entity
	 * Follows Unix principle by filtering files based on their content
	 */
	getActiveFeaturesForEntity(entityId: string): Record<string, any> {
		const features = this.getActiveFeatures();
		const entityFeatures: Record<string, any> = {};

		for (const [id, feature] of Object.entries(features)) {
			if (feature.entityId === entityId) {
				entityFeatures[id] = feature;
			}
		}

		return entityFeatures;
	}

	/**
	 * Advance to the next combat turn
	 * Follows Unix principle by updating a counter file
	 */
	nextTurn(): void {
		const turnCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/turn`;

		// Read current turn
		const fd = this.kernel.open(turnCounterPath, OpenMode.READ_WRITE);
		if (fd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(fd);
				if (readResult === 0) {
					// Increment turn counter
					data.value = (data.value || 0) + 1;
					this.kernel.write(fd, data);

					this.events.emit('session:turn:advanced', { turn: data.value });

					// Check for feature expirations
					this.checkFeatureExpirations();
				}
			} finally {
				this.kernel.close(fd);
			}
		}
	}

	/**
	 * Advance to the next combat round
	 * Follows Unix principle by updating counter files
	 */
	nextRound(): void {
		const roundCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/round`;
		const turnCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/turn`;

		// Read current round
		const roundFd = this.kernel.open(roundCounterPath, OpenMode.READ_WRITE);
		if (roundFd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(roundFd);
				if (readResult === 0) {
					// Increment round counter
					data.value = (data.value || 0) + 1;
					this.kernel.write(roundFd, data);

					// Reset turn counter
					const turnFd = this.kernel.open(turnCounterPath, OpenMode.READ_WRITE);
					if (turnFd >= 0) {
						try {
							const [turnReadResult, turnData] = this.kernel.read(turnFd);
							if (turnReadResult === 0) {
								turnData.value = 0;
								this.kernel.write(turnFd, turnData);
							}
						} finally {
							this.kernel.close(turnFd);
						}
					}

					this.events.emit('session:round:advanced', { round: data.value });

					// Check for feature expirations
					this.checkFeatureExpirations();
				}
			} finally {
				this.kernel.close(roundFd);
			}
		}
	}

	/**
	 * Reset the session state
	 * Follows Unix principle by reinitializing the filesystem
	 */
	reset(): void {
		// Clear active entities
		const activeDir = SESSION_PATHS.ACTIVE_DIR;
		if (this.kernel.exists(activeDir)) {
			const files = this.kernel.readdir(activeDir);
			for (const file of files) {
				this.kernel.unlink(`${activeDir}/${file}`);
			}
		}

		// Clear session entities
		const entitiesDir = SESSION_PATHS.ENTITIES_DIR;
		if (this.kernel.exists(entitiesDir)) {
			const files = this.kernel.readdir(entitiesDir);
			for (const file of files) {
				this.kernel.unlink(`${entitiesDir}/${file}`);
			}
		}

		// Clear conditions (recursively)
		const conditionsDir = SESSION_PATHS.CONDITIONS_DIR;
		if (this.kernel.exists(conditionsDir)) {
			const entityDirs = this.kernel.readdir(conditionsDir);
			for (const entityDir of entityDirs) {
				const entityPath = `${conditionsDir}/${entityDir}`;
				const conditionFiles = this.kernel.readdir(entityPath);
				for (const file of conditionFiles) {
					this.kernel.unlink(`${entityPath}/${file}`);
				}
				this.kernel.rmdir(entityPath);
			}
		}

		// Clear features
		const featuresDir = SESSION_PATHS.FEATURES_DIR;
		if (this.kernel.exists(featuresDir)) {
			const files = this.kernel.readdir(featuresDir);
			for (const file of files) {
				this.kernel.unlink(`${featuresDir}/${file}`);
			}
		}

		// Reset counters
		const turnCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/turn`;
		const roundCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/round`;

		const turnFd = this.kernel.open(turnCounterPath, OpenMode.READ_WRITE);
		if (turnFd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(turnFd);
				if (readResult === 0) {
					data.value = 0;
					this.kernel.write(turnFd, data);
				}
			} finally {
				this.kernel.close(turnFd);
			}
		}

		const roundFd = this.kernel.open(roundCounterPath, OpenMode.READ_WRITE);
		if (roundFd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(roundFd);
				if (readResult === 0) {
					data.value = 0;
					this.kernel.write(roundFd, data);
				}
			} finally {
				this.kernel.close(roundFd);
			}
		}

		this.events.emit('session:reset', {});
	}

	/**
	 * Current round number
	 * Follows Unix principle by reading from a counter file
	 */
	getCurrentRound(): number {
		const roundCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/round`;

		const fd = this.kernel.open(roundCounterPath, OpenMode.READ);
		if (fd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(fd);
				if (readResult === 0) {
					return data.value || 0;
				}
			} finally {
				this.kernel.close(fd);
			}
		}

		return 0;
	}

	/**
	 * Current turn number
	 * Follows Unix principle by reading from a counter file
	 */
	getCurrentTurn(): number {
		const turnCounterPath = `${SESSION_PATHS.COUNTERS_DIR}/turn`;

		const fd = this.kernel.open(turnCounterPath, OpenMode.READ);
		if (fd >= 0) {
			try {
				const [readResult, data] = this.kernel.read(fd);
				if (readResult === 0) {
					return data.value || 0;
				}
			} finally {
				this.kernel.close(fd);
			}
		}

		return 0;
	}

	// Event handlers

	private handleFeatureActivated(data: any): void {
		const { activationId, featureId, entityId, duration, options } = data;

		const featurePath = `${SESSION_PATHS.FEATURES_DIR}/${activationId}`;

		this.kernel.create(featurePath, {
			featureId,
			entityId,
			startTime: Date.now(),
			duration,
			options
		});
	}

	private handleFeatureDeactivated(data: any): void {
		const { activationId } = data;
		const featurePath = `${SESSION_PATHS.FEATURES_DIR}/${activationId}`;

		if (this.kernel.exists(featurePath)) {
			this.kernel.unlink(featurePath);
		}
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
		const currentRound = this.getCurrentRound();
		const featuresDir = SESSION_PATHS.FEATURES_DIR;

		if (!this.kernel.exists(featuresDir)) {
			return;
		}

		const files = this.kernel.readdir(featuresDir);

		for (const file of files) {
			const featurePath = `${featuresDir}/${file}`;
			const fd = this.kernel.open(featurePath, OpenMode.READ);
			if (fd >= 0) {
				try {
					const [result, feature] = this.kernel.read(fd);
					if (result === 0) {
						// Check round-based durations
						if (feature.duration && feature.startTime + feature.duration <= currentRound) {
							this.events.emit('feature:expired', {
								activationId: file,
								featureId: feature.featureId,
								entityId: feature.entityId
							});
						}
					}
				} finally {
					this.kernel.close(fd);
				}
			}
		}
	}
}
