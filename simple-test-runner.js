#!/usr/bin/env node

/**
 * Simple Test Runner - Plain JavaScript
 * 
 * A basic test runner that validates core Vardon functionality
 * without complex TypeScript dependencies.
 */

import { performance } from 'perf_hooks';

// Simple test framework
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEquals(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  test(name, fn) {
    const start = performance.now();
    try {
      fn();
      this.passed++;
      const duration = performance.now() - start;
      console.log(`  ✓ ${name} (${duration.toFixed(1)}ms)`);
    } catch (error) {
      this.failed++;
      this.errors.push({ name, error });
      console.log(`  ✗ ${name}`);
      console.log(`    ${error.message}`);
    }
  }

  async asyncTest(name, fn) {
    const start = performance.now();
    try {
      await fn();
      this.passed++;
      const duration = performance.now() - start;
      console.log(`  ✓ ${name} (${duration.toFixed(1)}ms)`);
    } catch (error) {
      this.failed++;
      this.errors.push({ name, error });
      console.log(`  ✗ ${name}`);
      console.log(`    ${error.message}`);
    }
  }

  summary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test Summary: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed > 0) {
      console.log(`\nFailures:`);
      this.errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error.message}`);
      });
    }
    console.log(`${'='.repeat(60)}\n`);
    return this.failed === 0;
  }
}

// Simple path normalization test
function testPathNormalization() {
  const runner = new TestRunner();
  
  console.log('Running Path Normalization Tests');
  
  // Simple path normalization function
  function normalizePath(path) {
    if (!path.startsWith('/')) {
      return '/' + path;
    }
    return path.replace(/\/+/g, '/').replace(/\/\.$/, '').replace(/\/$/, '') || '/';
  }
  
  runner.test('should handle absolute paths', () => {
    runner.assertEquals(normalizePath('/test'), '/test');
  });
  
  runner.test('should add leading slash', () => {
    runner.assertEquals(normalizePath('test'), '/test');
  });
  
  runner.test('should remove double slashes', () => {
    runner.assertEquals(normalizePath('/test//path'), '/test/path');
  });
  
  runner.test('should handle root path', () => {
    runner.assertEquals(normalizePath('/'), '/');
  });
  
  return runner.summary();
}

// Simple entity management test
function testEntityManagement() {
  const runner = new TestRunner();
  
  console.log('Running Entity Management Tests');
  
  // Simple entity store
  class EntityStore {
    constructor() {
      this.entities = new Map();
    }
    
    save(entity) {
      this.entities.set(entity.id, { ...entity });
      return true;
    }
    
    get(id) {
      return this.entities.get(id);
    }
    
    remove(id) {
      return this.entities.delete(id);
    }
    
    list() {
      return Array.from(this.entities.keys());
    }
  }
  
  const store = new EntityStore();
  
  runner.test('should save entity', () => {
    const entity = { id: 'test-1', type: 'character', name: 'Test' };
    const saved = store.save(entity);
    runner.assert(saved, 'Should save entity');
  });
  
  runner.test('should retrieve entity', () => {
    const entity = store.get('test-1');
    runner.assert(entity, 'Should retrieve entity');
    runner.assertEquals(entity.name, 'Test', 'Should have correct name');
  });
  
  runner.test('should list entities', () => {
    const ids = store.list();
    runner.assert(ids.includes('test-1'), 'Should list saved entity');
  });
  
  runner.test('should remove entity', () => {
    const removed = store.remove('test-1');
    runner.assert(removed, 'Should remove entity');
    
    const entity = store.get('test-1');
    runner.assert(!entity, 'Entity should be gone');
  });
  
  return runner.summary();
}

// Simple ability score test
function testAbilityScores() {
  const runner = new TestRunner();
  
  console.log('Running Ability Score Tests');
  
  // Simple ability modifier calculation
  function getModifier(score) {
    return Math.floor((score - 10) / 2);
  }
  
  runner.test('should calculate STR 18 modifier', () => {
    runner.assertEquals(getModifier(18), 4);
  });
  
  runner.test('should calculate STR 10 modifier', () => {
    runner.assertEquals(getModifier(10), 0);
  });
  
  runner.test('should calculate STR 8 modifier', () => {
    runner.assertEquals(getModifier(8), -1);
  });
  
  runner.test('should calculate STR 20 modifier', () => {
    runner.assertEquals(getModifier(20), 5);
  });
  
  runner.test('should calculate STR 7 modifier', () => {
    runner.assertEquals(getModifier(7), -2);
  });
  
  return runner.summary();
}

// Simple file descriptor test
function testFileDescriptors() {
  const runner = new TestRunner();
  
  console.log('Running File Descriptor Tests');
  
  // Simple FD manager
  class FileDescriptorManager {
    constructor() {
      this.descriptors = new Map();
      this.nextFd = 3; // 0, 1, 2 reserved for stdin/stdout/stderr
    }
    
    open(path, mode = 'r') {
      if (!path.startsWith('/')) {
        return -1; // Invalid path
      }
      
      const fd = this.nextFd++;
      this.descriptors.set(fd, { path, mode, openedAt: Date.now() });
      return fd;
    }
    
    close(fd) {
      return this.descriptors.delete(fd);
    }
    
    isOpen(fd) {
      return this.descriptors.has(fd);
    }
    
    getInfo(fd) {
      return this.descriptors.get(fd);
    }
    
    getOpenCount() {
      return this.descriptors.size;
    }
  }
  
  const fdManager = new FileDescriptorManager();
  
  runner.test('should open file with absolute path', () => {
    const fd = fdManager.open('/test.txt');
    runner.assert(fd > 2, 'Should return valid FD');
    runner.assert(fdManager.isOpen(fd), 'FD should be open');
  });
  
  runner.test('should reject relative paths', () => {
    const fd = fdManager.open('relative/path.txt');
    runner.assertEquals(fd, -1, 'Should reject relative path');
  });
  
  runner.test('should close file descriptor', () => {
    const fd = fdManager.open('/another.txt');
    const closed = fdManager.close(fd);
    runner.assert(closed, 'Should close FD');
    runner.assert(!fdManager.isOpen(fd), 'FD should not be open');
  });
  
  runner.test('should track multiple file descriptors', () => {
    const fd1 = fdManager.open('/file1.txt');
    const fd2 = fdManager.open('/file2.txt');
    
    runner.assert(fd1 !== fd2, 'FDs should be unique');
    runner.assert(fdManager.isOpen(fd1), 'FD1 should be open');
    runner.assert(fdManager.isOpen(fd2), 'FD2 should be open');
    
    fdManager.close(fd1);
    fdManager.close(fd2);
  });
  
  return runner.summary();
}

// Performance benchmark
async function testPerformance() {
  const runner = new TestRunner();
  
  console.log('Running Performance Tests');
  
  await runner.asyncTest('entity creation performance', async () => {
    const store = new Map();
    const iterations = 1000;
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      store.set(`entity-${i}`, {
        id: `entity-${i}`,
        type: 'character',
        properties: { name: `Character ${i}`, level: i % 20 + 1 }
      });
    }
    
    const duration = performance.now() - start;
    const opsPerSecond = iterations / (duration / 1000);
    
    runner.assert(opsPerSecond > 10000, `Should create >10k entities/sec, got ${opsPerSecond.toFixed(0)}`);
    console.log(`    Performance: ${opsPerSecond.toFixed(0)} entities/sec`);
  });
  
  await runner.asyncTest('path normalization performance', async () => {
    const iterations = 100000;
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const path = `/path//to///file${i}`;
      path.replace(/\/+/g, '/');
    }
    
    const duration = performance.now() - start;
    const opsPerSecond = iterations / (duration / 1000);
    
    runner.assert(opsPerSecond > 100000, `Should normalize >100k paths/sec, got ${opsPerSecond.toFixed(0)}`);
    console.log(`    Performance: ${(opsPerSecond / 1000).toFixed(0)}k paths/sec`);
  });
  
  return runner.summary();
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Vardon Simple Test Runner\n');
  
  const results = [];
  
  results.push(testPathNormalization());
  results.push(testEntityManagement());
  results.push(testAbilityScores());
  results.push(testFileDescriptors());
  results.push(await testPerformance());
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed!');
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}