/**
 * Plugin Filesystem Interface
 *
 * This module implements a Unix-style filesystem abstraction for plugins.
 * It represents plugins as files in a virtual filesystem, following Unix principles where
 * "everything is a file".
 *
 * Plugins are accessed via paths like:
 * - /bin/{pluginId} - Executable plugins
 * - /proc/plugins/{pluginId} - Plugin metadata and status
 */

import type { Plugin } from '../kernel/types';
import { ErrorCode, OpenMode } from '../kernel/types';
import type { PluginMetadata } from './types';
import type { GameKernel } from '../kernel/GameKernel';

/**
 * Constants for plugin filesystem paths
 */
export const PLUGIN_PATHS = {
	/** Base path for plugin executables */
	BIN: '/bin',

	/** Base path for plugin process information */
	PROC_PLUGINS: '/proc/plugins',

	/** Base path for plugin configuration */
	ETC_PLUGINS: '/etc/plugins'
};

/**
 * Interface for the plugin filesystem operations
 */
export interface PluginFilesystem {
	/**
	 * Mount a plugin at the appropriate path in the filesystem
	 * @param plugin The plugin to mount
	 * @returns ErrorCode indicating success (0) or failure
	 */
	mountPlugin(plugin: Plugin): ErrorCode;

	/**
	 * Unmount a plugin from the filesystem
	 * @param pluginId The ID of the plugin to unmount
	 * @returns ErrorCode indicating success (0) or failure
	 */
	unmountPlugin(pluginId: string): ErrorCode;

	/**
	 * Check if a plugin is mounted at the given path
	 * @param pluginPath The full path to the plugin
	 * @returns True if a plugin exists at the path
	 */
	existsPlugin(pluginPath: string): boolean;

	/**
	 * Get a file descriptor for the plugin executable
	 * @param pluginPath The path to the plugin
	 * @param mode The open mode (usually EXEC)
	 * @returns A file descriptor or negative error code
	 */
	openPlugin(pluginPath: string, mode: OpenMode): number;

	/**
	 * Execute a plugin on an entity
	 * @param pluginPath The path to the plugin
	 * @param entityPath The path to the entity
	 * @param options Plugin execution options
	 * @returns Promise resolving to execution result
	 */
	executePlugin(
		pluginPath: string,
		entityPath: string,
		options?: Record<string, any>
	): Promise<any>;

	/**
	 * List all plugins in a directory
	 * @param directoryPath The directory to list (e.g., /bin)
	 * @returns Array of plugin paths
	 */
	listPlugins(directoryPath: string): string[];

	/**
	 * Get metadata for a plugin
	 * @param pluginPath The path to the plugin
	 * @returns Plugin metadata or null if not found
	 */
	getPluginMetadata(pluginPath: string): PluginMetadata | null;
}

/**
 * Implementation of the plugin filesystem
 */
export class DefaultPluginFilesystem implements PluginFilesystem {
	/** The kernel instance used for operations */
	private readonly kernel: GameKernel;

	/** Map to track mounted plugins */
	private readonly mountedPlugins: Map<string, Plugin> = new Map();

	/** Debug logging flag */
	private readonly debug: boolean;

	/**
	 * Create a new plugin filesystem
	 * @param kernel The kernel instance
	 * @param debug Whether to enable debug logging
	 */
	constructor(kernel: GameKernel, debug = false) {
		this.kernel = kernel;
		this.debug = debug;

		// Create the base directories in the filesystem
		this.createBaseDirectories();
	}

	/**
	 * Create the base directories for the plugin filesystem
	 */
	private createBaseDirectories(): void {
		const directories = [PLUGIN_PATHS.BIN, PLUGIN_PATHS.PROC_PLUGINS, PLUGIN_PATHS.ETC_PLUGINS];

		for (const dir of directories) {
			if (!this.kernel.exists(dir)) {
				this.kernel.mkdir(dir);
				this.log(`Created directory: ${dir}`);
			}
		}
	}

