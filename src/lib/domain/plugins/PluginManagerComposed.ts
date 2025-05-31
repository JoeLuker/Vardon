/**
 * Plugin Manager (Composed)
 *
 * This module implements the plugin manager using Unix composition principles.
 * Following the "everything is a file" philosophy, the plugin manager interacts
 * with plugins through a filesystem-like interface.
 *
 * Responsibilities:
 * 1. Registering executable plugins (like /bin directory in Unix)
 * 2. Orchestrating plugin execution (like init/systemd in Unix)
 * 3. Managing plugin dependencies on devices (like checking device availability)
 */

import type { Entity, Plugin, OpenMode, ErrorCode } from '../kernel/types';
import type { PluginMetadata } from './types';
import type { GameKernel } from '../kernel/GameKernel';
import { DefaultPluginFilesystem, PLUGIN_PATHS, type PluginFilesystem } from './PluginFilesystem';

/**
 * Plugin manager context shared by all operations
 */
interface PluginManagerContext {
	/** Whether debug logging is enabled */
	debug: boolean;

	/** Reference to the kernel for file operations */
	kernel: GameKernel;

	/** The plugin filesystem abstraction */
	filesystem: PluginFilesystem;

	/** Map of open file descriptors by path */
	openFiles: Map<string, number>;
}

/**
 * Plugin manager operations available to clients
 */
export interface PluginManager {
	/** Register a plugin in the filesystem */
	registerPlugin(plugin: Plugin): void;

	/** Get a plugin by ID */
	getPlugin(pluginId: string): Plugin | undefined;

	/** Check if a plugin is registered */
	hasPlugin(pluginId: string): boolean;

	/** Check if a device (capability) is mounted at the specified path */
	hasDevice(devicePath: string): boolean;

	/** Get metadata for all registered plugins */
	getAllPluginMetadata(): PluginMetadata[];

	/** Get all registered plugins */
	getAllPlugins(): Plugin[];

	/** Get all mounted devices (capabilities) */
	getAllDevicePaths(): string[];

	/** Get plugins that require a specific device */
	getPluginsByDevice(devicePath: string): Plugin[];

	/** Check required devices for a plugin */
	checkRequiredDevices(pluginId: string): string[];

	/** Execute a plugin on an entity */
	executePlugin(entityId: string, pluginId: string, options?: Record<string, any>): Promise<any>;

	/** Shutdown the plugin manager */
	shutdown(): Promise<void>;

	/** Get entity data from path */
	getEntityData(entityPath: string): Entity | null;
}

/**
 * Options for creating a plugin manager
 */
export interface PluginManagerOptions {
	/** Whether to enable debug logging */
	debug?: boolean;

	/** Required reference to the GameKernel */
	kernel: GameKernel;
}

/**
 * Create a plugin manager using composition-based pattern
 * @param options Plugin manager options
 * @returns A plugin manager implementation
 */
