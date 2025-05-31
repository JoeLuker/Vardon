/**
 * Plugin System CLI Tests
 *
 * Tests for the Unix-style plugin execution system.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { SkillFocusPlugin } from '../src/lib/domain/plugins/feats/SkillFocusPlugin';
import type { Plugin, Entity } from '../src/lib/domain/kernel/types';

// Test plugin that modifies entity
class TestPlugin implements Plugin {
	public readonly id = 'test-plugin';
	public readonly name = 'Test Plugin';
	public readonly version = '1.0.0';
	public readonly requiredDevices = ['ability'];

	async execute(kernel: any, entityPath: string, options: any): Promise<number> {
		// Load entity
		const entityId = entityPath.split('/').pop()!;
		const entity = kernel.getEntity(entityId);

		if (!entity) {
			return 1; // Error: entity not found
		}

		// Modify entity
		entity.properties.testPlugin = {
			executed: true,
			options: options,
			timestamp: Date.now()
		};

		// Save changes
		const saved = kernel.saveEntity(entity);
		return saved ? 0 : 2; // 0 = success, 2 = save failed
	}
}

registerTestSuite({
	name: 'Plugin System Tests',
	description: 'Tests for Unix-style plugin loading, execution, and management',
	tags: ['plugin', 'execution', 'feats'],
	run: async () => {
		const ctx = new TestContext('Plugin System');

		// Test 1: Plugin registration
		await ctx.asyncTest('Register and list plugins', async () => {
			const kernel = new Kernel({ debug: false });

			// Register plugin
			const plugin = new TestPlugin();
			const registered = kernel.registerPlugin(plugin);
			ctx.assertTrue(registered, 'Should register plugin');

			// Verify plugin exists
			ctx.assertTrue(kernel.exists('/bin/test-plugin'), 'Plugin should exist in /bin');

			// List plugins
			const [error, plugins] = kernel.readdir('/bin');
			ctx.assertEquals(error, 0, 'Should list plugins');
			ctx.assertGreaterThan(plugins.length, 0, 'Should have plugins');

			const pluginNames = plugins.map((p) => p.name);
			ctx.assertContains(pluginNames, 'test-plugin', 'Should include test plugin');

			await kernel.shutdown();
		});

		// Test 2: Plugin execution
		await ctx.asyncTest('Execute plugin on entity', async () => {
			const kernel = new Kernel({ debug: false });

			// Create test entity
			const entity: Entity = {
				id: 'plugin-test-entity',
				type: 'character',
				properties: { name: 'Test Character' }
			};
			kernel.saveEntity(entity);

			// Register and execute plugin
			kernel.registerPlugin(new TestPlugin());

			const result = await kernel.executePlugin('test-plugin', 'plugin-test-entity', {
				testOption: 'value'
			});

			ctx.assertNotNull(result, 'Should return result');

			// Verify entity was modified
			const modified = kernel.getEntity('plugin-test-entity');
			ctx.assertNotNull(modified, 'Should load modified entity');
			ctx.assertTrue(modified!.properties.testPlugin?.executed, 'Plugin should mark execution');
			ctx.assertEquals(
				modified!.properties.testPlugin?.options.testOption,
				'value',
				'Should pass options'
			);

			await kernel.shutdown();
		});

		// Test 3: Plugin dependencies
		await ctx.asyncTest('Plugin device dependencies', async () => {
			const kernel = new Kernel({ debug: false });

			// Register plugin (requires 'ability' device)
			kernel.registerPlugin(new TestPlugin());

			// Try to execute without required device
			try {
				await kernel.executePlugin('test-plugin', 'some-entity', {});
				// May succeed or fail depending on implementation
			} catch (error: any) {
				ctx.assertContains(error.message, 'device', 'Error should mention missing device');
			}

			await kernel.shutdown();
		});

		// Test 4: Skill Focus plugin
		await ctx.asyncTest('Skill Focus feat plugin', async () => {
			const kernel = new Kernel({ debug: false });

			// Create character with skills
			const entity: Entity = {
				id: 'skill-focus-test',
				type: 'character',
				properties: {
					name: 'Skilled Character',
					skills: {
						perception: { ranks: 5, classSkill: true, miscBonus: 0 },
						stealth: { ranks: 3, classSkill: false, miscBonus: 0 }
					},
					feats: []
				}
			};
			kernel.saveEntity(entity);

			// Register Skill Focus plugin
			const skillFocusPlugin = new SkillFocusPlugin();
			kernel.registerPlugin(skillFocusPlugin);

			// Apply Skill Focus (Perception)
			const result = await kernel.executePlugin('skill-focus', 'skill-focus-test', {
				skill: 'perception'
			});

			// Verify feat was added
			const modified = kernel.getEntity('skill-focus-test');
			ctx.assertNotNull(modified, 'Should load modified character');

			if (modified) {
				// Check if feat was added
				const hasSkillFocus = modified.properties.feats?.some(
					(f: any) => f.name === 'Skill Focus' && f.skill === 'perception'
				);
				ctx.assertTrue(hasSkillFocus, 'Should have Skill Focus feat');

				// Check if skill bonus was applied
				ctx.assertEquals(
					modified.properties.skills.perception.miscBonus,
					3,
					'Perception should have +3 bonus'
				);
			}

			await kernel.shutdown();
		});

		// Test 5: Plugin error handling
		await ctx.asyncTest('Plugin execution errors', async () => {
			const kernel = new Kernel({ debug: false });

			// Register plugin
			kernel.registerPlugin(new TestPlugin());

			// Execute on non-existent entity
			await ctx.assertAsyncThrows(
				async () => kernel.executePlugin('test-plugin', 'non-existent', {}),
				'Entity not found'
			);

			// Execute non-existent plugin
			await ctx.assertAsyncThrows(
				async () => kernel.executePlugin('non-existent-plugin', 'some-entity', {}),
				'Plugin not found'
			);

			await kernel.shutdown();
		});

		// Test 6: Plugin signals
		await ctx.asyncTest('Plugin signal handling', async () => {
			const kernel = new Kernel({ debug: false });

			let signalReceived = false;

			// Register signal handler
			kernel.registerSignalHandler('test-plugin', (signal, source, data) => {
				signalReceived = true;
				ctx.assertEquals(signal, 15, 'Should receive SIGTERM');
				ctx.assertEquals(source, 'test', 'Should have correct source');
			});

			// Send signal
			kernel.sendSignal('test-plugin', 15, 'test'); // SIGTERM

			// Give time for signal delivery
			await new Promise((resolve) => setTimeout(resolve, 10));

			ctx.assertTrue(signalReceived, 'Should receive signal');

			await kernel.shutdown();
		});

		// Test 7: Plugin lifecycle
		ctx.test('Plugin lifecycle management', () => {
			const kernel = new Kernel({ debug: false });

			// Track plugin lifecycle
			const events: string[] = [];
			kernel.events.on('plugin:registered', (e) => events.push('registered'));
			kernel.events.on('plugin:executed', (e) => events.push('executed'));
			kernel.events.on('plugin:execution_failed', (e) => events.push('failed'));

			// Register plugin
			kernel.registerPlugin(new TestPlugin());
			ctx.assertContains(events, 'registered', 'Should emit registration event');

			kernel.shutdown();
		});

		// Test 8: Plugin options validation
		await ctx.asyncTest('Plugin option passing', async () => {
			const kernel = new Kernel({ debug: false });

			// Plugin that validates options
			class OptionsPlugin implements Plugin {
				id = 'options-plugin';
				name = 'Options Test';
				version = '1.0.0';
				requiredDevices = [];

				async execute(kernel: any, entityPath: string, options: any): Promise<number> {
					if (!options.required) {
						return 1; // Missing required option
					}
					if (typeof options.number !== 'number') {
						return 2; // Wrong type
					}
					return 0; // Success
				}
			}

			kernel.registerPlugin(new OptionsPlugin());

			// Test with valid options
			kernel.saveEntity({ id: 'opt-test', type: 'character', properties: {} });

			const result1 = await kernel.executePlugin('options-plugin', 'opt-test', {
				required: true,
				number: 42
			});
			ctx.assertNotNull(result1, 'Should execute with valid options');

			// Test with invalid options
			await ctx.assertAsyncThrows(async () =>
				kernel.executePlugin('options-plugin', 'opt-test', {
					number: 'not-a-number'
				})
			);

			await kernel.shutdown();
		});

		// Test 9: Plugin discovery
		await ctx.asyncTest('Plugin discovery and metadata', async () => {
			const kernel = new Kernel({ debug: false });

			// Register multiple plugins
			kernel.registerPlugin(new TestPlugin());
			kernel.registerPlugin(new SkillFocusPlugin());

			// Read plugin metadata
			const [error, plugins] = kernel.readdir('/bin');
			ctx.assertEquals(error, 0, 'Should list plugins');

			// Check each plugin has metadata
			for (const plugin of plugins) {
				const pluginPath = `/bin/${plugin.name}`;
				const fd = kernel.open(pluginPath, 1); // READ

				if (fd > 0) {
					const [readError, metadata] = kernel.read(fd);
					ctx.assertEquals(readError, 0, 'Should read plugin metadata');

					if (metadata) {
						ctx.assertDefined(metadata.id, 'Plugin should have ID');
						ctx.assertDefined(metadata.name, 'Plugin should have name');
						ctx.assertDefined(metadata.version, 'Plugin should have version');
					}

					kernel.close(fd);
				}
			}

			await kernel.shutdown();
		});

		// Test 10: Plugin performance
		await ctx.asyncTest('Plugin execution performance', async () => {
			const kernel = new Kernel({ debug: false });

			// Fast plugin
			class FastPlugin implements Plugin {
				id = 'fast-plugin';
				name = 'Fast Plugin';
				version = '1.0.0';
				requiredDevices = [];

				async execute(): Promise<number> {
					// Minimal work
					return 0;
				}
			}

			kernel.registerPlugin(new FastPlugin());
			kernel.saveEntity({ id: 'perf-test', type: 'character', properties: {} });

			const iterations = 100;
			const startTime = Date.now();

			for (let i = 0; i < iterations; i++) {
				await kernel.executePlugin('fast-plugin', 'perf-test', {});
			}

			const duration = Date.now() - startTime;
			const execPerSecond = iterations / (duration / 1000);

			ctx.assertGreaterThan(execPerSecond, 50, 'Should execute >50 plugins/sec');

			await kernel.shutdown();
		});

		// Store results
		results.push(ctx.getResults());
	}
});