	/**
	 * Mount a plugin at the appropriate path in the filesystem
	 * @param plugin The plugin to mount
	 * @returns ErrorCode indicating success (0) or failure
	 */
	mountPlugin(plugin: Plugin): ErrorCode {
		try {
			if (!plugin || !plugin.id) {
				this.error('Cannot mount plugin: invalid plugin or missing ID');
				return -1; // ERROR_INVALID_ARGUMENT
			}

			if (this.mountedPlugins.has(plugin.id)) {
				this.error(`Plugin already mounted: ${plugin.id}`);
				return -2; // ERROR_ALREADY_EXISTS
			}

			// Store the plugin in the mounted plugins map
			this.mountedPlugins.set(plugin.id, plugin);

			// Create executable path in /bin
			const binPath = `${PLUGIN_PATHS.BIN}/${plugin.id}`;

			// Create process info path in /proc/plugins
			const procPath = `${PLUGIN_PATHS.PROC_PLUGINS}/${plugin.id}`;

			// Create the /proc entry with plugin metadata
			const metadata: PluginMetadata = {
				id: plugin.id,
				name: plugin.name,
				description: plugin.description,
				requiredDevices: plugin.requiredDevices,
				version: (plugin as any).version || '1.0.0',
				author: (plugin as any).author || 'Unknown'
			};

			// Write metadata to /proc/plugins/{pluginId}
			const fd = this.kernel.open(procPath, OpenMode.WRITE_CREATE);
			if (fd < 0) {
				this.error(`Failed to create plugin proc entry: ${procPath}`);
				return fd; // Return error code
			}

			const writeResult = this.kernel.write(fd, metadata);
			this.kernel.close(fd);

			if (writeResult !== 0) {
				this.error(`Failed to write plugin metadata: ${writeResult}`);
				return writeResult;
			}

			this.log(`Mounted plugin: ${plugin.id} at ${binPath}`);
			return 0; // SUCCESS
		} catch (error) {
			this.error(`Error mounting plugin: ${error}`);
			return -99; // ERROR_UNKNOWN
		}
	}

	/**
	 * Unmount a plugin from the filesystem
	 * @param pluginId The ID of the plugin to unmount
	 * @returns ErrorCode indicating success (0) or failure
	 */
	unmountPlugin(pluginId: string): ErrorCode {
		try {
			if (!this.mountedPlugins.has(pluginId)) {
				this.error(`Cannot unmount plugin: ${pluginId} not found`);
				return -1; // ERROR_NOT_FOUND
			}

			// Remove from mounted plugins map
			this.mountedPlugins.delete(pluginId);

			// Remove /proc entry
			const procPath = `${PLUGIN_PATHS.PROC_PLUGINS}/${pluginId}`;
			if (this.kernel.exists(procPath)) {
				this.kernel.unlink(procPath);
			}

			this.log(`Unmounted plugin: ${pluginId}`);
			return 0; // SUCCESS
		} catch (error) {
			this.error(`Error unmounting plugin: ${error}`);
			return -99; // ERROR_UNKNOWN
		}
	}

	/**
	 * Check if a plugin is mounted at the given path
	 * @param pluginPath The full path to the plugin
	 * @returns True if a plugin exists at the path
	 */
	existsPlugin(pluginPath: string): boolean {
		// Extract plugin ID from path
		const pluginId = this.extractPluginId(pluginPath);
		if (!pluginId) return false;

		return this.mountedPlugins.has(pluginId);
	}

	/**
	 * Get a file descriptor for the plugin executable
	 * @param pluginPath The path to the plugin
	 * @param mode The open mode (usually EXEC)
	 * @returns A file descriptor or negative error code
	 */
	openPlugin(pluginPath: string, mode: OpenMode): number {
		// Extract plugin ID from path
		const pluginId = this.extractPluginId(pluginPath);
		if (!pluginId) {
			this.error(`Invalid plugin path: ${pluginPath}`);
			return -1; // ERROR_INVALID_ARGUMENT
		}

		// Check if plugin exists
		if (!this.mountedPlugins.has(pluginId)) {
			this.error(`Plugin not found: ${pluginId}`);
			return -2; // ERROR_NOT_FOUND
		}

		// For plugins, we don't actually return a real file descriptor
		// Instead, we return a special value that represents the plugin
		// This value will be recognized by the kernel for plugin execution
		return 1000 + this.mountedPlugins.size; // Plugin "file descriptors" start at 1000
	}

