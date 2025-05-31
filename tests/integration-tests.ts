/**
 * Integration Tests
 * 
 * End-to-end tests that validate the complete system working together.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { CharacterAssembler } from '../src/lib/domain/character/CharacterAssembler';
import { AbilityCapability } from '../src/lib/domain/capabilities/ability';
import { SkillCapability } from '../src/lib/domain/capabilities/skill';
import { CombatCapability } from '../src/lib/domain/capabilities/combat';
import { BonusCapability } from '../src/lib/domain/capabilities/bonus';
import { ConditionCapability } from '../src/lib/domain/capabilities/condition';
import { DatabaseCapability } from '../src/lib/domain/capabilities/database/DatabaseCapability';
import { CapabilityKit } from '../src/lib/domain/capabilities/CapabilityKit';
import { SkillFocusPlugin } from '../src/lib/domain/plugins/feats/SkillFocusPlugin';
import type { Entity } from '../src/lib/domain/kernel/types';

registerTestSuite({
  name: 'Integration Tests',
  description: 'Full system integration tests combining all components',
  tags: ['integration', 'e2e', 'system'],
  run: async () => {
    const ctx = new TestContext('Integration');
    
    // Test 1: Complete character creation workflow
    await ctx.asyncTest('Full character creation workflow', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount all capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      kernel.mount('/dev/bonus', new BonusCapability({ debug: false }));
      kernel.mount('/dev/condition', new ConditionCapability({ debug: false }));
      kernel.mount('/dev/database', new DatabaseCapability({ debug: false }));
      
      // Create character using assembler
      const assembler = new CharacterAssembler(kernel);
      const character = await assembler.createCharacter({
        name: 'Integration Test Hero',
        level: 5,
        class: 'fighter',
        ancestry: 'human',
        background: 'soldier',
        abilities: {
          str: 16,
          dex: 14,
          con: 15,
          int: 10,
          wis: 12,
          cha: 8
        }
      });
      
      ctx.assertNotNull(character, 'Should create character');
      ctx.assertEquals(character.properties.level, 5, 'Should be level 5');
      
      // Use capability kit to access data
      const kit = new CapabilityKit(kernel);
      
      // Get abilities
      const abilities = await kit.getAbilities(character.id);
      ctx.assertEquals(abilities.str.score, 16, 'STR should be 16');
      ctx.assertEquals(abilities.str.modifier, 3, 'STR modifier should be +3');
      
      // Get combat stats
      const combat = await kit.getCombatStats(character.id);
      ctx.assertGreaterThan(combat.hp.max, 30, 'Should have reasonable HP');
      ctx.assertGreaterThan(combat.ac.total, 10, 'Should have AC > 10');
      
      await kernel.shutdown();
    });
    
    // Test 2: Character progression
    await ctx.asyncTest('Character level progression', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      
      // Create level 1 character
      const character: Entity = {
        id: 'progression-test',
        type: 'character',
        properties: {
          name: 'Level Test',
          level: 1,
          class: 'wizard',
          hitDice: 'd6',
          abilities: { str: 10, dex: 14, con: 12, int: 18, wis: 13, cha: 11 },
          hp: { max: 7, current: 7 }, // 6 + 1 con
          skills: {
            knowledge_arcana: { ranks: 1, classSkill: true }
          }
        }
      };
      
      kernel.saveEntity(character);
      
      // Level up to 2
      character.properties.level = 2;
      character.properties.hp.max = 11; // +4 (3.5 avg + 0.5 con)
      character.properties.hp.current = 11;
      character.properties.skills.knowledge_arcana.ranks = 2;
      character.properties.skills.spellcraft = { ranks: 1, classSkill: true };
      
      kernel.saveEntity(character);
      
      // Verify progression
      const loaded = kernel.getEntity('progression-test');
      ctx.assertNotNull(loaded, 'Should load character');
      ctx.assertEquals(loaded!.properties.level, 2, 'Should be level 2');
      ctx.assertEquals(loaded!.properties.hp.max, 11, 'HP should increase');
      ctx.assertEquals(loaded!.properties.skills.knowledge_arcana.ranks, 2, 'Skill ranks should increase');
      
      await kernel.shutdown();
    });
    
    // Test 3: Combat simulation
    await ctx.asyncTest('Combat damage and healing', async () => {
      const kernel = new Kernel({ debug: false });
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      kernel.mount('/dev/condition', new ConditionCapability({ debug: false }));
      
      // Create combatant
      const character: Entity = {
        id: 'combat-test',
        type: 'character',
        properties: {
          name: 'Combat Test',
          hp: { max: 50, current: 50, temp: 0 },
          conditions: []
        }
      };
      
      kernel.saveEntity(character);
      
      // Take damage
      character.properties.hp.current = 35; // 15 damage
      kernel.saveEntity(character);
      
      // Add wounded condition
      character.properties.conditions.push('wounded');
      kernel.saveEntity(character);
      
      // Heal
      character.properties.hp.current = 45; // 10 healing
      kernel.saveEntity(character);
      
      // Remove condition
      character.properties.conditions = [];
      kernel.saveEntity(character);
      
      // Verify final state
      const final = kernel.getEntity('combat-test');
      ctx.assertEquals(final!.properties.hp.current, 45, 'HP should be 45');
      ctx.assertEquals(final!.properties.conditions.length, 0, 'Should have no conditions');
      
      await kernel.shutdown();
    });
    
    // Test 4: Feat application
    await ctx.asyncTest('Apply feats through plugins', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      
      // Register feat plugins
      kernel.registerPlugin(new SkillFocusPlugin());
      
      // Create character
      const character: Entity = {
        id: 'feat-test',
        type: 'character',
        properties: {
          name: 'Feat Test',
          level: 3,
          abilities: { str: 12, dex: 15, con: 14, int: 10, wis: 16, cha: 8 },
          skills: {
            perception: { ranks: 3, classSkill: true, miscBonus: 0 },
            stealth: { ranks: 3, classSkill: false, miscBonus: 0 }
          },
          feats: []
        }
      };
      
      kernel.saveEntity(character);
      
      // Apply Skill Focus (Perception)
      await kernel.executePlugin('skill-focus', 'feat-test', {
        skill: 'perception'
      });
      
      // Apply Skill Focus (Stealth) 
      await kernel.executePlugin('skill-focus', 'feat-test', {
        skill: 'stealth'
      });
      
      // Verify feats applied
      const loaded = kernel.getEntity('feat-test');
      ctx.assertEquals(loaded!.properties.feats.length, 2, 'Should have 2 feats');
      ctx.assertEquals(loaded!.properties.skills.perception.miscBonus, 3, 'Perception should have +3');
      ctx.assertEquals(loaded!.properties.skills.stealth.miscBonus, 3, 'Stealth should have +3');
      
      await kernel.shutdown();
    });
    
    // Test 5: Multi-class character
    await ctx.asyncTest('Multi-class character calculations', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount all capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      
      // Fighter 3 / Rogue 2
      const character: Entity = {
        id: 'multiclass-test',
        type: 'character',
        properties: {
          name: 'Fighter/Rogue',
          classes: [
            { name: 'fighter', level: 3, hitDice: 'd10' },
            { name: 'rogue', level: 2, hitDice: 'd8' }
          ],
          totalLevel: 5,
          abilities: { str: 15, dex: 17, con: 13, int: 12, wis: 10, cha: 8 },
          hp: {
            max: 38, // 10 + 2d10 + 2d8 + 5*1 (con)
            current: 38
          },
          saves: {
            fort: { base: 3 }, // Fighter good
            ref: { base: 3 },  // Rogue good  
            will: { base: 1 }  // Both poor
          },
          skills: {
            // Fighter skills
            climb: { ranks: 3, classSkill: true },
            intimidate: { ranks: 2, classSkill: true },
            // Rogue skills
            stealth: { ranks: 5, classSkill: true },
            disable_device: { ranks: 4, classSkill: true }
          }
        }
      };
      
      kernel.saveEntity(character);
      
      // Verify calculations work with multiclass
      const kit = new CapabilityKit(kernel);
      const combat = await kit.getCombatStats('multiclass-test');
      
      ctx.assertEquals(combat.saves.fort.total, 4, 'Fort should be +4 (3 base + 1 con)');
      ctx.assertEquals(combat.saves.ref.total, 6, 'Ref should be +6 (3 base + 3 dex)');
      
      await kernel.shutdown();
    });
    
    // Test 6: Equipment and bonuses
    await ctx.asyncTest('Equipment bonus stacking', async () => {
      const kernel = new Kernel({ debug: false });
      kernel.mount('/dev/bonus', new BonusCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      
      const character: Entity = {
        id: 'equipment-test',
        type: 'character',
        properties: {
          name: 'Equipment Test',
          abilities: { str: 14, dex: 16, con: 12, int: 10, wis: 11, cha: 13 },
          equipment: {
            armor: { name: 'Chain Shirt', bonus: 4, type: 'armor' },
            shield: { name: 'Heavy Shield', bonus: 2, type: 'shield' },
            ring: { name: 'Ring of Protection', bonus: 1, type: 'deflection' },
            amulet: { name: 'Amulet of Natural Armor', bonus: 1, type: 'natural' }
          },
          ac: {
            armor: 4,
            shield: 2,
            natural: 1,
            deflection: 1,
            dodge: 0
          }
        }
      };
      
      kernel.saveEntity(character);
      
      // Calculate total AC
      const kit = new CapabilityKit(kernel);
      const combat = await kit.getCombatStats('equipment-test');
      
      // 10 + 4 armor + 2 shield + 3 dex + 1 natural + 1 deflection = 21
      ctx.assertEquals(combat.ac.total, 21, 'Total AC should be 21');
      ctx.assertEquals(combat.ac.touch, 14, 'Touch AC should be 14'); // 10 + 3 dex + 1 deflection
      ctx.assertEquals(combat.ac.flatFooted, 18, 'Flat-footed should be 18'); // 21 - 3 dex
      
      await kernel.shutdown();
    });
    
    // Test 7: Spell management
    await ctx.asyncTest('Spellcaster spell management', async () => {
      const kernel = new Kernel({ debug: false });
      
      const wizard: Entity = {
        id: 'spell-test',
        type: 'character',
        properties: {
          name: 'Test Wizard',
          level: 5,
          class: 'wizard',
          abilities: { str: 8, dex: 14, con: 12, int: 18, wis: 13, cha: 10 },
          spells: {
            known: [
              { level: 0, spells: ['detect magic', 'light', 'mage hand', 'prestidigitation'] },
              { level: 1, spells: ['magic missile', 'shield', 'identify', 'sleep'] },
              { level: 2, spells: ['scorching ray', 'web', 'invisibility'] },
              { level: 3, spells: ['fireball', 'haste'] }
            ],
            slots: [
              { level: 0, total: 4, used: 0 },
              { level: 1, total: 4, used: 1 }, // Cast one 1st level
              { level: 2, total: 3, used: 0 },
              { level: 3, total: 2, used: 0 }
            ]
          }
        }
      };
      
      kernel.saveEntity(wizard);
      
      // Cast spells
      wizard.properties.spells.slots[1].used = 2; // Cast another 1st
      wizard.properties.spells.slots[2].used = 1; // Cast a 2nd
      wizard.properties.spells.slots[3].used = 1; // Cast a 3rd
      
      kernel.saveEntity(wizard);
      
      // Verify spell tracking
      const loaded = kernel.getEntity('spell-test');
      ctx.assertEquals(loaded!.properties.spells.slots[1].used, 2, 'Should have used 2 1st level slots');
      ctx.assertEquals(loaded!.properties.spells.slots[1].total - loaded!.properties.spells.slots[1].used, 2, 'Should have 2 1st level slots remaining');
      
      await kernel.shutdown();
    });
    
    // Test 8: Database integration
    await ctx.asyncTest('Database query through filesystem', async () => {
      const kernel = new Kernel({ debug: false });
      kernel.mount('/dev/database', new DatabaseCapability({ debug: false }));
      
      // Query for game data through filesystem
      const queryPath = '/proc/database/skills';
      kernel.create(queryPath, {
        table: 'skill',
        select: ['id', 'name', 'ability_id', 'trained_only'],
        where: { trained_only: true },
        limit: 10
      });
      
      const fd = kernel.open(queryPath, 1);
      if (fd > 0) {
        const [error, result] = kernel.read(fd);
        
        if (error === 0 && result && result.data) {
          ctx.assertGreaterThan(result.data.length, 0, 'Should have trained-only skills');
          
          // Verify all are trained-only
          for (const skill of result.data) {
            ctx.assertTrue(skill.trained_only, `${skill.name} should be trained-only`);
          }
        }
        
        kernel.close(fd);
      }
      
      await kernel.shutdown();
    });
    
    // Test 9: Signal and event propagation
    await ctx.asyncTest('System-wide event propagation', async () => {
      const kernel = new Kernel({ debug: false });
      const events: string[] = [];
      
      // Register event listeners
      kernel.events.on('entity:created', (e) => events.push('created'));
      kernel.events.on('entity:modified', (e) => events.push('modified'));
      kernel.events.on('entity:removed', (e) => events.push('removed'));
      kernel.events.on('capability:registered', (e) => events.push('capability'));
      kernel.events.on('plugin:executed', (e) => events.push('plugin'));
      
      // Perform operations
      kernel.mount('/dev/test', new AbilityCapability({ debug: false }));
      
      const entity: Entity = {
        id: 'event-test',
        type: 'character',
        properties: { name: 'Event Test' }
      };
      
      kernel.saveEntity(entity);
      entity.properties.modified = true;
      kernel.saveEntity(entity);
      kernel.removeEntity('event-test');
      
      // Verify events fired
      ctx.assertContains(events, 'capability', 'Should fire capability event');
      ctx.assertContains(events, 'created', 'Should fire created event');
      ctx.assertContains(events, 'modified', 'Should fire modified event');
      ctx.assertContains(events, 'removed', 'Should fire removed event');
      
      await kernel.shutdown();
    });
    
    // Test 10: Full system stress test
    await ctx.asyncTest('Full system integration stress test', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount all capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      kernel.mount('/dev/bonus', new BonusCapability({ debug: false }));
      kernel.mount('/dev/condition', new ConditionCapability({ debug: false }));
      
      // Register plugins
      kernel.registerPlugin(new SkillFocusPlugin());
      
      // Create party of characters
      const party = [];
      const assembler = new CharacterAssembler(kernel);
      
      for (let i = 0; i < 4; i++) {
        const character = await assembler.createCharacter({
          name: `Party Member ${i + 1}`,
          level: 5 + i,
          class: ['fighter', 'wizard', 'rogue', 'cleric'][i],
          abilities: {
            str: 10 + i * 2,
            dex: 12 + i,
            con: 14,
            int: 13 + i,
            wis: 11 + i * 2,
            cha: 10
          }
        });
        party.push(character);
      }
      
      // Simulate combat round
      const kit = new CapabilityKit(kernel);
      
      for (const character of party) {
        // Get all stats
        const abilities = await kit.getAbilities(character.id);
        const combat = await kit.getCombatStats(character.id);
        const skills = await kit.getSkills(character.id);
        
        // Verify data integrity
        ctx.assertNotNull(abilities, `Should have abilities for ${character.properties.name}`);
        ctx.assertNotNull(combat, `Should have combat stats for ${character.properties.name}`);
        ctx.assertNotNull(skills, `Should have skills for ${character.properties.name}`);
        
        // Take some damage
        character.properties.hp.current = Math.max(1, combat.hp.current - 10);
        kernel.saveEntity(character);
      }
      
      // Verify all characters still exist and are damaged
      for (const character of party) {
        const loaded = kernel.getEntity(character.id);
        ctx.assertNotNull(loaded, `Should load ${character.properties.name}`);
        ctx.assertLessThan(loaded!.properties.hp.current, loaded!.properties.hp.max, 'Should be damaged');
      }
      
      await kernel.shutdown();
    });
    
    // Store results
    results.push(ctx.getResults());
  }
});