import type { Capability, PathResult, MountOptions, EventEmitter } from '../types';
import { ErrorCode } from '../types';

/**
 * Manages device mounting and unmounting
 */
export class DeviceManager {
	private readonly mountPoints: Map<string, Capability> = new Map();
	private readonly devices: Map<string, Capability> = new Map();
	private readonly debug: boolean;
	private readonly events: EventEmitter;

	constructor(events: EventEmitter, debug: boolean = false) {
		this.events = events;
		this.debug = debug;
	}

	/**
	 * Mount a device at a path
	 */
	mount(path: string, device: Capability, options: MountOptions = {}): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		// Check if something is already mounted at this path
		if (this.mountPoints.has(path)) {
			return {
				success: false,
				errorCode: ErrorCode.EBUSY,
				errorMessage: `Device already mounted at ${path}`,
				path
			};
		}

		// Store mount point
		this.mountPoints.set(path, device);

		// Store device by ID
		if (device.id) {
			this.devices.set(device.id, device);
		}

		// Call device's onMount handler if it exists
		if (device.onMount) {
			device.onMount(this);
		}

		// Emit mount event
		this.events.emit('fs:mount', { path, device: device.id });

		if (this.debug) {
			console.log(`[DeviceManager] Mounted device ${device.id} at ${path}`);
		}

		return { success: true, path };
	}

	/**
	 * Unmount a device from a path
	 */
	unmount(path: string): PathResult {
		if (!path.startsWith('/')) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: 'Path must be absolute',
				path
			};
		}

		const device = this.mountPoints.get(path);
		if (!device) {
			return {
				success: false,
				errorCode: ErrorCode.EINVAL,
				errorMessage: `No device mounted at ${path}`,
				path
			};
		}

		// Call device's onUnmount handler if it exists
		if (device.onUnmount) {
			device.onUnmount(this);
		}

		// Remove mount point
		this.mountPoints.delete(path);

		// Remove from devices map
		if (device.id) {
			this.devices.delete(device.id);
		}

		// Emit unmount event
		this.events.emit('fs:unmount', { path, device: device.id });

		if (this.debug) {
			console.log(`[DeviceManager] Unmounted device ${device.id} from ${path}`);
		}

		return { success: true, path };
	}

	/**
	 * Get device mounted at a path
	 */
	getDeviceAtPath(path: string): Capability | undefined {
		return this.mountPoints.get(path);
	}

	/**
	 * Get device by ID
	 */
	getDeviceById(id: string): Capability | undefined {
		return this.devices.get(id);
	}

	/**
	 * Get all mount points
	 */
	getMountPoints(): Map<string, Capability> {
		return new Map(this.mountPoints);
	}

	/**
	 * Check if a path is a mount point
	 */
	isMountPoint(path: string): boolean {
		return this.mountPoints.has(path);
	}

	/**
	 * Get all devices
	 */
	getAllDevices(): Map<string, Capability> {
		return new Map(this.devices);
	}
}