	/**
	 * Execute a plugin on an entity
	 * @param pluginPath The path to the plugin
	 * @param entityPath The path to the entity
	 * @param options Plugin execution options
	 * @returns Promise resolving to execution result
	 */
	async executePlugin(
		pluginPath: string,
		entityPath: string,
		options: Record<string, any> = {}
	): Promise<any> {
		// Extract plugin ID from path
		const pluginId = this.extractPluginId(pluginPath);
		if (!pluginId) {
			throw new Error(`Invalid plugin path: ${pluginPath}`);
		}

		// Get the plugin
		const plugin = this.mountedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin not found: ${pluginId}`);
		}

		// Check if entity exists
		if (!this.kernel.exists(entityPath)) {
			throw new Error(`Entity not found: ${entityPath}`);
		}

		// Check required devices
		for (const devicePath of plugin.requiredDevices) {
			if (!this.kernel.exists(devicePath)) {
				throw new Error(`Missing required device for plugin ${pluginId}: ${devicePath}`);
			}
		}

		this.log(`Executing plugin ${pluginId} on entity ${entityPath}`);

		try {
			// Execute the plugin
			const exitCode = await plugin.execute(this.kernel, entityPath, options);

			if (exitCode !== 0) {
				throw new Error(`Plugin exited with code: ${exitCode}`);
			}

			// Get updated entity
			const fd = this.kernel.open(entityPath, OpenMode.READ);
			if (fd < 0) {
				throw new Error(`Failed to open entity file: ${entityPath}`);
			}

			try {
				// Read entity data
				const [result, entityData] = this.kernel.read(fd);

				if (result !== 0) {
					throw new Error(`Failed to read entity data: ${result}`);
				}

				return entityData;
			} finally {
				// Always close the file descriptor
				this.kernel.close(fd);
			}
		} catch (error) {
			this.error(`Error executing plugin ${pluginId} on entity ${entityPath}`, error);
			throw error;
		}
	}

	/**
	 * List all plugins in a directory
	 * @param directoryPath The directory to list (e.g., /bin)
	 * @returns Array of plugin paths
	 */
	listPlugins(directoryPath: string): string[] {
		// Validate directory
		if (
			directoryPath !== PLUGIN_PATHS.BIN &&
			directoryPath !== PLUGIN_PATHS.PROC_PLUGINS &&
			directoryPath !== PLUGIN_PATHS.ETC_PLUGINS
		) {
			this.error(`Invalid plugin directory: ${directoryPath}`);
			return [];
		}

		// Return paths based on the requested directory
		return Array.from(this.mountedPlugins.keys()).map((pluginId) => {
			if (directoryPath === PLUGIN_PATHS.BIN) {
				return `${PLUGIN_PATHS.BIN}/${pluginId}`;
			} else if (directoryPath === PLUGIN_PATHS.PROC_PLUGINS) {
				return `${PLUGIN_PATHS.PROC_PLUGINS}/${pluginId}`;
			} else {
				return `${PLUGIN_PATHS.ETC_PLUGINS}/${pluginId}`;
			}
		});
	}

	/**
	 * Get metadata for a plugin
	 * @param pluginPath The path to the plugin
	 * @returns Plugin metadata or null if not found
	 */
	getPluginMetadata(pluginPath: string): PluginMetadata | null {
		// Extract plugin ID from path
		const pluginId = this.extractPluginId(pluginPath);
		if (!pluginId) {
			this.error(`Invalid plugin path: ${pluginPath}`);
			return null;
		}

		// Get the plugin
		const plugin = this.mountedPlugins.get(pluginId);
		if (!plugin) {
			this.error(`Plugin not found: ${pluginId}`);
			return null;
		}

		// Create metadata from plugin
		return {
			id: plugin.id,
			name: plugin.name,
			description: plugin.description,
			requiredDevices: plugin.requiredDevices,
			version: (plugin as any).version || '1.0.0',
			author: (plugin as any).author || 'Unknown'
		};
	}

	/**
	 * Extract plugin ID from a path
	 * @param path The path to extract from
	 * @returns Plugin ID or null if invalid
	 */
	private extractPluginId(path: string): string | null {
		// Check if path is in one of the plugin directories
		if (path.startsWith(PLUGIN_PATHS.BIN + '/')) {
			return path.substring(PLUGIN_PATHS.BIN.length + 1);
		} else if (path.startsWith(PLUGIN_PATHS.PROC_PLUGINS + '/')) {
			return path.substring(PLUGIN_PATHS.PROC_PLUGINS.length + 1);
		} else if (path.startsWith(PLUGIN_PATHS.ETC_PLUGINS + '/')) {
			return path.substring(PLUGIN_PATHS.ETC_PLUGINS.length + 1);
		}

		return null;
	}

	/**
	 * Log a debug message
	 * @param message Message to log
	 * @param data Optional data to log
	 */
	private log(message: string, data?: any): void {
		if (this.debug) {
			if (data !== undefined) {
				console.log(`[PluginFilesystem] ${message}`, data);
			} else {
				console.log(`[PluginFilesystem] ${message}`);
			}
		}
	}

	/**
	 * Log an error message
	 * @param message Error message
	 * @param error Optional error object
	 */
	private error(message: string, error?: any): void {
		if (error !== undefined) {
			console.error(`[PluginFilesystem] ${message}`, error);
		} else {
			console.error(`[PluginFilesystem] ${message}`);
		}
	}
}
