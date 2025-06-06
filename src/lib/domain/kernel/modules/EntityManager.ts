import type { Entity, PathResult } from '../types';
import { ErrorCode } from '../types';
import { VIRTUAL_PATHS } from '../PathConstants';

/**
 * Manages entity registration and retrieval
 */
export class EntityManager {
	private readonly entities: Map<string, Entity> = new Map();
	private readonly debug: boolean;

	constructor(debug: boolean = false) {
		this.debug = debug;
	}

	/**
	 * Register an entity
	 */
	register(entity: Entity): PathResult {
		if (!entity.id) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Entity must have an ID',
				path: ''
			};
		}

		// Store entity
		this.entities.set(entity.id, entity);

		// Generate entity path
		const entityPath = `${VIRTUAL_PATHS.ENTITY}/${entity.id}`;

		if (this.debug) {
			console.log(`[EntityManager] Registered entity: ${entity.id} (${entity.name})`);
		}

		return {
			success: true,
			path: entityPath
		};
	}

	/**
	 * Unregister an entity
	 */
	unregister(entityId: string): ErrorCode {
		if (!this.entities.has(entityId)) {
			return ErrorCode.ENOENT;
		}

		this.entities.delete(entityId);

		if (this.debug) {
			console.log(`[EntityManager] Unregistered entity: ${entityId}`);
		}

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get an entity by ID
	 */
	getEntity(entityId: string): Entity | undefined {
		return this.entities.get(entityId);
	}

	/**
	 * Get all entities
	 */
	getAllEntities(): Entity[] {
		return Array.from(this.entities.values());
	}

	/**
	 * Get entities by type
	 */
	getEntitiesByType(type: string): Entity[] {
		return Array.from(this.entities.values()).filter((entity) => entity.type === type);
	}

	/**
	 * Check if entity exists
	 */
	exists(entityId: string): boolean {
		return this.entities.has(entityId);
	}

	/**
	 * Get entity count
	 */
	getCount(): number {
		return this.entities.size;
	}

	/**
	 * Clear all entities
	 */
	clear(): void {
		this.entities.clear();
		if (this.debug) {
			console.log('[EntityManager] Cleared all entities');
		}
	}
}
