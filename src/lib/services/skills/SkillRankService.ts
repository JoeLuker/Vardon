/**
 * Skill Rank Service - Handles skill rank operations
 *
 * Following Unix principle: do one thing well
 * This service is responsible for skill rank updates and calculations
 */

import type { GameKernel } from '$lib/domain/kernel/GameKernel';
import { logger } from '$lib/utils/Logger';

export interface SkillRankUpdate {
	characterId: number;
	skillId: number;
	level: number;
	isAdding: boolean;
}

export interface SkillRankResult {
	success: boolean;
	error?: string;
}

export class SkillRankService {
	private kernel: GameKernel;
	private pendingOperations: Map<string, { type: string; timestamp: number }> = new Map();
	private operationErrors: Map<string, { message: string; expiresAt: number }> = new Map();

	constructor(kernel: GameKernel) {
		this.kernel = kernel;
	}

	/**
	 * Update a skill rank
	 */
	async updateSkillRank(update: SkillRankUpdate): Promise<SkillRankResult> {
		const { characterId, skillId, level, isAdding } = update;
		const key = this.getSkillLevelKey(skillId, level);

		// Mark operation as pending
		this.pendingOperations.set(key, {
			type: isAdding ? 'add' : 'remove',
			timestamp: Date.now()
		});

		try {
			// TODO: Implement database update for skill ranks
			// For now, just log the action
			logger.info(
				'SkillRankService',
				'updateSkillRank',
				`Would ${isAdding ? 'add' : 'remove'} skill rank`,
				{
					characterId,
					skillId,
					level
				}
			);

			// Simulate success
			this.pendingOperations.delete(key);
			return { success: true };
		} catch (error: any) {
			// Store error
			this.operationErrors.set(key, {
				message: error.message,
				expiresAt: Date.now() + 30000 // 30 seconds
			});

			this.pendingOperations.delete(key);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Check if an operation is pending
	 */
	isOperationPending(skillId: number, level: number): boolean {
		const key = this.getSkillLevelKey(skillId, level);
		return this.pendingOperations.has(key);
	}

	/**
	 * Get error for a specific operation
	 */
	getOperationError(skillId: number, level: number): string | null {
		const key = this.getSkillLevelKey(skillId, level);
		const errorInfo = this.operationErrors.get(key);

		if (!errorInfo) return null;

		// Check if error has expired
		if (Date.now() > errorInfo.expiresAt) {
			this.operationErrors.delete(key);
			return null;
		}

		return errorInfo.message;
	}

	/**
	 * Get key for skill-level pair
	 */
	private getSkillLevelKey(skillId: number, level: number): string {
		return `${skillId}-${level}`;
	}

	/**
	 * Clear all pending operations
	 */
	clearPendingOperations(): void {
		this.pendingOperations.clear();
	}

	/**
	 * Clear expired errors
	 */
	clearExpiredErrors(): void {
		const now = Date.now();
		for (const [key, errorInfo] of this.operationErrors.entries()) {
			if (now > errorInfo.expiresAt) {
				this.operationErrors.delete(key);
			}
		}
	}

	/**
	 * Get all pending operations
	 */
	getPendingOperations(): Map<string, { type: string; timestamp: number }> {
		return new Map(this.pendingOperations);
	}

	/**
	 * Get all operation errors
	 */
	getOperationErrors(): Map<string, { message: string; expiresAt: number }> {
		return new Map(this.operationErrors);
	}
}
