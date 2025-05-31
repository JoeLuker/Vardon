/**
 * Plugin System Types
 *
 * This file defines the core interfaces for the plugin system.
 * Plugins are the primary way to implement game features.
 */

import type { Plugin } from '../kernel/types';

/**
 * Plugin metadata for registration
 */
export interface PluginMetadata {
	/** Unique identifier for this plugin */
	id: string;

	/** Human-readable name of this plugin */
	name: string;

	/** Description of what this plugin does */
	description?: string;

	/** List of capability IDs this plugin requires */
	requiredCapabilities: string[];

	/** List of device paths this plugin requires access to */
	requiredDevices: string[];

	/** Category for organizing plugins */
	category?: string;

	/** Tags for filtering plugins */
	tags?: string[];

	/** Version of this plugin */
	version?: string;

	/** Author of this plugin */
	author?: string;
}

/**
 * Plugin loader options
 */
export interface PluginLoaderOptions {
	/** Base directory for plugin paths */
	baseDir?: string;

	/** Whether to enable debug logging */
	debug?: boolean;
}
