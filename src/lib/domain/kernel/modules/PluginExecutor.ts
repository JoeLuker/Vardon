import type { Plugin, PathResult, EventEmitter } from '../types';
import { ErrorCode } from '../types';
import { VIRTUAL_PATHS } from '../PathConstants';

/**
 * Manages plugin execution and lifecycle
 */
export class PluginExecutor {
	private readonly plugins: Map<string, Plugin> = new Map();
	private readonly signalHandlers: Map<
		string,
		(signal: number, source: string, data?: any) => void
	> = new Map();
	private readonly debug: boolean;
	private readonly events: EventEmitter;

	constructor(events: EventEmitter, debug: boolean = false) {
		this.events = events;
		this.debug = debug;
	}

	/**
	 * Load and execute a plugin
	 */
	async exec(path: string, plugin: Plugin, args: string[] = []): Promise<PathResult> {
		if (!plugin.id) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Plugin must have an ID',
				path
			};
		}

		// Check if plugin is already running
		if (this.plugins.has(plugin.id)) {
			return {
				success: false,
				errorCode: ErrorCode.EEXIST,
				errorMessage: `Plugin ${plugin.id} is already running`,
				path
			};
		}

		try {
			// Store plugin
			this.plugins.set(plugin.id, plugin);

			// Create process entry
			const procPath = `${VIRTUAL_PATHS.PROC_PLUGINS}/${plugin.id}`;

			// Execute plugin
			if (plugin.execute) {
				if (this.debug) {
					console.log(`[PluginExecutor] Executing plugin: ${plugin.id}`);
				}

				const result = await plugin.execute(this, args);

				if (!result || result.exitCode !== 0) {
					this.plugins.delete(plugin.id);
					return {
						success: false,
						errorCode: ErrorCode.EIO,
						errorMessage: `Plugin ${plugin.id} execution failed`,
						path
					};
				}
			}

			// Emit plugin loaded event
			this.events.emit('plugin:loaded', { pluginId: plugin.id, path });

			if (this.debug) {
				console.log(`[PluginExecutor] Plugin loaded: ${plugin.id}`);
			}

			return {
				success: true,
				path: procPath
			};
		} catch (error) {
			this.plugins.delete(plugin.id);
			return {
				success: false,
				errorCode: ErrorCode.EIO,
				errorMessage: `Failed to load plugin: ${error}`,
				path
			};
		}
	}

	/**
	 * Kill (unload) a plugin
	 */
	async kill(pluginId: string, signal: number = 15): Promise<ErrorCode> {
		const plugin = this.plugins.get(pluginId);
		if (!plugin) {
			return ErrorCode.ESRCH; // No such process
		}

		try {
			// Call plugin's shutdown handler if it exists
			if (plugin.shutdown) {
				if (this.debug) {
					console.log(`[PluginExecutor] Shutting down plugin: ${pluginId}`);
				}
				await plugin.shutdown();
			}

			// Remove plugin
			this.plugins.delete(pluginId);

			// Clean up signal handlers
			for (const [key, handler] of this.signalHandlers) {
				if (key.startsWith(`${pluginId}:`)) {
					this.signalHandlers.delete(key);
				}
			}

			// Emit plugin unloaded event
			this.events.emit('plugin:unloaded', { pluginId });

			if (this.debug) {
				console.log(`[PluginExecutor] Plugin unloaded: ${pluginId}`);
			}

			return ErrorCode.SUCCESS;
		} catch (error) {
			console.error(`Error shutting down plugin ${pluginId}:`, error);
			return ErrorCode.EIO;
		}
	}

	/**
	 * Send a signal to a plugin
	 */
	sendSignal(pluginId: string, signal: number, data?: any): ErrorCode {
		const plugin = this.plugins.get(pluginId);
		if (!plugin) {
			return ErrorCode.ESRCH; // No such process
		}

		// Check for signal handler
		const handlerKey = `${pluginId}:${signal}`;
		const handler = this.signalHandlers.get(handlerKey);

		if (handler) {
			handler(signal, 'kernel', data);
			return ErrorCode.SUCCESS;
		}

		// If no specific handler, check for generic handler
		if (plugin.onSignal) {
			plugin.onSignal(signal, data);
			return ErrorCode.SUCCESS;
		}

		return ErrorCode.EINVAL;
	}

	/**
	 * Register a signal handler for a plugin
	 */
	registerSignalHandler(
		pluginId: string,
		signal: number,
		handler: (signal: number, source: string, data?: any) => void
	): ErrorCode {
		if (!this.plugins.has(pluginId)) {
			return ErrorCode.ESRCH;
		}

		const handlerKey = `${pluginId}:${signal}`;
		this.signalHandlers.set(handlerKey, handler);

		if (this.debug) {
			console.log(`[PluginExecutor] Registered signal handler for ${pluginId}:${signal}`);
		}

		return ErrorCode.SUCCESS;
	}

	/**
	 * Get a plugin by ID
	 */
	getPlugin(pluginId: string): Plugin | undefined {
		return this.plugins.get(pluginId);
	}

	/**
	 * Get all plugins
	 */
	getAllPlugins(): Map<string, Plugin> {
		return new Map(this.plugins);
	}

	/**
	 * Shutdown all plugins
	 */
	async shutdownAll(): Promise<void> {
		if (this.debug) {
			console.log('[PluginExecutor] Shutting down all plugins');
		}

		for (const [pluginId] of this.plugins) {
			await this.kill(pluginId);
		}
	}
}
