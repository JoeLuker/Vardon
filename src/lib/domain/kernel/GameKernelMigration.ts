/**
 * Migration helper to transition from GameKernel to GameKernelRefactored
 *
 * This file provides a wrapper that maintains backward compatibility
 * while using the new modular architecture internally.
 */

import { GameKernelRefactored } from './GameKernelRefactored';
import type { KernelOptions } from './types';

/**
 * GameKernel - Backward compatible wrapper around GameKernelRefactored
 *
 * @deprecated Use GameKernelRefactored directly for new code
 */
export class GameKernel extends GameKernelRefactored {
	constructor(options: KernelOptions = {}) {
		super(options);

		if (options.debug) {
			console.log('[GameKernel] Using refactored kernel with backward compatibility');
		}
	}
}

/**
 * Factory function to create kernel instance
 * Allows easy switching between implementations
 */
export function createGameKernel(options: KernelOptions = {}): GameKernelRefactored {
	return new GameKernelRefactored(options);
}
