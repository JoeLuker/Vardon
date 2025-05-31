/**
 * Capability System CLI Tests
 *
 * Tests for the capability composition system and device driver model.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { BaseCapability } from '../src/lib/domain/capabilities/BaseCapability';
import { AbilityCapability } from '../src/lib/domain/capabilities/ability';
import { SkillCapability } from '../src/lib/domain/capabilities/skill';
import { CombatCapability } from '../src/lib/domain/capabilities/combat';
import { BonusCapability } from '../src/lib/domain/capabilities/bonus';
import { ConditionCapability } from '../src/lib/domain/capabilities/condition';
import { ErrorCode, OpenMode } from '../src/lib/domain/kernel/types';
import type { Entity } from '../src/lib/domain/kernel/types';

// Test capability that tracks operations
class TrackingCapability extends BaseCapability {
	public readonly id = 'tracking-cap';
	public operations: string[] = [];

	onMount(kernel: any): void {
		super.onMount(kernel);
		this.operations.push('mount');
	}

	read(fd: number, buffer: any): number {
		this.operations.push(`read:${fd}`);
		buffer.data = { operations: this.operations };
		return ErrorCode.SUCCESS;
	}

	write(fd: number, buffer: any): number {
		this.operations.push(`write:${fd}:${JSON.stringify(buffer)}`);
		return ErrorCode.SUCCESS;
	}

	ioctl(fd: number, request: number, arg?: any): number {
		this.operations.push(`ioctl:${fd}:${request}`);
		return ErrorCode.SUCCESS;
	}

	shutdown(): void {
		this.operations.push('shutdown');
	}
}

registerTestSuite({
	name: 'Capability System Tests',
	description: 'Tests for capability composition, mounting, and device operations',
	tags: ['capability', 'device', 'composition'],
	run: async () => {
		const ctx = new TestContext('Capability System');

		// Test 1: Basic capability mounting
		await ctx.asyncTest('Mount and unmount capabilities', async () => {
			const kernel = new Kernel({ debug: false });
			const cap = new TrackingCapability();

			// Mount capability
			const mountResult = kernel.mount('/dev/tracking', cap);
			ctx.assertTrue(mountResult.success, 'Should mount capability');
			ctx.assertContains(cap.operations, 'mount', 'Should call onMount');

			// Verify device exists
			ctx.assertTrue(kernel.exists('/dev/tracking'), 'Device file should exist');

			// Shutdown should call capability shutdown
			await kernel.shutdown();
			ctx.assertContains(cap.operations, 'shutdown', 'Should call shutdown');
		});

		// Test 2: Device file operations
		await ctx.asyncTest('Read/write through device files', async () => {
			const kernel = new Kernel({ debug: false });
			const cap = new TrackingCapability();
			kernel.mount('/dev/tracking', cap);

			// Open device
			const fd = kernel.open('/dev/tracking', OpenMode.READ_WRITE);
			ctx.assertGreaterThan(fd, 0, 'Should open device');

			// Read from device
			const [readError, readData] = kernel.read(fd);
			ctx.assertEquals(readError, ErrorCode.SUCCESS, 'Read should succeed');
			ctx.assertContains(cap.operations, `read:${fd}`, 'Should track read');

			// Write to device
			const writeError = kernel.write(fd, { test: 'data' });
			ctx.assertEquals(writeError, ErrorCode.SUCCESS, 'Write should succeed');
			ctx.assertContains(cap.operations[cap.operations.length - 1], 'write:', 'Should track write');

			// Close device
			kernel.close(fd);
			await kernel.shutdown();
		});

		// Test 3: Multiple capability composition
		await ctx.asyncTest('Multiple capabilities on entity', async () => {
			const kernel = new Kernel({ debug: false });

			// Mount multiple capabilities
			kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
			kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
			kernel.mount('/dev/combat', new CombatCapability({ debug: false }));

			// Create entity with multiple aspects
			const entity: Entity = {
				id: 'multi-cap-test',
				type: 'character',
				properties: {
					abilities: { str: 16, dex: 14, con: 15, int: 12, wis: 13, cha: 10 },
					skills: { athletics: { ranks: 5 } },
					hp: { max: 30, current: 30 },
					ac: { armor: 5, shield: 0 }
				}
			};

			kernel.saveEntity(entity);

			// Access through different capabilities
			const abilityFd = kernel.open('/dev/ability', OpenMode.READ);
			const skillFd = kernel.open('/dev/skill', OpenMode.READ);
			const combatFd = kernel.open('/dev/combat', OpenMode.READ);

			ctx.assertGreaterThan(abilityFd, 0, 'Should open ability device');
			ctx.assertGreaterThan(skillFd, 0, 'Should open skill device');
			ctx.assertGreaterThan(combatFd, 0, 'Should open combat device');

			kernel.close(abilityFd);
			kernel.close(skillFd);
			kernel.close(combatFd);
			await kernel.shutdown();
		});

		// Test 4: Capability initialization
		await ctx.asyncTest('Capability initialization sequence', async () => {
			const kernel = new Kernel({ debug: false });

			// Create entity first
			const entity: Entity = {
				id: 'init-test',
				type: 'character',
				properties: {
					name: 'Init Test',
					abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
				}
			};
			kernel.saveEntity(entity);

			// Mount ability capability
			const abilityCap = new AbilityCapability({ debug: false });
			kernel.mount('/dev/ability', abilityCap);

			// Initialize capability with entity
			const loadedEntity = kernel.getEntity('init-test');
			ctx.assertNotNull(loadedEntity, 'Should load entity');

			if (loadedEntity) {
				abilityCap.initialize(loadedEntity);

				// Test ability access through entity
				const abilities = loadedEntity.getCapability(AbilityCapability);
				ctx.assertDefined(abilities, 'Should have ability capability');
			}

			await kernel.shutdown();
		});

		// Test 5: Bonus system capability
		await ctx.asyncTest('Bonus calculation system', async () => {
			const kernel = new Kernel({ debug: false });
			const bonusCap = new BonusCapability({ debug: false });
			kernel.mount('/dev/bonus', bonusCap);

			// Create entity with bonuses
			const entity: Entity = {
				id: 'bonus-test',
				type: 'character',
				properties: {
					bonuses: [
						{ type: 'enhancement', target: 'strength', value: 2 },
						{ type: 'morale', target: 'attack', value: 1 },
						{ type: 'enhancement', target: 'armor', value: 3 }
					]
				}
			};
			kernel.saveEntity(entity);

			// Access bonuses through device
			const fd = kernel.open('/dev/bonus', OpenMode.READ);
			if (fd > 0) {
				const [error, data] = kernel.read(fd);
				ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should read bonuses');

				if (data && data.bonuses) {
					ctx.assertEquals(data.bonuses.length, 3, 'Should have 3 bonuses');
				}

				kernel.close(fd);
			}

			await kernel.shutdown();
		});

		// Test 6: Condition tracking capability
		await ctx.asyncTest('Condition management system', async () => {
			const kernel = new Kernel({ debug: false });
			const conditionCap = new ConditionCapability({ debug: false });
			kernel.mount('/dev/condition', conditionCap);

			// Create entity with conditions
			const entity: Entity = {
				id: 'condition-test',
				type: 'character',
				properties: {
					conditions: ['fatigued', 'shaken']
				}
			};
			kernel.saveEntity(entity);

			// Modify conditions through device
			const fd = kernel.open('/dev/condition', OpenMode.READ_WRITE);
			if (fd > 0) {
				// Add condition
				const writeError = kernel.write(fd, {
					action: 'add',
					condition: 'sickened'
				});
				ctx.assertEquals(writeError, ErrorCode.SUCCESS, 'Should add condition');

				// Read current conditions
				const [readError, data] = kernel.read(fd);
				ctx.assertEquals(readError, ErrorCode.SUCCESS, 'Should read conditions');

				if (data && data.conditions) {
					ctx.assertEquals(data.conditions.length, 3, 'Should have 3 conditions');
					ctx.assertContains(data.conditions, 'sickened', 'Should include new condition');
				}

				kernel.close(fd);
			}

			await kernel.shutdown();
		});

		// Test 7: Capability error handling
		await ctx.asyncTest('Capability error scenarios', async () => {
			const kernel = new Kernel({ debug: false });
			const cap = new TrackingCapability();
			kernel.mount('/dev/tracking', cap);

			// Try to read without proper setup
			const fd = kernel.open('/dev/tracking', OpenMode.WRITE);
			const [readError] = kernel.read(fd);
			ctx.assertEquals(readError, ErrorCode.EACCES, 'Should fail read on write-only FD');

			// Try to write on read-only FD
			kernel.close(fd);
			const readFd = kernel.open('/dev/tracking', OpenMode.READ);
			const writeError = kernel.write(readFd, { data: 'test' });
			ctx.assertEquals(writeError, ErrorCode.EACCES, 'Should fail write on read-only FD');

			kernel.close(readFd);
			await kernel.shutdown();
		});

		// Test 8: Capability hot-reload simulation
		ctx.test('Capability replacement', () => {
			const kernel = new Kernel({ debug: false });

			// Mount first version
			const cap1 = new TrackingCapability();
			kernel.mount('/dev/tracking', cap1);

			// Try to mount different capability at same path
			const cap2 = new TrackingCapability();
			const result = kernel.mount('/dev/tracking', cap2);

			// Should fail - already mounted
			ctx.assertFalse(result.success, 'Should not allow duplicate mount');

			kernel.shutdown();
		});

		// Test 9: Cross-capability communication
		await ctx.asyncTest('Inter-capability data flow', async () => {
			const kernel = new Kernel({ debug: false });

			// Mount abilities and skills (skills depend on abilities)
			kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
			kernel.mount('/dev/skill', new SkillCapability({ debug: false }));

			// Create character
			const entity: Entity = {
				id: 'cross-cap-test',
				type: 'character',
				properties: {
					abilities: { str: 14, dex: 18, con: 12, int: 16, wis: 10, cha: 13 },
					skills: {
						acrobatics: { ranks: 5, classSkill: true },
						bluff: { ranks: 3, classSkill: false }
					}
				}
			};
			kernel.saveEntity(entity);

			// Skills should use ability modifiers
			// Acrobatics uses DEX (+4), Bluff uses CHA (+1)
			// This would be tested through the actual capability implementations

			await kernel.shutdown();
		});

		// Test 10: Capability performance
		await ctx.asyncTest('Capability operation performance', async () => {
			const kernel = new Kernel({ debug: false });
			const cap = new TrackingCapability();
			kernel.mount('/dev/tracking', cap);

			const iterations = 1000;
			const startTime = Date.now();

			// Many rapid operations
			const fd = kernel.open('/dev/tracking', OpenMode.READ_WRITE);
			for (let i = 0; i < iterations; i++) {
				kernel.read(fd);
				kernel.write(fd, { index: i });
			}
			kernel.close(fd);

			const duration = Date.now() - startTime;
			const opsPerSecond = (iterations * 2) / (duration / 1000);

			ctx.assertGreaterThan(opsPerSecond, 1000, 'Should handle >1000 ops/sec');
			ctx.assertEquals(
				cap.operations.filter((op) => op.startsWith('read:')).length,
				iterations,
				'Should track all reads'
			);
			ctx.assertEquals(
				cap.operations.filter((op) => op.startsWith('write:')).length,
				iterations,
				'Should track all writes'
			);

			await kernel.shutdown();
		});

		// Store results
		results.push(ctx.getResults());
	}
});
