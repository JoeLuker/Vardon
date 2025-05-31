/**
 * Performance Benchmarking CLI Tests
 * 
 * Tests system performance and identifies bottlenecks.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { FileSystem } from '../src/lib/domain/kernel/FileSystem';
import { CharacterAssembler } from '../src/lib/domain/character/CharacterAssembler';
import { AbilityCapability } from '../src/lib/domain/capabilities/ability';
import { SkillCapability } from '../src/lib/domain/capabilities/skill';
import { CombatCapability } from '../src/lib/domain/capabilities/combat';
import type { Entity } from '../src/lib/domain/kernel/types';

// Performance measurement helper
class PerformanceTimer {
  private marks: Map<string, number> = new Map();
  
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark) || 0;
    const end = endMark ? (this.marks.get(endMark) || performance.now()) : performance.now();
    return end - start;
  }
  
  clear(): void {
    this.marks.clear();
  }
}

registerTestSuite({
  name: 'Performance Tests',
  description: 'System performance benchmarks and optimization validation',
  tags: ['performance', 'benchmark', 'speed'],
  run: async () => {
    const ctx = new TestContext('Performance');
    const timer = new PerformanceTimer();
    
    // Test 1: Filesystem operations
    await ctx.asyncTest('Filesystem operation throughput', async () => {
      const fs = new FileSystem({ debug: false });
      const iterations = 1000;
      
      timer.mark('fs-start');
      
      // Create files
      for (let i = 0; i < iterations; i++) {
        await fs.create(`/perf-test-${i}.txt`, { index: i });
      }
      
      timer.mark('fs-create-done');
      
      // Read files
      for (let i = 0; i < iterations; i++) {
        fs.read(`/perf-test-${i}.txt`);
      }
      
      timer.mark('fs-read-done');
      
      // Delete files
      for (let i = 0; i < iterations; i++) {
        fs.unlink(`/perf-test-${i}.txt`);
      }
      
      timer.mark('fs-delete-done');
      
      const createTime = timer.measure('create', 'fs-start', 'fs-create-done');
      const readTime = timer.measure('read', 'fs-create-done', 'fs-read-done');
      const deleteTime = timer.measure('delete', 'fs-read-done', 'fs-delete-done');
      
      const createOps = iterations / (createTime / 1000);
      const readOps = iterations / (readTime / 1000);
      const deleteOps = iterations / (deleteTime / 1000);
      
      ctx.assertGreaterThan(createOps, 100, 'Should create >100 files/sec');
      ctx.assertGreaterThan(readOps, 1000, 'Should read >1000 files/sec');
      ctx.assertGreaterThan(deleteOps, 500, 'Should delete >500 files/sec');
      
      console.log(`  FS Performance: Create=${createOps.toFixed(0)}/s, Read=${readOps.toFixed(0)}/s, Delete=${deleteOps.toFixed(0)}/s`);
    });
    
    // Test 2: Kernel operations
    await ctx.asyncTest('Kernel syscall performance', async () => {
      const kernel = new Kernel({ debug: false });
      const iterations = 500;
      
      // Create test file
      kernel.create('/kernel-perf-test.txt', { data: 'test' });
      
      timer.mark('kernel-start');
      
      // Open/close cycles
      for (let i = 0; i < iterations; i++) {
        const fd = kernel.open('/kernel-perf-test.txt', 1);
        if (fd > 0) {
          kernel.read(fd);
          kernel.close(fd);
        }
      }
      
      timer.mark('kernel-done');
      
      const totalTime = timer.measure('kernel-ops', 'kernel-start', 'kernel-done');
      const opsPerSecond = (iterations * 3) / (totalTime / 1000); // 3 ops per iteration
      
      ctx.assertGreaterThan(opsPerSecond, 1000, 'Should handle >1000 syscalls/sec');
      
      console.log(`  Kernel Performance: ${opsPerSecond.toFixed(0)} syscalls/s`);
      
      await kernel.shutdown();
    });
    
    // Test 3: Character creation performance
    await ctx.asyncTest('Character creation and loading', async () => {
      const kernel = new Kernel({ debug: false });
      const assembler = new CharacterAssembler(kernel);
      const iterations = 50;
      
      timer.mark('char-create-start');
      
      // Create characters
      const characterIds: string[] = [];
      for (let i = 0; i < iterations; i++) {
        const char = await assembler.createCharacter({
          name: `Perf Test ${i}`,
          level: 1,
          class: 'fighter'
        });
        characterIds.push(char.id);
      }
      
      timer.mark('char-create-done');
      
      // Load characters
      for (const id of characterIds) {
        kernel.getEntity(id);
      }
      
      timer.mark('char-load-done');
      
      const createTime = timer.measure('create', 'char-create-start', 'char-create-done');
      const loadTime = timer.measure('load', 'char-create-done', 'char-load-done');
      
      const createRate = iterations / (createTime / 1000);
      const loadRate = iterations / (loadTime / 1000);
      
      ctx.assertGreaterThan(createRate, 10, 'Should create >10 characters/sec');
      ctx.assertGreaterThan(loadRate, 100, 'Should load >100 characters/sec');
      
      console.log(`  Character Performance: Create=${createRate.toFixed(1)}/s, Load=${loadRate.toFixed(0)}/s`);
      
      await kernel.shutdown();
    });
    
    // Test 4: Capability calculations
    await ctx.asyncTest('Capability calculation performance', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Mount capabilities
      kernel.mount('/dev/ability', new AbilityCapability({ debug: false }));
      kernel.mount('/dev/skill', new SkillCapability({ debug: false }));
      kernel.mount('/dev/combat', new CombatCapability({ debug: false }));
      
      // Create complex character
      const character: Entity = {
        id: 'calc-perf-test',
        type: 'character',
        properties: {
          level: 10,
          abilities: { str: 18, dex: 16, con: 14, int: 12, wis: 13, cha: 10 },
          skills: {},
          hp: { max: 85, current: 85 },
          ac: { armor: 8, shield: 2, natural: 1, deflection: 1, dodge: 1 }
        }
      };
      
      // Add all skills
      const skills = ['acrobatics', 'athletics', 'bluff', 'climb', 'diplomacy', 'perception', 'stealth'];
      for (const skill of skills) {
        character.properties.skills[skill] = { ranks: 10, classSkill: true, miscBonus: 2 };
      }
      
      kernel.saveEntity(character);
      
      const iterations = 100;
      timer.mark('calc-start');
      
      // Repeatedly calculate all values
      for (let i = 0; i < iterations; i++) {
        // Access each capability
        const abilityFd = kernel.open('/dev/ability', 1);
        const skillFd = kernel.open('/dev/skill', 1);
        const combatFd = kernel.open('/dev/combat', 1);
        
        kernel.read(abilityFd);
        kernel.read(skillFd);
        kernel.read(combatFd);
        
        kernel.close(abilityFd);
        kernel.close(skillFd);
        kernel.close(combatFd);
      }
      
      timer.mark('calc-done');
      
      const calcTime = timer.measure('calculations', 'calc-start', 'calc-done');
      const calcsPerSecond = iterations / (calcTime / 1000);
      
      ctx.assertGreaterThan(calcsPerSecond, 50, 'Should calculate >50 full characters/sec');
      
      console.log(`  Calculation Performance: ${calcsPerSecond.toFixed(0)} full calculations/s`);
      
      await kernel.shutdown();
    });
    
    // Test 5: Memory usage patterns
    ctx.test('Memory efficiency test', () => {
      // Note: In browser/Node, we can't directly measure memory
      // This test validates object creation doesn't leak
      
      const kernel = new Kernel({ debug: false });
      const initialEntities = kernel.getEntityIds().length;
      
      // Create and delete many entities
      for (let i = 0; i < 100; i++) {
        const entity: Entity = {
          id: `mem-test-${i}`,
          type: 'character',
          properties: { name: `Memory Test ${i}` }
        };
        kernel.saveEntity(entity);
      }
      
      // Delete all
      for (let i = 0; i < 100; i++) {
        kernel.removeEntity(`mem-test-${i}`);
      }
      
      const finalEntities = kernel.getEntityIds().length;
      ctx.assertEquals(finalEntities, initialEntities, 'Should not leak entities');
      
      kernel.shutdown();
    });
    
    // Test 6: Concurrent operation handling
    await ctx.asyncTest('Concurrent operation performance', async () => {
      const kernel = new Kernel({ debug: false });
      const concurrency = 10;
      
      timer.mark('concurrent-start');
      
      // Launch concurrent operations
      const promises = [];
      for (let i = 0; i < concurrency; i++) {
        promises.push((async () => {
          const entity: Entity = {
            id: `concurrent-${i}`,
            type: 'character',
            properties: { index: i }
          };
          
          // Multiple operations per task
          kernel.saveEntity(entity);
          const loaded = kernel.getEntity(entity.id);
          if (loaded) {
            loaded.properties.modified = true;
            kernel.saveEntity(loaded);
          }
          kernel.removeEntity(entity.id);
        })());
      }
      
      await Promise.all(promises);
      timer.mark('concurrent-done');
      
      const concurrentTime = timer.measure('concurrent', 'concurrent-start', 'concurrent-done');
      const opsCompleted = concurrency * 4; // 4 operations per task
      const opsPerSecond = opsCompleted / (concurrentTime / 1000);
      
      ctx.assertGreaterThan(opsPerSecond, 100, 'Should handle >100 concurrent ops/sec');
      
      console.log(`  Concurrent Performance: ${opsPerSecond.toFixed(0)} ops/s with ${concurrency} workers`);
      
      await kernel.shutdown();
    });
    
    // Test 7: Large data handling
    await ctx.asyncTest('Large entity handling', async () => {
      const kernel = new Kernel({ debug: false });
      
      // Create entity with lots of data
      const largeEntity: Entity = {
        id: 'large-entity-test',
        type: 'character',
        properties: {
          name: 'Large Data Test',
          // Add many properties
          skills: {},
          feats: [],
          inventory: [],
          spells: []
        }
      };
      
      // Add 50 skills
      for (let i = 0; i < 50; i++) {
        largeEntity.properties.skills[`skill_${i}`] = {
          ranks: i,
          classSkill: i % 2 === 0,
          miscBonus: i % 3
        };
      }
      
      // Add 100 feats
      for (let i = 0; i < 100; i++) {
        largeEntity.properties.feats.push({
          id: `feat_${i}`,
          name: `Test Feat ${i}`,
          prerequisites: [`feat_${Math.max(0, i - 1)}`]
        });
      }
      
      // Add 200 inventory items
      for (let i = 0; i < 200; i++) {
        largeEntity.properties.inventory.push({
          id: `item_${i}`,
          name: `Item ${i}`,
          quantity: i % 10 + 1,
          weight: i * 0.1
        });
      }
      
      timer.mark('large-save-start');
      const saved = kernel.saveEntity(largeEntity);
      timer.mark('large-save-done');
      
      ctx.assertTrue(saved, 'Should save large entity');
      
      timer.mark('large-load-start');
      const loaded = kernel.getEntity('large-entity-test');
      timer.mark('large-load-done');
      
      ctx.assertNotNull(loaded, 'Should load large entity');
      ctx.assertEquals(Object.keys(loaded!.properties.skills).length, 50, 'Should have all skills');
      ctx.assertEquals(loaded!.properties.feats.length, 100, 'Should have all feats');
      ctx.assertEquals(loaded!.properties.inventory.length, 200, 'Should have all items');
      
      const saveTime = timer.measure('save', 'large-save-start', 'large-save-done');
      const loadTime = timer.measure('load', 'large-load-start', 'large-load-done');
      
      ctx.assertLessThan(saveTime, 100, 'Should save large entity in <100ms');
      ctx.assertLessThan(loadTime, 50, 'Should load large entity in <50ms');
      
      console.log(`  Large Entity: Save=${saveTime.toFixed(1)}ms, Load=${loadTime.toFixed(1)}ms`);
      
      await kernel.shutdown();
    });
    
    // Test 8: Path resolution performance
    ctx.test('Path resolution efficiency', () => {
      const fs = new FileSystem({ debug: false });
      const iterations = 10000;
      
      const testPaths = [
        '/simple/path',
        '/path/with/many/nested/directories/file.txt',
        '/path/../other/./directory/../file',
        '/../../../normalized/path'
      ];
      
      timer.mark('path-start');
      
      for (let i = 0; i < iterations; i++) {
        for (const path of testPaths) {
          fs.normalizePath(path);
        }
      }
      
      timer.mark('path-done');
      
      const pathTime = timer.measure('paths', 'path-start', 'path-done');
      const pathsPerSecond = (iterations * testPaths.length) / (pathTime / 1000);
      
      ctx.assertGreaterThan(pathsPerSecond, 100000, 'Should normalize >100k paths/sec');
      
      console.log(`  Path Resolution: ${(pathsPerSecond / 1000).toFixed(0)}k paths/s`);
    });
    
    // Test 9: Event system performance
    await ctx.asyncTest('Event bus throughput', async () => {
      const kernel = new Kernel({ debug: false });
      let eventCount = 0;
      
      // Register listeners
      kernel.events.on('test:event', () => eventCount++);
      kernel.events.on('test:event', () => eventCount++);
      kernel.events.on('test:event', () => eventCount++);
      
      const iterations = 10000;
      timer.mark('event-start');
      
      for (let i = 0; i < iterations; i++) {
        kernel.events.emit('test:event', { index: i });
      }
      
      timer.mark('event-done');
      
      const eventTime = timer.measure('events', 'event-start', 'event-done');
      const eventsPerSecond = iterations / (eventTime / 1000);
      
      ctx.assertEquals(eventCount, iterations * 3, 'All listeners should fire');
      ctx.assertGreaterThan(eventsPerSecond, 10000, 'Should emit >10k events/sec');
      
      console.log(`  Event System: ${(eventsPerSecond / 1000).toFixed(0)}k events/s`);
      
      await kernel.shutdown();
    });
    
    // Test 10: Overall system stress test
    await ctx.asyncTest('System stress test', async () => {
      const kernel = new Kernel({ debug: false });
      const duration = 1000; // 1 second stress test
      const startTime = Date.now();
      let operations = 0;
      
      // Mixed operations under load
      while (Date.now() - startTime < duration) {
        const op = operations % 4;
        
        switch (op) {
          case 0: // Create entity
            kernel.saveEntity({
              id: `stress-${operations}`,
              type: 'character',
              properties: { op: operations }
            });
            break;
            
          case 1: // Read entity
            kernel.getEntity(`stress-${Math.max(0, operations - 10)}`);
            break;
            
          case 2: // File operation
            const fd = kernel.open('/tmp/stress-test', 2);
            if (fd > 0) {
              kernel.write(fd, { count: operations });
              kernel.close(fd);
            }
            break;
            
          case 3: // Delete entity
            kernel.removeEntity(`stress-${Math.max(0, operations - 20)}`);
            break;
        }
        
        operations++;
      }
      
      const opsPerSecond = operations / (duration / 1000);
      ctx.assertGreaterThan(opsPerSecond, 1000, 'Should handle >1000 mixed ops/sec under stress');
      
      console.log(`  Stress Test: ${opsPerSecond.toFixed(0)} mixed ops/s sustained`);
      
      await kernel.shutdown();
    });
    
    // Store results
    results.push(ctx.getResults());
  }
});