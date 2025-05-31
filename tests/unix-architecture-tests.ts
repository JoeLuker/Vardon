/**
 * Unix Architecture CLI Tests
 *
 * Comprehensive tests for the Unix-style filesystem and kernel implementation.
 * These tests validate that the system follows Unix principles correctly.
 */

import { registerTestSuite, TestContext, colors, results } from './cli-runner';
import { Kernel } from '../src/lib/domain/kernel/Kernel';
import { FileSystem } from '../src/lib/domain/kernel/FileSystem';
import { ErrorCode, OpenMode } from '../src/lib/domain/kernel/types';
import { BaseCapability } from '../src/lib/domain/capabilities/BaseCapability';

// Test capability for mounting
class TestCapability extends BaseCapability {
	public readonly id = 'test-cap';

	read(fd: number, buffer: any): number {
		buffer.data = 'test data';
		return ErrorCode.SUCCESS;
	}

	write(fd: number, buffer: any): number {
		return ErrorCode.SUCCESS;
	}
}

registerTestSuite({
	name: 'Unix Architecture Tests',
	description: 'Tests for Unix-style filesystem, kernel syscalls, and device management',
	tags: ['unix', 'filesystem', 'kernel'],
	run: async () => {
		const ctx = new TestContext('Unix Architecture');

		// Test 1: Filesystem path operations
		ctx.test('Absolute path validation', () => {
			const kernel = new Kernel({ debug: false });

			// Valid absolute paths
			const fd1 = kernel.open('/test.txt', OpenMode.READ);
			ctx.assertEquals(fd1, -1, 'Should fail - file does not exist');

			// Invalid relative paths
			const fd2 = kernel.open('relative/path.txt', OpenMode.READ);
			ctx.assertEquals(fd2, -1, 'Should reject relative paths');

			kernel.shutdown();
		});

		// Test 2: File descriptor management
		await ctx.asyncTest('File descriptor lifecycle', async () => {
			const kernel = new Kernel({ debug: false });

			// Create a test file
			const createResult = kernel.create('/test.txt', { content: 'test' });
			ctx.assertTrue(createResult.success, 'Should create file');

			// Open file
			const fd = kernel.open('/test.txt', OpenMode.READ_WRITE);
			ctx.assertGreaterThan(fd, 2, 'FD should be > 2 (after stdin/stdout/stderr)');

			// Read from file
			const [readError, data] = kernel.read(fd);
			ctx.assertEquals(readError, ErrorCode.SUCCESS, 'Read should succeed');
			ctx.assertNotNull(data, 'Should have data');

			// Write to file
			const writeError = kernel.write(fd, { content: 'updated' });
			ctx.assertEquals(writeError, ErrorCode.SUCCESS, 'Write should succeed');

			// Close file
			const closeError = kernel.close(fd);
			ctx.assertEquals(closeError, ErrorCode.SUCCESS, 'Close should succeed');

			// Try to read after close
			const [errorAfterClose] = kernel.read(fd);
			ctx.assertEquals(errorAfterClose, ErrorCode.EBADF, 'Should fail with bad FD');

			await kernel.shutdown();
		});

		// Test 3: Directory operations
		await ctx.asyncTest('Directory creation and listing', async () => {
			const kernel = new Kernel({ debug: false });

			// Create nested directories
			const mkdirResult = await kernel.mkdir('/test/nested/deep', true);
			ctx.assertTrue(mkdirResult.success, 'Should create nested directories');

			// List directory
			const [error, entries] = kernel.readdir('/test');
			ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should list directory');
			ctx.assertGreaterThan(entries.length, 0, 'Should have entries');
			ctx.assertContains(
				entries.map((e) => e.name),
				'nested',
				'Should contain nested dir'
			);

			// Try to create without recursive flag
			const mkdirFail = await kernel.mkdir('/another/nested/dir', false);
			ctx.assertFalse(mkdirFail.success, 'Should fail without recursive flag');

			await kernel.shutdown();
		});

		// Test 4: Device mounting
		await ctx.asyncTest('Device mount/unmount operations', async () => {
			const kernel = new Kernel({ debug: false });
			const capability = new TestCapability();

			// Mount device
			const mountResult = kernel.mount('/dev/test', capability);
			ctx.assertTrue(mountResult.success, 'Should mount device');

			// Verify mount
			ctx.assertTrue(kernel.exists('/dev/test'), 'Mount point should exist');

			// Open device file
			const fd = kernel.open('/dev/test', OpenMode.READ);
			ctx.assertGreaterThan(fd, 0, 'Should open device file');

			// Read from device
			const buffer: any = {};
			const [readError] = kernel.read(fd);
			ctx.assertEquals(readError, ErrorCode.SUCCESS, 'Should read from device');

			kernel.close(fd);
			await kernel.shutdown();
		});

		// Test 5: File permissions
		ctx.test('File permission checks', () => {
			const kernel = new Kernel({ debug: false });

			// Create file
			kernel.create('/readonly.txt', { content: 'test' });

			// Open for read only
			const readFd = kernel.open('/readonly.txt', OpenMode.READ);
			ctx.assertGreaterThan(readFd, 0, 'Should open for read');

			// Try to write to read-only FD
			const writeError = kernel.write(readFd, { content: 'fail' });
			ctx.assertEquals(writeError, ErrorCode.EACCES, 'Should fail with permission error');

			kernel.close(readFd);

			// Open for write only
			const writeFd = kernel.open('/readonly.txt', OpenMode.WRITE);
			ctx.assertGreaterThan(writeFd, 0, 'Should open for write');

			// Try to read from write-only FD
			const [readError] = kernel.read(writeFd);
			ctx.assertEquals(readError, ErrorCode.EACCES, 'Should fail with permission error');

			kernel.close(writeFd);
			kernel.shutdown();
		});

		// Test 6: Standard Unix directories
		await ctx.asyncTest('Standard directory structure', async () => {
			const kernel = new Kernel({ debug: false });

			// Check standard directories exist
			const standardDirs = ['/dev', '/proc', '/entity', '/etc', '/var', '/tmp', '/bin'];

			for (const dir of standardDirs) {
				ctx.assertTrue(kernel.exists(dir), `${dir} should exist`);
				const stats = kernel.stat(dir);
				ctx.assertNotNull(stats, `${dir} should have stats`);
				ctx.assertTrue(stats!.isDirectory, `${dir} should be a directory`);
			}

			await kernel.shutdown();
		});

		// Test 7: Entity file operations
		await ctx.asyncTest('Entity file management', async () => {
			const kernel = new Kernel({ debug: false });

			// Save entity
			const entity = { id: 'test-123', type: 'character', name: 'Test Character' };
			const saved = kernel.saveEntity(entity);
			ctx.assertTrue(saved, 'Should save entity');

			// Verify entity file created
			ctx.assertTrue(kernel.exists('/entity/test-123'), 'Entity file should exist');

			// Load entity
			const loaded = kernel.getEntity('test-123');
			ctx.assertNotNull(loaded, 'Should load entity');
			ctx.assertEquals(loaded!.id, 'test-123', 'Entity ID should match');

			// List entities
			const entityIds = kernel.getEntityIds();
			ctx.assertContains(entityIds, 'test-123', 'Should list entity');

			// Remove entity
			const removed = kernel.removeEntity('test-123');
			ctx.assertTrue(removed, 'Should remove entity');
			ctx.assertFalse(kernel.exists('/entity/test-123'), 'Entity file should not exist');

			await kernel.shutdown();
		});

		// Test 8: Symbolic links (if implemented)
		ctx.test('Symbolic link operations', () => {
			const kernel = new Kernel({ debug: false });

			// Create target file
			kernel.create('/target.txt', { content: 'target data' });

			// Try to create symlink (may not be implemented)
			const linkResult = kernel.symlink('/target.txt', '/link.txt');

			if (linkResult && linkResult.success) {
				// If symlinks are supported, test them
				const fd = kernel.open('/link.txt', OpenMode.READ);
				if (fd > 0) {
					const [error, data] = kernel.read(fd);
					ctx.assertEquals(error, ErrorCode.SUCCESS, 'Should read through symlink');
					kernel.close(fd);
				}
			}

			kernel.shutdown();
		});

		// Test 9: File descriptor limits
		await ctx.asyncTest('File descriptor limit enforcement', async () => {
			const kernel = new Kernel({ debug: false });
			const fds: number[] = [];

			// Create many files
			for (let i = 0; i < 20; i++) {
				kernel.create(`/test-${i}.txt`, { content: `file ${i}` });
			}

			// Open many file descriptors
			for (let i = 0; i < 20; i++) {
				const fd = kernel.open(`/test-${i}.txt`, OpenMode.READ);
				if (fd > 0) {
					fds.push(fd);
				}
			}

			ctx.assertGreaterThan(fds.length, 10, 'Should open multiple files');

			// Close all
			for (const fd of fds) {
				kernel.close(fd);
			}

			await kernel.shutdown();
		});

		// Test 10: Path resolution
		ctx.test('Path normalization and resolution', () => {
			const fs = new FileSystem({ debug: false });

			// Test various path formats
			const testPaths = [
				{ input: '/path/to/file', expected: '/path/to/file' },
				{ input: '/path//to///file', expected: '/path/to/file' },
				{ input: '/path/./to/file', expected: '/path/to/file' },
				{ input: '/path/to/../file', expected: '/path/file' },
				{ input: '/../root', expected: '/root' },
				{ input: '/path/', expected: '/path' }
			];

			for (const { input, expected } of testPaths) {
				const normalized = fs.normalizePath(input);
				ctx.assertEquals(normalized, expected, `${input} should normalize to ${expected}`);
			}
		});

		// Store results
		results.push(ctx.getResults());
	}
});
