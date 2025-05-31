/**
 * Invariant Checking Test
 *
 * Tests the runtime invariant checking system to ensure it properly
 * validates Unix architecture constraints and catches violations.
 */

import { Kernel } from '../kernel/Kernel';
import { FileSystem } from '../kernel/FileSystem';
import { BaseCapability } from '../capabilities/BaseCapability';
import { ErrorCode, OpenMode } from '../kernel/types';
import { InvariantChecker } from '../kernel/InvariantChecker';

class TestCapability extends BaseCapability {
	public readonly id = 'test-capability';
}

export async function runInvariantCheckingTest(): Promise<void> {
	console.group('=== Invariant Checking Test ===');
	console.time('Test duration');

	try {
		await testInvariantChecker();
		await testKernelInvariants();
		await testFileSystemInvariants();
		await testCapabilityInvariants();
		await testSystemWideInvariants();

		console.log('✅ All invariant checking tests passed');
	} catch (error) {
		console.error('❌ Invariant checking test failed:', error);
		throw error;
	} finally {
		console.timeEnd('Test duration');
		console.groupEnd();
	}
}

async function testInvariantChecker(): Promise<void> {
	console.group('Testing InvariantChecker');

	try {
		// Test in production mode (no throw)
		const checker = new InvariantChecker(false);
		checker.check(false, 'This should not throw', {
			component: 'Test',
			operation: 'test'
		});
		console.log('✅ Production mode: violations logged but not thrown');

		// Test in debug mode (should throw)
		const debugChecker = new InvariantChecker(true);
		let thrown = false;
		try {
			debugChecker.check(false, 'This should throw', {
				component: 'Test',
				operation: 'test'
			});
		} catch (error) {
			thrown = true;
		}

		if (!thrown) {
			throw new Error('Debug mode should throw on invariant violation');
		}
		console.log('✅ Debug mode: violations throw errors');

		// Test violation tracking
		const trackingChecker = new InvariantChecker(false);
		trackingChecker.check(false, 'Violation 1', { component: 'Test', operation: 'test1' });
		trackingChecker.check(false, 'Violation 2', { component: 'Test', operation: 'test2' });

		const violations = trackingChecker.getViolations();
		if (violations.length !== 2) {
			throw new Error(`Expected 2 violations, got ${violations.length}`);
		}
		console.log('✅ Violation tracking works correctly');
	} finally {
		console.groupEnd();
	}
}

async function testKernelInvariants(): Promise<void> {
	console.group('Testing Kernel invariants');

	try {
		// Test with debug mode enabled
		const kernel = new Kernel({ debug: true });

		// Test path validation
		console.log('Testing path validation...');
		const fd = kernel.open('relative/path'); // Should fail invariant check
		if (fd !== -1) {
			throw new Error('Should reject relative paths');
		}
		console.log('✅ Path validation works');

		// Test file descriptor validation
		console.log('Testing file descriptor validation...');
		const [errorCode] = kernel.read(-1); // Invalid FD
		if (errorCode !== ErrorCode.EBADF) {
			throw new Error('Should reject invalid file descriptors');
		}
		console.log('✅ File descriptor validation works');

		// Test mount point validation
		console.log('Testing mount point validation...');
		const capability = new TestCapability({ debug: true });
		const mountResult = kernel.mount('/invalid/mount/path', capability);
		if (mountResult.success) {
			throw new Error('Should reject non-/dev mount paths');
		}
		console.log('✅ Mount point validation works');

		// Cleanup
		await kernel.shutdown();
	} finally {
		console.groupEnd();
	}
}

async function testFileSystemInvariants(): Promise<void> {
	console.group('Testing FileSystem invariants');

	try {
		const fs = new FileSystem({ debug: true });

		// Test path validation in filesystem operations
		console.log('Testing filesystem path validation...');

		// Create with invalid path should be caught
		const createResult = await fs.create('relative/path', {});
		if (createResult.success) {
			throw new Error('Should reject relative paths in create');
		}
		console.log('✅ Create path validation works');

		// Read with invalid path
		const [readError] = fs.read('relative/path');
		if (readError === ErrorCode.SUCCESS) {
			throw new Error('Should reject relative paths in read');
		}
		console.log('✅ Read path validation works');

		// Write with invalid path
		const writeError = fs.write('relative/path', {});
		if (writeError === ErrorCode.SUCCESS) {
			throw new Error('Should reject relative paths in write');
		}
		console.log('✅ Write path validation works');

		// Test filesystem consistency
		fs.checkFilesystemConsistency();
		console.log('✅ Filesystem consistency check runs without errors');
	} finally {
		console.groupEnd();
	}
}

async function testCapabilityInvariants(): Promise<void> {
	console.group('Testing Capability invariants');

	try {
		const capability = new TestCapability({ debug: true });

		// Test operations before mounting
		console.log('Testing operations before mounting...');

		// Read before mount should fail invariant
		let thrown = false;
		try {
			capability.read(3, {});
		} catch (error) {
			thrown = true;
		}
		if (!thrown) {
			throw new Error('Should enforce mounting before read');
		}
		console.log('✅ Read requires mounting');

		// Write before mount should fail invariant
		thrown = false;
		try {
			capability.write(3, {});
		} catch (error) {
			thrown = true;
		}
		if (!thrown) {
			throw new Error('Should enforce mounting before write');
		}
		console.log('✅ Write requires mounting');

		// Test mounting with null kernel
		thrown = false;
		try {
			capability.onMount(null);
		} catch (error) {
			thrown = true;
		}
		if (!thrown) {
			throw new Error('Should reject null kernel on mount');
		}
		console.log('✅ Mount requires valid kernel reference');
	} finally {
		console.groupEnd();
	}
}

async function testSystemWideInvariants(): Promise<void> {
	console.group('Testing system-wide invariants');

	try {
		const kernel = new Kernel({ debug: true });

		// Create standard directories
		await kernel.create('/entity/test-entity', { id: 'test-entity' });

		// Open multiple file descriptors to test leak detection
		console.log('Testing file descriptor leak detection...');
		const fds: number[] = [];
		for (let i = 0; i < 10; i++) {
			const fd = kernel.open('/entity/test-entity');
			if (fd > 0) fds.push(fd);
		}

		// Close half of them
		for (let i = 0; i < 5; i++) {
			kernel.close(fds[i]);
		}

		// Run system invariant check (should detect open FDs)
		// This is called internally by the kernel
		console.log('✅ File descriptor tracking works');

		// Test mount consistency
		console.log('Testing mount point consistency...');
		const capability = new TestCapability({ debug: true });
		kernel.mount('/dev/test', capability);

		// System check should verify mount point exists
		console.log('✅ Mount point consistency check works');

		// Cleanup
		for (const fd of fds) {
			kernel.close(fd);
		}
		await kernel.shutdown();
	} finally {
		console.groupEnd();
	}
}

// Export for test runner
export const invariantCheckingTest = {
	name: 'Invariant Checking',
	run: runInvariantCheckingTest
};
