/**
 * Unix Architecture Test
 *
 * This module tests the Unix-style architecture implementation.
 */

import { GameKernel } from '../kernel/GameKernel';
import { EventBus } from '../kernel/EventBus';
import { OpenMode, ErrorCode } from '../kernel/types';
import { BaseCapability } from '../capabilities/BaseCapability';

/**
 * Simple test capability
 */
class TestCapability extends BaseCapability {
	public readonly id = 'test-capability';
	private testData: any = {};

	onMount(kernel: any): void {
		super.onMount(kernel);
		this.log('Test capability mounted');

		// Initialize with some test data
		this.testData = {
			value: 42,
			name: 'test-data'
		};
	}

	read(fd: number, buffer: any): number {
		this.log(`Reading from fd ${fd}`);

		if (typeof buffer !== 'object') {
			return ErrorCode.EINVAL;
		}

		// Copy test data to buffer
		Object.assign(buffer, this.testData);
		return ErrorCode.SUCCESS;
	}

	write(fd: number, buffer: any): number {
		this.log(`Writing to fd ${fd}`);

		if (typeof buffer !== 'object') {
			return ErrorCode.EINVAL;
		}

		// Update test data
		this.testData = { ...buffer };
		return ErrorCode.SUCCESS;
	}

	ioctl(fd: number, request: number, arg: any): number {
		this.log(`IOCTL on fd ${fd}, request ${request}`);

		// Simple operations
		if (request === 1) {
			// Get value
			if (typeof arg === 'object') {
				arg.value = this.testData.value;
				return ErrorCode.SUCCESS;
			}
		} else if (request === 2) {
			// Set value
			if (typeof arg === 'number') {
				this.testData.value = arg;
				return ErrorCode.SUCCESS;
			}
		}

		return ErrorCode.EINVAL;
	}
}

/**
 * Simple test plugin
 */
const TestPlugin = {
	id: 'test-plugin',
	name: 'Test Plugin',
	description: 'A test plugin for the Unix architecture',
	requiredDevices: ['/dev/test-capability'],

	async execute(kernel: any, entityPath: string, options: any = {}): Promise<number> {
		console.log(`[TestPlugin] Executing on ${entityPath}`);

		// Open entity file
		const entityFd = kernel.open(entityPath, OpenMode.READ_WRITE);
		if (entityFd < 0) {
			console.error(`[TestPlugin] Failed to open entity file: ${entityPath}`);
			return 1;
		}

		// Open device
		const deviceFd = kernel.open('/dev/test-capability', OpenMode.READ_WRITE);
		if (deviceFd < 0) {
			console.error(`[TestPlugin] Failed to open device: /dev/test-capability`);
			kernel.close(entityFd);
			return 2;
		}

		try {
			// Read entity data
			const entity = {};
			const readResult = kernel.read(entityFd, entity);
			if (readResult !== 0) {
				console.error(`[TestPlugin] Failed to read entity: ${readResult}`);
				return 3;
			}

			// Read device data
			const deviceData = {};
			const deviceReadResult = kernel.read(deviceFd, deviceData);
			if (deviceReadResult !== 0) {
				console.error(`[TestPlugin] Failed to read device: ${deviceReadResult}`);
				return 4;
			}

			console.log(`[TestPlugin] Entity data:`, entity);
			console.log(`[TestPlugin] Device data:`, deviceData);

			// Modify entity based on device data
			(entity as any).properties.testValue = deviceData.value;
			(entity as any).properties.testName = deviceData.name;

			// Write back to entity
			const writeResult = kernel.write(entityFd, entity);
			if (writeResult !== 0) {
				console.error(`[TestPlugin] Failed to write entity: ${writeResult}`);
				return 5;
			}

			// Use IOCTL to update device
			if (options.setValue !== undefined) {
				const ioctlResult = kernel.ioctl(deviceFd, 2, options.setValue);
				if (ioctlResult !== 0) {
					console.error(`[TestPlugin] IOCTL failed: ${ioctlResult}`);
					return 6;
				}
			}

			return 0; // Success
		} finally {
			// Always close file descriptors
			kernel.close(entityFd);
			kernel.close(deviceFd);
		}
	}
};

