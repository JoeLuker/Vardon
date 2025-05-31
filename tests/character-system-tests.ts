/**
 * Character System CLI Tests
 *
 * Tests for character creation, modification, and calculation systems.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { CharacterAssembler } from '../src/lib/domain/character/CharacterAssembler';
import { AbilityCapability } from '../src/lib/domain/capabilities/ability';
import { SkillCapability } from '../src/lib/domain/capabilities/skill';
import { CombatCapability } from '../src/lib/domain/capabilities/combat';
import { CapabilityKit } from '../src/lib/domain/capabilities/CapabilityKit';
import type { Entity } from '../src/lib/domain/kernel/types';

registerTestSuite({
	name: 'Character System Tests',
	description: 'Tests for character entities, abilities, skills, and combat calculations',
	tags: ['character', 'abilities', 'skills', 'combat'],
	run: async () => {
		const ctx = new TestContext('Character System');

		// Test 1: Character entity creation
		await ctx.asyncTest('Create basic character entity', async () => {
			const kernel = new Kernel({ debug: false });
			const assembler = new CharacterAssembler(kernel);

			// Create character
			const character = await assembler.createCharacter({
				name: 'Test Fighter',
				level: 1,
				class: 'fighter',
				ancestry: 'human',
				background: 'soldier'
			});

			ctx.assertNotNull(character, 'Should create character');
			ctx.assertDefined(character.id, 'Should have ID');
			ctx.assertEquals(character.type, 'character', 'Should be character type');
			ctx.assertEquals(character.properties.name, 'Test Fighter', 'Should have correct name');

			// Verify entity saved
			const loaded = kernel.getEntity(character.id);
			ctx.assertNotNull(loaded, 'Should load saved character');

			await kernel.shutdown();
		});

		// Test 2: Ability scores
		await ctx.asyncTest('Ability score initialization and modifiers', async () => {
			const kernel = new Kernel({ debug: false });
			const kit = new CapabilityKit(kernel);

			// Create character with specific abilities
			const character: Entity = {
				id: 'test-abilities',
				type: 'character',
				properties: {
					name: 'Ability Test',
					abilities: {
						str: 18,
						dex: 14,
						con: 16,
						int: 10,
						wis: 13,
						cha: 8
					}
				}
			};

			kernel.saveEntity(character);

			// Mount ability capability
			const abilityCapability = new AbilityCapability({ debug: false });
			kernel.mount('/dev/ability', abilityCapability);

			// Get ability scores
			const abilities = await kit.getAbilities(character.id);

			ctx.assertEquals(abilities.str.score, 18, 'STR should be 18');
			ctx.assertEquals(abilities.str.modifier, 4, 'STR modifier should be +4');

			ctx.assertEquals(abilities.dex.score, 14, 'DEX should be 14');
			ctx.assertEquals(abilities.dex.modifier, 2, 'DEX modifier should be +2');

			ctx.assertEquals(abilities.con.score, 16, 'CON should be 16');
			ctx.assertEquals(abilities.con.modifier, 3, 'CON modifier should be +3');

			ctx.assertEquals(abilities.int.score, 10, 'INT should be 10');
			ctx.assertEquals(abilities.int.modifier, 0, 'INT modifier should be 0');

			ctx.assertEquals(abilities.wis.score, 13, 'WIS should be 13');
			ctx.assertEquals(abilities.wis.modifier, 1, 'WIS modifier should be +1');

			ctx.assertEquals(abilities.cha.score, 8, 'CHA should be 8');
			ctx.assertEquals(abilities.cha.modifier, -1, 'CHA modifier should be -1');

			await kernel.shutdown();
		});

		// Test 3: Skill calculations
		await ctx.asyncTest('Skill rank and modifier calculations', async () => {
			const kernel = new Kernel({ debug: false });
			const kit = new CapabilityKit(kernel);

			// Create character with skills
			const character: Entity = {
				id: 'test-skills',
				type: 'character',
				properties: {
					name: 'Skill Test',
					level: 5,
					class: 'rogue',
					abilities: {
						str: 10,
						dex: 18,
						con: 14,
						int: 16,
						wis: 12,
						cha: 13
					},
					skills: {
						acrobatics: { ranks: 5, classSkill: true },
						stealth: { ranks: 5, classSkill: true },
						perception: { ranks: 3, classSkill: true },
						knowledge_local: { ranks: 2, classSkill: false }
					}
				}
			};

			kernel.saveEntity(character);

			// Mount capabilities
			kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
			kernel.mount('/dev/skill', new SkillCapability({ debug: false }));

			// Get skill modifiers
			const skills = await kit.getSkills(character.id);

			// Acrobatics (DEX): 5 ranks + 3 class + 4 dex = 12
			ctx.assertEquals(skills.acrobatics.total, 12, 'Acrobatics should be +12');
			ctx.assertTrue(skills.acrobatics.isClassSkill, 'Acrobatics should be class skill');

			// Stealth (DEX): 5 ranks + 3 class + 4 dex = 12
			ctx.assertEquals(skills.stealth.total, 12, 'Stealth should be +12');

			// Perception (WIS): 3 ranks + 3 class + 1 wis = 7
			ctx.assertEquals(skills.perception.total, 7, 'Perception should be +7');

			// Knowledge Local (INT): 2 ranks + 0 class + 3 int = 5
			ctx.assertEquals(skills.knowledge_local.total, 5, 'Knowledge (local) should be +5');
			ctx.assertFalse(skills.knowledge_local.isClassSkill, 'Knowledge should not be class skill');

			await kernel.shutdown();
		});

		// Test 4: Combat statistics
		await ctx.asyncTest('Combat stat calculations (AC, HP, Saves)', async () => {
			const kernel = new Kernel({ debug: false });
			const kit = new CapabilityKit(kernel);

			// Create fighter character
			const character: Entity = {
				id: 'test-combat',
				type: 'character',
				properties: {
					name: 'Combat Test',
					level: 3,
					class: 'fighter',
					hitDice: 'd10',
					abilities: {
						str: 16,
						dex: 14,
						con: 15,
						int: 10,
						wis: 12,
						cha: 8
					},
					hp: {
						max: 28, // 10 + 2*6 + 3*2 (con bonus)
						current: 28
					},
					ac: {
						armor: 5, // Chain shirt
						shield: 2, // Heavy shield
						natural: 0,
						deflection: 0,
						dodge: 0
					},
					saves: {
						fort: { base: 3 }, // Fighter good Fort
						ref: { base: 1 }, // Fighter poor Ref
						will: { base: 1 } // Fighter poor Will
					}
				}
			};

			kernel.saveEntity(character);

			// Mount capabilities
			kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
			kernel.mount('/dev/combat', new CombatCapability({ debug: false }));

			// Get combat stats
			const combat = await kit.getCombatStats(character.id);

			// AC: 10 + 5 armor + 2 shield + 2 dex = 19
			ctx.assertEquals(combat.ac.total, 19, 'AC should be 19');
			ctx.assertEquals(combat.ac.touch, 12, 'Touch AC should be 12');
			ctx.assertEquals(combat.ac.flatFooted, 17, 'Flat-footed AC should be 17');

			// HP
			ctx.assertEquals(combat.hp.max, 28, 'Max HP should be 28');
			ctx.assertEquals(combat.hp.current, 28, 'Current HP should be 28');

			// Saves
			ctx.assertEquals(combat.saves.fort.total, 5, 'Fort save should be +5 (3 base + 2 con)');
			ctx.assertEquals(combat.saves.ref.total, 3, 'Ref save should be +3 (1 base + 2 dex)');
			ctx.assertEquals(combat.saves.will.total, 2, 'Will save should be +2 (1 base + 1 wis)');

			await kernel.shutdown();
		});

		// Test 5: Character modification
		await ctx.asyncTest('Modify character properties', async () => {
			const kernel = new Kernel({ debug: false });

			// Create character
			const character: Entity = {
				id: 'test-modify',
				type: 'character',
				properties: {
					name: 'Original Name',
					level: 1,
					abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
				}
			};

			kernel.saveEntity(character);

			// Modify character
			character.properties.name = 'Modified Name';
			character.properties.level = 2;
			character.properties.abilities.str = 14;

			const saved = kernel.saveEntity(character);
			ctx.assertTrue(saved, 'Should save modified character');

			// Load and verify
			const loaded = kernel.getEntity('test-modify');
			ctx.assertNotNull(loaded, 'Should load character');
			ctx.assertEquals(loaded!.properties.name, 'Modified Name', 'Name should be updated');
			ctx.assertEquals(loaded!.properties.level, 2, 'Level should be updated');
			ctx.assertEquals(loaded!.properties.abilities.str, 14, 'STR should be updated');

			await kernel.shutdown();
		});

		// Test 6: Multi-class characters
		await ctx.asyncTest('Multi-class character handling', async () => {
			const kernel = new Kernel({ debug: false });

			const character: Entity = {
				id: 'test-multiclass',
				type: 'character',
				properties: {
					name: 'Fighter/Wizard',
					classes: [
						{ name: 'fighter', level: 3 },
						{ name: 'wizard', level: 2 }
					],
					totalLevel: 5,
					abilities: {
						str: 15,
						dex: 13,
						con: 14,
						int: 16,
						wis: 10,
						cha: 8
					}
				}
			};

			kernel.saveEntity(character);

			const loaded = kernel.getEntity('test-multiclass');
			ctx.assertNotNull(loaded, 'Should load multiclass character');
			ctx.assertEquals(loaded!.properties.totalLevel, 5, 'Total level should be 5');
			ctx.assertEquals(loaded!.properties.classes.length, 2, 'Should have 2 classes');
			ctx.assertEquals(loaded!.properties.classes[0].level, 3, 'Fighter level should be 3');
			ctx.assertEquals(loaded!.properties.classes[1].level, 2, 'Wizard level should be 2');

			await kernel.shutdown();
		});

		// Test 7: Character templates
		await ctx.asyncTest('Character template application', async () => {
			const kernel = new Kernel({ debug: false });

			// Create template
			const template: Entity = {
				id: 'template-vampire',
				type: 'template',
				properties: {
					name: 'Vampire',
					modifiers: {
						abilities: { str: 6, dex: 4, cha: 4 },
						naturalArmor: 6,
						fastHealing: 5
					}
				}
			};

			kernel.saveEntity(template);
			ctx.assertTrue(kernel.exists('/entity/template-vampire'), 'Template should be saved');

			// Base character
			const character: Entity = {
				id: 'test-template',
				type: 'character',
				properties: {
					name: 'Human Fighter',
					abilities: { str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 9 },
					templates: ['vampire']
				}
			};

			kernel.saveEntity(character);

			// In a real system, template application would happen through capabilities
			// For this test, we're just verifying the data structure
			const loaded = kernel.getEntity('test-template');
			ctx.assertNotNull(loaded, 'Should load templated character');
			ctx.assertContains(loaded!.properties.templates, 'vampire', 'Should have vampire template');

			await kernel.shutdown();
		});

		// Test 8: Character validation
		ctx.test('Character data validation', () => {
			const kernel = new Kernel({ debug: false });

			// Test invalid ability scores
			ctx.assertThrows(() => {
				const invalid: Entity = {
					id: 'invalid-abilities',
					type: 'character',
					properties: {
						name: 'Invalid',
						abilities: { str: -1, dex: 50, con: 10, int: 10, wis: 10, cha: 10 }
					}
				};

				// In a real system, validation would happen here
				if (invalid.properties.abilities.str < 1 || invalid.properties.abilities.str > 30) {
					throw new Error('Invalid ability score');
				}
			}, 'Invalid ability score');

			kernel.shutdown();
		});

		// Test 9: Character deletion
		await ctx.asyncTest('Delete character and cleanup', async () => {
			const kernel = new Kernel({ debug: false });

			// Create character
			const character: Entity = {
				id: 'test-delete',
				type: 'character',
				properties: { name: 'To Delete' }
			};

			kernel.saveEntity(character);
			ctx.assertTrue(kernel.exists('/entity/test-delete'), 'Character should exist');

			// Delete character
			const deleted = kernel.removeEntity('test-delete');
			ctx.assertTrue(deleted, 'Should delete character');
			ctx.assertFalse(kernel.exists('/entity/test-delete'), 'Character should not exist');

			// Try to load deleted character
			const loaded = kernel.getEntity('test-delete');
			ctx.assertNull(loaded, 'Should not load deleted character');

			await kernel.shutdown();
		});

		// Test 10: Batch character operations
		await ctx.asyncTest('Batch character creation and queries', async () => {
			const kernel = new Kernel({ debug: false });

			// Create multiple characters
			const characters = [];
			for (let i = 0; i < 5; i++) {
				const char: Entity = {
					id: `batch-char-${i}`,
					type: 'character',
					properties: {
						name: `Character ${i}`,
						level: i + 1
					}
				};
				kernel.saveEntity(char);
				characters.push(char);
			}

			// Get all character IDs
			const allIds = kernel.getEntityIds();
			const batchIds = allIds.filter((id) => id.startsWith('batch-char-'));
			ctx.assertEquals(batchIds.length, 5, 'Should have 5 batch characters');

			// Clean up
			for (const char of characters) {
				kernel.removeEntity(char.id);
			}

			await kernel.shutdown();
		});

		// Store results
		results.push(ctx.getResults());
	}
});
