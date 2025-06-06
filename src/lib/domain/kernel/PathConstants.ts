/**
 * Path Constants with Vercel Build Workaround
 *
 * This file defines path constants using dynamic construction to prevent
 * Vercel's file tracer from attempting to access system paths during build.
 *
 * The paths are constructed at runtime to avoid static analysis.
 */

// Use string concatenation to prevent static analysis
const PATH_PREFIX = 'v_';

export const VIRTUAL_PATHS = {
	// Device directories
	DEV: `/${PATH_PREFIX}dev`,
	PROC: `/${PATH_PREFIX}proc`,
	SYS: `/${PATH_PREFIX}sys`,
	ETC: `/${PATH_PREFIX}etc`,
	VAR: `/${PATH_PREFIX}var`,
	TMP: `/${PATH_PREFIX}tmp`,
	BIN: `/${PATH_PREFIX}bin`,
	HOME: `/${PATH_PREFIX}home`,
	PIPES: `/${PATH_PREFIX}pipes`,
	ENTITY: `/${PATH_PREFIX}entity`,

	// Specific paths
	PROC_CHARACTER: `/${PATH_PREFIX}proc/character`,
	DEV_DB: `/${PATH_PREFIX}dev/db`,
	DEV_ABILITY: `/${PATH_PREFIX}dev/ability`,
	DEV_SKILL: `/${PATH_PREFIX}dev/skill`,
	DEV_COMBAT: `/${PATH_PREFIX}dev/combat`,
	DEV_CONDITION: `/${PATH_PREFIX}dev/condition`,
	DEV_BONUS: `/${PATH_PREFIX}dev/bonus`,
	DEV_CHARACTER: `/${PATH_PREFIX}dev/character`,

	// Schema paths
	ETC_SCHEMA: `/${PATH_PREFIX}etc/schema`,
	ETC_SCHEMA_ABILITY: `/${PATH_PREFIX}etc/schema/ability`,
	ETC_SCHEMA_CLASS: `/${PATH_PREFIX}etc/schema/class`,
	ETC_SCHEMA_FEAT: `/${PATH_PREFIX}etc/schema/feat`,
	ETC_SCHEMA_SKILL: `/${PATH_PREFIX}etc/schema/skill`,

	// Process paths
	PROC_PLUGINS: `/${PATH_PREFIX}proc/plugins`,
	PROC_SIGNALS: `/${PATH_PREFIX}proc/signals`,
	PROC_FEATURES: `/${PATH_PREFIX}proc/features`,
	PROC_ABILITY: `/${PATH_PREFIX}proc/ability`,

	// Config paths
	ETC_PLUGINS: `/${PATH_PREFIX}etc/plugins`,
	ETC_DB_DIRS_READY: `/${PATH_PREFIX}etc/db_dirs_ready`,
	ETC_CONFIG: `/${PATH_PREFIX}etc/config.json`,

	// Variable paths
	VAR_LOG: `/${PATH_PREFIX}var/log`,
	VAR_RUN: `/${PATH_PREFIX}var/run`,
	VAR_LOG_APP: `/${PATH_PREFIX}var/log/app.log`,
	VAR_LOG_CHARACTER_ASSEMBLER: `/${PATH_PREFIX}var/log/character-assembler.log`,

	// Pipe paths
	PIPES_SYSTEM: `/${PATH_PREFIX}pipes/system`,
	PIPES_GAME_EVENTS: `/${PATH_PREFIX}pipes/game_events`,
	PIPES_ENTITY_EVENTS: `/${PATH_PREFIX}pipes/entity_events`,
	PIPES_FEATURE_EVENTS: `/${PATH_PREFIX}pipes/feature_events`,

	// System paths
	SYS_CLASS: `/${PATH_PREFIX}sys/class`,
	SYS_DEVICES: `/${PATH_PREFIX}sys/devices`
} as const;

// Helper function to get entity path
export function getEntityPath(entityType: string, entityId: string | number): string {
	return `${VIRTUAL_PATHS.ENTITY}/${entityType}/${entityId}`;
}

// Helper function to get character path
export function getCharacterPath(characterId: string | number): string {
	return `${VIRTUAL_PATHS.PROC_CHARACTER}/${characterId}`;
}

// Helper function to get device path
export function getDevicePath(deviceName: string): string {
	return `${VIRTUAL_PATHS.DEV}/${deviceName}`;
}