/**
 * Run the Unix architecture test
 * @returns Test result message
 */
export async function runUnixArchitectureTest(): Promise<string> {
	console.log('Running Unix Architecture Test');

	// Create kernel
	const eventBus = new EventBus(true);
	const kernel = new GameKernel({
		eventEmitter: eventBus,
		debug: true
	});

	try {
		// Mount test capability
		const capability = new TestCapability({ debug: true });
		kernel.mount(`/dev/${capability.id}`, capability);

		// Register test plugin
		kernel.registerPlugin(TestPlugin);

		// Create test entity
		const entityId = 'test-entity';
		const entityPath = `/entity/${entityId}`;

		const entity = {
			id: entityId,
			type: 'test',
			name: 'Test Entity',
			properties: {
				value: 0
			},
			metadata: {
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1
			}
		};

		const createResult = kernel.create(entityPath, entity);
		if (!createResult.success) {
			throw new Error(`Failed to create entity: ${createResult.errorMessage}`);
		}

		// Execute test plugin
		const options = { setValue: 100 };
		await kernel.executePlugin('test-plugin', entityId, options);

		// Open and read updated entity
		const fd = kernel.open(entityPath, OpenMode.READ);
		if (fd < 0) {
			throw new Error(`Failed to open entity file: ${entityPath}`);
		}

		try {
			const updatedEntity = {};
			const result = kernel.read(fd, updatedEntity);

			if (result !== 0) {
				throw new Error(`Failed to read entity: ${result}`);
			}

			console.log('Updated entity:', updatedEntity);

			// Verify updates
			const properties = (updatedEntity as any).properties;
			if (properties.testValue === 42 && properties.testName === 'test-data') {
				console.log('✅ Entity correctly updated from device');
			} else {
				console.error('❌ Entity not updated correctly');
			}

			// Reopen device to verify it was updated by IOCTL
			const deviceFd = kernel.open('/dev/test-capability', OpenMode.READ);
			if (deviceFd < 0) {
				throw new Error('Failed to open device');
			}

			try {
				const deviceData = {};
				const deviceResult = kernel.read(deviceFd, deviceData);

				if (deviceResult !== 0) {
					throw new Error(`Failed to read device: ${deviceResult}`);
				}

				console.log('Updated device data:', deviceData);

				if (deviceData.value === 100) {
					console.log('✅ Device correctly updated by IOCTL');
				} else {
					console.error('❌ Device not updated correctly');
				}
			} finally {
				kernel.close(deviceFd);
			}
		} finally {
			kernel.close(fd);
		}

		return 'Unix Architecture Test completed successfully';
	} catch (error) {
		console.error('Unix Architecture Test failed:', error);
		return `Unix Architecture Test failed: ${error.message}`;
	} finally {
		// Clean up
		await kernel.shutdown();
	}
}

/**
 * Verify that the /proc/character directory is created during kernel initialization
 * @returns Test result message
 */
export async function testCharacterDirectoryCreation(): Promise<string> {
	console.log('Testing /proc/character directory creation');

	// Create kernel
	const eventBus = new EventBus(true);
	const kernel = new GameKernel({
		eventEmitter: eventBus,
		debug: true
	});

	try {
		// Check if /proc/character directory exists
		const exists = kernel.exists('/proc/character');

		if (exists) {
			console.log('✅ /proc/character directory was created during kernel initialization');
			return 'Character directory test passed successfully';
		} else {
			console.error('❌ /proc/character directory was not created during kernel initialization');
			return 'Character directory test failed';
		}
	} catch (error) {
		console.error('Character directory test failed with error:', error);
		return `Character directory test failed: ${error.message}`;
	} finally {
		// Clean up resources
		await kernel.shutdown();
	}
}

// Allow running directly
if (typeof window === 'undefined' && require.main === module) {
	// Run both tests in sequence
	async function runAllTests() {
		try {
			// Run the main Unix architecture test
			const unixTestResult = await runUnixArchitectureTest();
			console.log(unixTestResult);

			// Run the character directory test
			console.log('\n'); // Add separation
			const charDirTestResult = await testCharacterDirectoryCreation();
			console.log(charDirTestResult);
		} catch (error) {
			console.error('Test error:', error);
		}
	}

	runAllTests();
}
