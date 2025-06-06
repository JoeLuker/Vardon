/**
 * CacheService - Simple in-memory cache with TTL
 * Does ONE thing: caches data with expiration
 */

import { logger } from '../utils/Logger';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export class CacheService {
	private cache = new Map<string, CacheEntry<any>>();
	private defaultTTL = 5 * 60 * 1000; // 5 minutes

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);

		if (!entry) {
			return null;
		}

		// Check if expired
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.cache.delete(key);
			logger.debug('CacheService', 'get', `Cache expired for key: ${key}`);
			return null;
		}

		logger.debug('CacheService', 'get', `Cache hit for key: ${key}`);
		return entry.data;
	}

	set<T>(key: string, data: T, ttl?: number): void {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
			ttl: ttl || this.defaultTTL
		});

		logger.debug('CacheService', 'set', `Cached data for key: ${key}`);
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
		logger.info('CacheService', 'clear', 'Cache cleared');
	}

	// Clean up expired entries
	cleanup(): void {
		const now = Date.now();
		let cleaned = 0;

		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.cache.delete(key);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			logger.info('CacheService', 'cleanup', `Cleaned ${cleaned} expired entries`);
		}
	}
}
