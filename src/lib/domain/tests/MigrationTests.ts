/**
 * Plugin Tests
 *
 * This module demonstrates how to use the plugin system following Unix principles.
 */

import type { Entity } from '../kernel/types';
import { GameKernel } from '../kernel/GameKernel';
import { createPluginManager } from '../plugins/PluginManagerComposed';
import { createBonusCapability } from '../capabilities/bonus';
import { OpenMode } from '../kernel/types';

/**
 * Run a plugin test using Unix-style filesystem operations
 */
export async function runPluginTest() {
	console.log('=== Running Plugin Test ===');

	// Create a kernel with Unix file system
	const kernel = new GameKernel({ debug: true });

	// Create and register capabilities
	console.log('\nRegistering capabilities...');

	// Bonus capability (required by Power Attack)
	const bonusCapability = createBonusCapability({ debug: true });
	kernel.registerCapability(bonusCapability.id, bonusCapability);

	// Create plugin manager
	console.log('\nCreating plugin manager...');
	const pluginManager = createPluginManager({ debug: true, kernel });

	// Create a test entity
	const entity: Entity = {
		id: 'test-entity-1',
		type: 'character',
		name: 'Test Character',
		properties: {
			abilities: {
				strength: 16 // Set Strength to 16 to pass Power Attack requirements
			},
			bab: 4 // Set BAB to 4 to pass Power Attack requirements
		},
		metadata: {
			createdAt: Date.now(),
			updatedAt: Date.now(),
			version: 1
		}
	};

	// Create entity in filesystem
	const entityPath = `/v_entity/${entity.id}`;
	console.log(`\nCreating entity at ${entityPath}...`);
	const createResult = kernel.create(entityPath, entity);
	if (!createResult.success) {
		throw new Error(`Failed to create entity: ${createResult.errorMessage}`);
	}

	// Check if Power Attack plugin exists
	const powerAttackPath = '/v_bin/power-attack';
	if (!kernel.exists(powerAttackPath)) {
		console.log(`\nPower Attack plugin not found at ${powerAttackPath}, creating it...`);

		// In a real scenario, you would load the plugin from a plugin repository
		// or have it registered during application initialization

		// For this test, we'll simulate a simple plugin setup
		const mockPlugin = {
			id: 'power-attack',
			name: 'Power Attack',
			description:
				'You can choose to take a penalty on attack rolls to gain a bonus on damage rolls.',
			requiredDevices: ['/v_dev/bonus'],

			// Plugin execution
			async execute(kernel: GameKernel, targetPath: string, options: any = {}): Promise<number> {
				try {
					console.log(`Executing Power Attack plugin on ${targetPath} with options:`, options);

					// Open the entity file
					const fd = kernel.open(targetPath, OpenMode.READ_WRITE);
					if (fd < 0) {
						console.error(`Failed to open entity file: ${targetPath}`);
						return 1;
					}

					try {
						// Read entity data
						const [readResult, entityData] = kernel.read(fd);
						if (readResult !== 0) {
							console.error(`Failed to read entity: ${targetPath}`);
							return 2;
						}

						// Get the penalty value (default to 1)
						const penalty = options.penalty || 1;

						// Get the bonus device
						const bonusDeviceFd = kernel.open('/v_dev/bonus', OpenMode.READ_WRITE);
						if (bonusDeviceFd < 0) {
							console.error(`Failed to open bonus device`);
							return 3;
						}

						try {
							// Apply the Power Attack effect
							const attackParams = {
								target: 'melee_attack',
								value: -penalty,
								type: 'power_attack',
								source: 'Power Attack',
								entityPath: targetPath
							};

							const damageParams = {
								target: 'melee_damage',
								value: penalty * 2, // Double the penalty as damage bonus
								type: 'power_attack',
								source: 'Power Attack',
								entityPath: targetPath
							};

							// Apply using ioctl
							const attackResult = kernel.ioctl(bonusDeviceFd, 0, {
								...attackParams,
								operation: 'addBonus'
							});

							const damageResult = kernel.ioctl(bonusDeviceFd, 0, {
								...damageParams,
								operation: 'addBonus'
							});

							if (attackResult !== 0 || damageResult !== 0) {
								console.error(`Failed to apply Power Attack bonuses`);
								return 4;
							}

							// Mark that this plugin has been applied
							if (!entityData.properties.appliedPlugins) {
								entityData.properties.appliedPlugins = [];
							}

							if (!entityData.properties.appliedPlugins.includes('power-attack')) {
								entityData.properties.appliedPlugins.push('power-attack');
							}

							// Update properties with options used
							if (!entityData.properties.pluginOptions) {
								entityData.properties.pluginOptions = {};
							}

							entityData.properties.pluginOptions['power-attack'] = options;

							// Write the updated entity
							const writeResult = kernel.write(fd, entityData);
							if (writeResult !== 0) {
								console.error(`Failed to write entity: ${targetPath}`);
								return 5;
							}

							return 0; // Success
						} finally {
							// Always close the bonus device
							kernel.close(bonusDeviceFd);
						}
					} finally {
						// Always close the entity file
						kernel.close(fd);
					}
				} catch (error) {
					console.error(`Error executing Power Attack plugin:`, error);
					return 99;
				}
			},

			// Plugin validation
			canApply(entity: Entity): { valid: boolean; reason?: string } {
				// Check strength requirement
				const strength = entity.properties?.abilities?.strength || 0;
				if (strength < 13) {
					return { valid: false, reason: 'Requires Strength 13+' };
				}

				// Check BAB requirement
				const bab = entity.properties?.bab || 0;
				if (bab < 1) {
					return { valid: false, reason: 'Requires Base Attack Bonus 1+' };
				}

				return { valid: true };
			}
		};

		// Register the mock plugin
		kernel.registerPlugin(mockPlugin);

		console.log('Power Attack plugin created and registered');
	}

	// Check if Power Attack can be applied
	console.log('\nChecking if Power Attack can be applied...');
	const canApply = pluginManager.canApplyPlugin(entity.id, 'power-attack');
	console.log(
		`Can apply Power Attack: ${canApply.valid}${canApply.reason ? ' - ' + canApply.reason : ''}`
	);

	if (canApply.valid) {
		// Apply Power Attack with a -3 attack penalty
		console.log('\nApplying Power Attack with a -3 attack penalty...');
		const result = await pluginManager.applyPlugin(entity.id, 'power-attack', { penalty: 3 });

		console.log('Apply result:', result);

		// Read the entity to see the changes
		const fd = kernel.open(entityPath, OpenMode.READ);
		if (fd < 0) {
			throw new Error(`Failed to open entity: ${entityPath}`);
		}

		try {
			// Read entity data
			const [readResult, updatedEntity] = kernel.read(fd);
			if (readResult !== 0) {
				throw new Error(`Failed to read entity: ${readResult}`);
			}

			// Check bonuses on the entity
			console.log('\nChecking entity after applying Power Attack:');
			console.log('Applied plugins:', updatedEntity.properties.appliedPlugins);
			console.log('Plugin options:', updatedEntity.properties.pluginOptions);

			// Get bonus breakdown
			const bonusDeviceFd = kernel.open('/v_dev/bonus', OpenMode.READ);
			if (bonusDeviceFd < 0) {
				throw new Error('Failed to open bonus device');
			}

			try {
				// Get attack bonus breakdown
				const attackBreakdownParams = {
					target: 'melee_attack',
					operation: 'getBreakdown',
					entityPath
				};

				const damageBreakdownParams = {
					target: 'melee_damage',
					operation: 'getBreakdown',
					entityPath
				};

				// Use ioctl to get breakdowns
				const [_, attackBreakdown] = kernel.ioctl(bonusDeviceFd, 1, attackBreakdownParams);
				const [__, damageBreakdown] = kernel.ioctl(bonusDeviceFd, 1, damageBreakdownParams);

				console.log('\nDetailed bonus breakdown:');
				console.log('Attack breakdown:', JSON.stringify(attackBreakdown, null, 2));
				console.log('Damage breakdown:', JSON.stringify(damageBreakdown, null, 2));
			} finally {
				// Always close the bonus device
				kernel.close(bonusDeviceFd);
			}

			// Now unapply Power Attack by executing remove operation
			console.log('\nRemoving Power Attack...');
			const removeResult = await pluginManager.removePlugin(entity.id, 'power-attack');
			console.log('Remove result:', removeResult);

			// Read the entity again after removal
			const fdAfter = kernel.open(entityPath, OpenMode.READ);
			if (fdAfter < 0) {
				throw new Error(`Failed to open entity after removal: ${entityPath}`);
			}

			try {
				// Read entity data
				const [readResult, entityAfter] = kernel.read(fdAfter);
				if (readResult !== 0) {
					throw new Error(`Failed to read entity after removal: ${readResult}`);
				}

				console.log('\nChecking entity after removing Power Attack:');
				console.log('Applied plugins:', entityAfter.properties.appliedPlugins);
			} finally {
				// Always close the file
				kernel.close(fdAfter);
			}
		} finally {
			// Always close the entity file
			kernel.close(fd);
		}
	}

	// Clean up
	console.log('\nShutting down plugin manager...');
	await pluginManager.shutdown();

	// Shutdown kernel
	console.log('\nShutting down kernel...');
	await kernel.shutdown();

	console.log('\n=== Plugin Test Complete ===');
}

// Allow direct execution
if (typeof require !== 'undefined' && require.main === module) {
	runPluginTest().catch(console.error);
}
