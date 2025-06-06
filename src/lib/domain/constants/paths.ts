/**
 * Central path constants for the Unix-style virtual filesystem
 * This file prevents magic strings scattered throughout the codebase
 */

export const VFSPATHS = {
	// Root directories
	ROOT: '/',
	DEV: '/v_dev',
	PROC: '/v_proc',
	ENTITY: '/v_entity',
	ETC: '/v_etc',
	BIN: '/v_bin',
	VAR: '/v_var',
	TMP: '/v_tmp',
	HOME: '/v_home',
	PIPES: '/v_pipes',
	SYS: '/v_sys',

	// Device paths
	DEVICES: {
		ABILITY: '/v_dev/ability',
		SKILL: '/v_dev/skill',
		COMBAT: '/v_dev/combat',
		CONDITION: '/v_dev/condition',
		BONUS: '/v_dev/bonus',
		CHARACTER: '/v_dev/character',
		DATABASE: '/v_dev/db'
	},

	// Process paths
	PROCESS: {
		CHARACTER: '/v_proc/character',
		CHARACTER_LIST: '/v_proc/character/list',
		ABILITY: '/v_proc/ability',
		PLUGINS: '/v_proc/plugins',
		SIGNALS: '/v_proc/signals'
	},

	// Configuration paths
	CONFIG: {
		SCHEMA: '/v_etc/schema',
		SCHEMA_ABILITY: '/v_etc/schema/ability',
		SCHEMA_CLASS: '/v_etc/schema/class',
		SCHEMA_FEAT: '/v_etc/schema/feat',
		SCHEMA_SKILL: '/v_etc/schema/skill',
		PLUGINS: '/v_etc/plugins',
		DB_READY: '/v_etc/db_dirs_ready'
	},

	// Variable data paths
	VARIABLE: {
		LOG: '/v_var/log',
		RUN: '/v_var/run'
	},

	// System paths
	SYSTEM: {
		CLASS: '/v_sys/class',
		DEVICES: '/v_sys/devices'
	},

	// Named pipes
	PIPES_NAMED: {
		SYSTEM: '/v_pipes/system',
		GAME_EVENTS: '/v_pipes/game_events',
		ENTITY_EVENTS: '/v_pipes/entity_events',
		FEATURE_EVENTS: '/v_pipes/feature_events'
	}
} as const;

// Helper functions for common path operations
export function getCharacterPath(id: number | string): string {
	return `${VFSPATHS.PROCESS.CHARACTER}/${id}`;
}

export function getCharacterLockPath(id: number | string): string {
	return `${VFSPATHS.PROCESS.CHARACTER}/${id}.lock`;
}

export function getEntityPath(type: string, id: number | string): string {
	return `${VFSPATHS.ENTITY}/${type}/${id}`;
}

export function getSchemaPath(type: string): string {
	return `${VFSPATHS.CONFIG.SCHEMA}/${type}`;
}