export function createPluginManager(options: PluginManagerOptions): PluginManager {
	if (!options.kernel) {
		throw new Error('PluginManager requires a GameKernel instance');
	}

	// Create shared context
	const context: PluginManagerContext = {
		debug: options.debug || false,
		kernel: options.kernel,
		filesystem: new DefaultPluginFilesystem(options.kernel, options.debug || false),
		openFiles: new Map()
	};

	log(context, 'Plugin Manager initialized');

	return {
		/**
		 * Register a plugin in the filesystem
		 * @param plugin Plugin to register
		 */
		registerPlugin(plugin: Plugin): void {
			// Mount the plugin in the filesystem
			const result = context.filesystem.mountPlugin(plugin);

			if (result !== 0) {
				error(context, `Failed to register plugin ${plugin.id}: error code ${result}`);
				return;
			}

			log(context, `Registered plugin: ${plugin.id} (${plugin.name})`);
		},

		/**
		 * Get a plugin by ID
		 * @param pluginId Plugin ID
		 * @returns Plugin instance or undefined if not found
		 */
		getPlugin(pluginId: string): Plugin | undefined {
			// Create the path to the plugin executable
			const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;

			// Check if the plugin exists
			if (!context.filesystem.existsPlugin(pluginPath)) {
				return undefined;
			}

			// Get plugin metadata
			const metadata = context.filesystem.getPluginMetadata(pluginPath);
			if (!metadata) {
				return undefined;
			}

			// Since we can't directly return the plugin object (filesystem abstraction),
			// we need to use the kernel to get the actual plugin instance
			return context.kernel.getPlugin(pluginId);
		},

		/**
		 * Check if a plugin is registered
		 * @param pluginId Plugin ID
		 * @returns Whether the plugin is registered
		 */
		hasPlugin(pluginId: string): boolean {
			// Create the path to the plugin executable
			const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;

			// Check if the plugin exists in the filesystem
			return context.filesystem.existsPlugin(pluginPath);
		},

		/**
		 * Check if a device (capability) is mounted at the specified path
		 * @param devicePath Device path
		 * @returns Whether the device exists
		 */
		hasDevice(devicePath: string): boolean {
			return context.kernel.exists(devicePath);
		},

		/**
		 * Get metadata for all registered plugins
		 * @returns Array of plugin metadata
		 */
		getAllPluginMetadata(): PluginMetadata[] {
			// Get all plugin paths in /bin
			const pluginPaths = context.filesystem.listPlugins(PLUGIN_PATHS.BIN);

			// Map paths to metadata
			return pluginPaths
				.map((path) => context.filesystem.getPluginMetadata(path))
				.filter((metadata): metadata is PluginMetadata => metadata !== null);
		},

		/**
		 * Get all registered plugins
		 * @returns Array of all registered plugins
		 */
		getAllPlugins(): Plugin[] {
			// Get all plugin paths in /bin
			const pluginPaths = context.filesystem.listPlugins(PLUGIN_PATHS.BIN);

			// Map paths to plugin instances
			return pluginPaths
				.map((path) => {
					const pluginId = path.substring(PLUGIN_PATHS.BIN.length + 1);
					return context.kernel.getPlugin(pluginId);
				})
				.filter((plugin): plugin is Plugin => plugin !== undefined);
		},

		/**
		 * Get all mounted devices (capabilities)
		 * @returns Array of device paths
		 */
		getAllDevicePaths(): string[] {
			// Get all paths in /dev directory
			return context.kernel.getCapabilityIds().map((id) => `/dev/${id}`);
		},

		/**
		 * Get plugins that require a specific device
		 * @param devicePath Device path
		 * @returns Array of plugins that require this device
		 */
		getPluginsByDevice(devicePath: string): Plugin[] {
			// Get all plugin metadata
			const allMetadata = this.getAllPluginMetadata();

			// Filter plugins that require this device
			const pluginIds = allMetadata
				.filter((metadata) => metadata.requiredDevices.includes(devicePath))
				.map((metadata) => metadata.id);

			// Get plugin instances
			return pluginIds
				.map((id) => this.getPlugin(id))
				.filter((plugin): plugin is Plugin => plugin !== undefined);
		},

		/**
		 * Check required devices for a plugin
		 * @param pluginId Plugin ID
		 * @returns Array of missing device paths, empty if all available
		 */
		checkRequiredDevices(pluginId: string): string[] {
			// Get plugin metadata
			const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
			const metadata = context.filesystem.getPluginMetadata(pluginPath);

			if (!metadata) {
				return [`Plugin not found: ${pluginId}`];
			}

			// Check if required devices are available
			const missingDevices: string[] = [];
			for (const devicePath of metadata.requiredDevices) {
				if (!this.hasDevice(devicePath)) {
					missingDevices.push(devicePath);
				}
			}

			return missingDevices;
		},

		/**
		 * Execute a plugin on an entity
		 * @param entityId Entity ID
		 * @param pluginId Plugin ID
		 * @param options Options for plugin execution
		 * @returns Result of execution
		 */
		async executePlugin(
			entityId: string,
			pluginId: string,
			options: Record<string, any> = {}
		): Promise<any> {
			// Create the paths
			const pluginPath = `${PLUGIN_PATHS.BIN}/${pluginId}`;
			const entityPath = `/entity/${entityId}`;

			// Check if plugin exists
			if (!context.filesystem.existsPlugin(pluginPath)) {
				throw new Error(`Plugin not found: ${pluginId}`);
			}

			// Check required devices
			const missingDevices = this.checkRequiredDevices(pluginId);
			if (missingDevices.length > 0) {
				throw new Error(
					`Missing required devices for plugin ${pluginId}: ${missingDevices.join(', ')}`
				);
			}

			// Check if entity exists
			if (!context.kernel.exists(entityPath)) {
				throw new Error(`Entity not found: ${entityId}`);
			}

			log(context, `Executing plugin ${pluginId} on entity ${entityId}`);

			// Execute the plugin using the filesystem abstraction
			return context.filesystem.executePlugin(pluginPath, entityPath, options);
		},

		/**
		 * Shutdown the plugin manager
		 */
		async shutdown(): Promise<void> {
			log(context, 'Shutting down PluginManager');

			// Close any open files
			for (const [path, fd] of context.openFiles.entries()) {
				try {
					context.kernel.close(fd);
					log(context, `Closed file: ${path}`);
				} catch (error) {
					error(context, `Error closing file ${path}`, error);
				}
			}

			// Clear file tracking
			context.openFiles.clear();

			// Unmount all plugins
			const pluginPaths = context.filesystem.listPlugins(PLUGIN_PATHS.BIN);
			for (const path of pluginPaths) {
				const pluginId = path.substring(PLUGIN_PATHS.BIN.length + 1);
				context.filesystem.unmountPlugin(pluginId);
			}

			log(context, 'Plugin manager shut down');
		},

		/**
		 * Helper method to get an entity by path
		 * Opens, reads, and immediately closes the file
		 * @param entityPath Path to entity file
		 * @returns Entity data or null if error
		 */
		getEntityData(entityPath: string): Entity | null {
			// Open the file
			const fd = context.kernel.open(entityPath, OpenMode.READ);
			if (fd < 0) {
				error(context, `Failed to open entity file: ${entityPath}`);
				return null;
			}

			try {
				// Read entity data
				const [result, entityData] = context.kernel.read(fd);

				if (result !== 0) {
					error(context, `Failed to read entity data: ${result}`);
					return null;
				}

				return entityData as Entity;
			} finally {
				// Always close the file descriptor
				context.kernel.close(fd);
			}
		}
	};
}

/**
 * Log a debug message
 * @param context Plugin manager context
 * @param message Message to log
 * @param data Optional data to log
 */
function log(context: PluginManagerContext, message: string, data?: any): void {
	if (context.debug) {
		if (data !== undefined) {
			console.log(`[PluginManager] ${message}`, data);
		} else {
			console.log(`[PluginManager] ${message}`);
		}
	}
}

/**
 * Log an error message
 * @param context Plugin manager context
 * @param message Error message
 * @param error Optional error object
 */
function error(context: PluginManagerContext, message: string, error?: any): void {
	if (error !== undefined) {
		console.error(`[PluginManager] ${message}`, error);
	} else {
		console.error(`[PluginManager] ${message}`);
	}
}
