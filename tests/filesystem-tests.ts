/**
 * Filesystem Persistence CLI Tests
 * 
 * Tests for virtual filesystem persistence and browser storage integration.
 */

import { registerTestSuite, TestContext, results } from './cli-runner';
import { FileSystem } from '../src/lib/domain/kernel/FileSystem';
import { BrowserStorage } from '../src/lib/domain/kernel/BrowserStorage';
import { ErrorCode } from '../src/lib/domain/kernel/types';

// Mock localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
  (global as any).localStorage = {
    data: new Map<string, string>(),
    getItem(key: string): string | null {
      return this.data.get(key) || null;
    },
    setItem(key: string, value: string): void {
      this.data.set(key, value);
    },
    removeItem(key: string): void {
      this.data.delete(key);
    },
    clear(): void {
      this.data.clear();
    }
  };
}

registerTestSuite({
  name: 'Filesystem Persistence Tests',
  description: 'Tests for virtual filesystem storage, persistence, and recovery',
  tags: ['filesystem', 'storage', 'persistence'],
  run: async () => {
    const ctx = new TestContext('Filesystem Persistence');
    
    // Test 1: Basic file persistence
    await ctx.asyncTest('File creation and persistence', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Create a file
      const result = await fs.create('/test.txt', { content: 'Hello, World!' });
      ctx.assertTrue(result.success, 'Should create file');
      
      // Read back
      const [error, data] = fs.read('/test.txt');
      ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should read file');
      ctx.assertEquals(data.content, 'Hello, World!', 'Content should match');
      
      // Unmount and remount
      await fs.unmount();
      await fs.mount();
      
      // File should still exist
      const [error2, data2] = fs.read('/test.txt');
      ctx.assertEquals(error2, ErrorCode.SUCCESS, 'Should read after remount');
      ctx.assertEquals(data2.content, 'Hello, World!', 'Content should persist');
    });
    
    // Test 2: Directory structure persistence
    await ctx.asyncTest('Directory hierarchy persistence', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Create nested directories
      await fs.mkdir('/projects/vardon/src/lib', true);
      await fs.create('/projects/vardon/README.md', { content: 'Vardon Project' });
      await fs.create('/projects/vardon/src/index.ts', { content: 'export {}' });
      
      // Verify structure
      const [error1, entries1] = fs.readdir('/projects/vardon');
      ctx.assertEquals(error1, ErrorCode.SUCCESS, 'Should list directory');
      ctx.assertEquals(entries1.length, 2, 'Should have 2 entries');
      
      // Unmount and remount
      await fs.unmount();
      await fs.mount();
      
      // Structure should persist
      const [error2, entries2] = fs.readdir('/projects/vardon');
      ctx.assertEquals(error2, ErrorCode.SUCCESS, 'Should list after remount');
      ctx.assertEquals(entries2.length, 2, 'Should still have 2 entries');
      
      // Check nested file
      const [error3, data] = fs.read('/projects/vardon/src/index.ts');
      ctx.assertEquals(error3, ErrorCode.SUCCESS, 'Should read nested file');
      ctx.assertEquals(data.content, 'export {}', 'Nested file content should persist');
    });
    
    // Test 3: Storage size limits
    ctx.test('Storage size handling', () => {
      const storage = new BrowserStorage();
      
      // Create large data
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      
      try {
        storage.setItem('large-test', largeData);
        const retrieved = storage.getItem('large-test');
        ctx.assertEquals(retrieved, largeData, 'Should store and retrieve large data');
        storage.removeItem('large-test');
      } catch (error) {
        // Storage might have quota limits
        console.log('Storage quota test:', error);
      }
    });
    
    // Test 4: File modification persistence
    await ctx.asyncTest('File modification tracking', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Create file
      await fs.create('/modtest.txt', { version: 1 });
      const stats1 = fs.stat('/modtest.txt');
      ctx.assertNotNull(stats1, 'Should have stats');
      const mtime1 = stats1!.modifiedAt;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Modify file
      fs.write('/modtest.txt', { version: 2 });
      const stats2 = fs.stat('/modtest.txt');
      const mtime2 = stats2!.modifiedAt;
      
      ctx.assertGreaterThan(mtime2, mtime1, 'Modification time should increase');
      
      // Persist
      await fs.unmount();
      await fs.mount();
      
      // Check modification persisted
      const [error, data] = fs.read('/modtest.txt');
      ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should read modified file');
      ctx.assertEquals(data.version, 2, 'Modified content should persist');
    });
    
    // Test 5: Mount point persistence
    await ctx.asyncTest('Device mount point persistence', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Mount devices
      fs.mount('/dev/test1', 'test-device-1');
      fs.mount('/dev/test2', 'test-device-2');
      
      // Verify mounts
      ctx.assertTrue(fs.exists('/dev/test1'), 'Mount point 1 should exist');
      ctx.assertTrue(fs.exists('/dev/test2'), 'Mount point 2 should exist');
      
      // Unmount and remount filesystem
      await fs.unmount();
      await fs.mount();
      
      // Mount points should persist
      ctx.assertTrue(fs.exists('/dev/test1'), 'Mount point 1 should persist');
      ctx.assertTrue(fs.exists('/dev/test2'), 'Mount point 2 should persist');
    });
    
    // Test 6: Corruption recovery
    await ctx.asyncTest('Filesystem corruption recovery', async () => {
      const storage = new BrowserStorage();
      
      // Corrupt storage data
      storage.setItem('vardon-fs:inodes', 'invalid json {{{');
      
      // Try to mount filesystem
      const fs = new FileSystem({ debug: false });
      
      // Should handle corruption gracefully
      ctx.assertTrue(fs.exists('/'), 'Root should exist after corruption');
      
      // Should be able to create files
      const result = await fs.create('/recovery-test.txt', { content: 'recovered' });
      ctx.assertTrue(result.success, 'Should create file after recovery');
    });
    
    // Test 7: Concurrent operations
    await ctx.asyncTest('Concurrent file operations', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Create multiple files concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(fs.create(`/concurrent-${i}.txt`, { index: i }));
      }
      
      const results = await Promise.all(promises);
      
      // All should succeed
      for (let i = 0; i < results.length; i++) {
        ctx.assertTrue(results[i].success, `File ${i} should be created`);
      }
      
      // Verify all files exist
      for (let i = 0; i < 10; i++) {
        ctx.assertTrue(fs.exists(`/concurrent-${i}.txt`), `File ${i} should exist`);
      }
    });
    
    // Test 8: Storage cleanup
    await ctx.asyncTest('Storage cleanup and optimization', async () => {
      const fs = new FileSystem({ debug: false });
      
      // Create and delete many files
      for (let i = 0; i < 20; i++) {
        await fs.create(`/temp-${i}.txt`, { data: 'temporary' });
      }
      
      // Delete half
      for (let i = 0; i < 10; i++) {
        fs.unlink(`/temp-${i}.txt`);
      }
      
      // Check remaining
      const [error, entries] = fs.readdir('/');
      ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should list root');
      
      const tempFiles = entries.filter(e => e.name.startsWith('temp-'));
      ctx.assertEquals(tempFiles.length, 10, 'Should have 10 temp files remaining');
      
      // Clear all
      await fs.clear();
      
      // Should only have standard directories
      const [error2, entries2] = fs.readdir('/');
      const nonStandardEntries = entries2.filter(e => 
        !['dev', 'proc', 'entity', 'etc', 'var', 'tmp', 'bin'].includes(e.name)
      );
      ctx.assertEquals(nonStandardEntries.length, 0, 'Should only have standard dirs after clear');
    });
    
    // Test 9: Filesystem metadata
    ctx.test('Filesystem metadata persistence', () => {
      const fs = new FileSystem({ debug: false });
      
      // Check metadata
      const storage = new BrowserStorage();
      const metadataStr = storage.getItem('vardon-fs:metadata');
      ctx.assertNotNull(metadataStr, 'Should have metadata');
      
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        ctx.assertDefined(metadata.version, 'Should have version');
        ctx.assertDefined(metadata.createdAt, 'Should have creation time');
        ctx.assertDefined(metadata.mountCount, 'Should have mount count');
        ctx.assertGreaterThan(metadata.mountCount, 0, 'Mount count should be positive');
      }
    });
    
    // Test 10: Cross-session persistence
    await ctx.asyncTest('Cross-session data persistence', async () => {
      // First session
      const fs1 = new FileSystem({ debug: false });
      await fs1.create('/session-test.txt', { 
        session: 1,
        timestamp: Date.now()
      });
      await fs1.unmount();
      
      // Simulate new session
      const fs2 = new FileSystem({ debug: false });
      
      // Data should persist
      const [error, data] = fs2.read('/session-test.txt');
      ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should read cross-session');
      ctx.assertEquals(data.session, 1, 'Session data should persist');
      ctx.assertDefined(data.timestamp, 'Timestamp should persist');
    });
    
    // Store results
    results.push(ctx.getResults());
  }
});