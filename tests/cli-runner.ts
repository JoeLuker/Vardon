#!/usr/bin/env node

/**
 * CLI Test Runner for Vardon
 *
 * This is the main entry point for running all domain tests from the command line.
 * It provides a comprehensive test suite that validates the Unix architecture,
 * character system, database operations, and more.
 *
 * Usage:
 *   npm run test:cli              # Run all tests
 *   npm run test:cli unix         # Run Unix architecture tests
 *   npm run test:cli character    # Run character tests
 *   npm run test:cli -- --verbose # Run with verbose output
 */

import { performance } from 'perf_hooks';

// Test suites
import './unix-architecture-tests';
import './character-system-tests';
import './database-tests';
import './filesystem-tests';
import './capability-tests';
import './plugin-tests';
import './performance-tests';
import './integration-tests';

// Test registry
interface TestSuite {
	name: string;
	description: string;
	run: () => Promise<void>;
	tags: string[];
}

const testSuites: TestSuite[] = [];

// Test result tracking
interface TestResult {
	suite: string;
	passed: number;
	failed: number;
	duration: number;
	errors: Error[];
}

const results: TestResult[] = [];

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
};

// Test registration
export function registerTestSuite(suite: TestSuite): void {
	testSuites.push(suite);
}

// Test assertion helpers
export class TestContext {
	private passed = 0;
	private failed = 0;
	private errors: Error[] = [];
	private currentTest = '';

	private suiteName: string;

	constructor(suiteName: string) {
		this.suiteName = suiteName;
	}

	test(name: string, fn: () => void | Promise<void>): void {
		this.currentTest = name;
		const start = performance.now();

		try {
			const result = fn();
			if (result instanceof Promise) {
				throw new Error('Use async test() for async functions');
			}
			this.passed++;
			if (process.env.VERBOSE) {
				console.log(
					`  ${colors.green}✓${colors.reset} ${name} ${colors.bright}(${(performance.now() - start).toFixed(1)}ms)${colors.reset}`
				);
			}
		} catch (error) {
			this.failed++;
			this.errors.push(error as Error);
			console.log(`  ${colors.red}✗${colors.reset} ${name}`);
			console.log(`    ${colors.red}${error}${colors.reset}`);
		}
	}

	async asyncTest(name: string, fn: () => Promise<void>): Promise<void> {
		this.currentTest = name;
		const start = performance.now();

		try {
			await fn();
			this.passed++;
			if (process.env.VERBOSE) {
				console.log(
					`  ${colors.green}✓${colors.reset} ${name} ${colors.bright}(${(performance.now() - start).toFixed(1)}ms)${colors.reset}`
				);
			}
		} catch (error) {
			this.failed++;
			this.errors.push(error as Error);
			console.log(`  ${colors.red}✗${colors.reset} ${name}`);
			console.log(`    ${colors.red}${error}${colors.reset}`);
		}
	}

	assertEquals(actual: any, expected: any, message?: string): void {
		if (actual !== expected) {
			throw new Error(
				message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
			);
		}
	}

	assertNotEquals(actual: any, expected: any, message?: string): void {
		if (actual === expected) {
			throw new Error(
				message || `Expected values to be different, both were ${JSON.stringify(actual)}`
			);
		}
	}

	assertTrue(value: boolean, message?: string): void {
		if (!value) {
			throw new Error(message || 'Expected true, got false');
		}
	}

	assertFalse(value: boolean, message?: string): void {
		if (value) {
			throw new Error(message || 'Expected false, got true');
		}
	}

	assertNull(value: any, message?: string): void {
		if (value !== null) {
			throw new Error(message || `Expected null, got ${JSON.stringify(value)}`);
		}
	}

	assertNotNull(value: any, message?: string): void {
		if (value === null) {
			throw new Error(message || 'Expected non-null value, got null');
		}
	}

	assertDefined(value: any, message?: string): void {
		if (value === undefined) {
			throw new Error(message || 'Expected defined value, got undefined');
		}
	}

	assertThrows(fn: () => void, expectedError?: string | RegExp): void {
		try {
			fn();
			throw new Error('Expected function to throw, but it did not');
		} catch (error: any) {
			if (error.message === 'Expected function to throw, but it did not') {
				throw error;
			}
			if (expectedError) {
				if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
					throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
				}
				if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
					throw new Error(`Expected error matching ${expectedError}, got "${error.message}"`);
				}
			}
		}
	}

	async assertAsyncThrows(fn: () => Promise<void>, expectedError?: string | RegExp): Promise<void> {
		try {
			await fn();
			throw new Error('Expected async function to throw, but it did not');
		} catch (error: any) {
			if (error.message === 'Expected async function to throw, but it did not') {
				throw error;
			}
			if (expectedError) {
				if (typeof expectedError === 'string' && !error.message.includes(expectedError)) {
					throw new Error(`Expected error containing "${expectedError}", got "${error.message}"`);
				}
				if (expectedError instanceof RegExp && !expectedError.test(error.message)) {
					throw new Error(`Expected error matching ${expectedError}, got "${error.message}"`);
				}
			}
		}
	}

	assertGreaterThan(actual: number, expected: number, message?: string): void {
		if (actual <= expected) {
			throw new Error(message || `Expected ${actual} > ${expected}`);
		}
	}

	assertLessThan(actual: number, expected: number, message?: string): void {
		if (actual >= expected) {
			throw new Error(message || `Expected ${actual} < ${expected}`);
		}
	}

	assertArrayEquals(actual: any[], expected: any[], message?: string): void {
		if (actual.length !== expected.length) {
			throw new Error(
				message || `Array length mismatch: expected ${expected.length}, got ${actual.length}`
			);
		}
		for (let i = 0; i < actual.length; i++) {
			if (actual[i] !== expected[i]) {
				throw new Error(
					message || `Array mismatch at index ${i}: expected ${expected[i]}, got ${actual[i]}`
				);
			}
		}
	}

	assertContains(haystack: string | any[], needle: any, message?: string): void {
		if (typeof haystack === 'string') {
			if (!haystack.includes(needle)) {
				throw new Error(message || `Expected "${haystack}" to contain "${needle}"`);
			}
		} else {
			if (!haystack.includes(needle)) {
				throw new Error(message || `Expected array to contain ${JSON.stringify(needle)}`);
			}
		}
	}

	getResults(): TestResult {
		return {
			suite: this.suiteName,
			passed: this.passed,
			failed: this.failed,
			duration: 0, // Set by runner
			errors: this.errors
		};
	}
}

// Main test runner
async function runTests(filter?: string): Promise<void> {
	console.log(`\n${colors.bright}${colors.blue}Vardon CLI Test Runner${colors.reset}\n`);

	const startTime = performance.now();
	let totalPassed = 0;
	let totalFailed = 0;

	// Filter suites if requested
	const suitesToRun = filter
		? testSuites.filter(
				(s) =>
					s.name.toLowerCase().includes(filter.toLowerCase()) ||
					s.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
			)
		: testSuites;

	if (suitesToRun.length === 0) {
		console.log(`${colors.yellow}No test suites match filter: ${filter}${colors.reset}`);
		process.exit(1);
	}

	// Run each test suite
	for (const suite of suitesToRun) {
		console.log(`${colors.bright}${colors.cyan}Running ${suite.name}${colors.reset}`);
		console.log(`${colors.bright}${suite.description}${colors.reset}\n`);

		const suiteStart = performance.now();

		try {
			await suite.run();
		} catch (error) {
			console.error(`${colors.red}Suite crashed: ${error}${colors.reset}`);
		}

		const duration = performance.now() - suiteStart;

		// Get results from the last test context (this is a simplified approach)
		const result = results[results.length - 1];
		if (result) {
			result.duration = duration;
			totalPassed += result.passed;
			totalFailed += result.failed;
		}

		console.log(''); // Empty line between suites
	}

	// Summary
	const totalDuration = performance.now() - startTime;
	console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
	console.log(`${colors.bright}Test Summary${colors.reset}`);
	console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}\n`);

	for (const result of results) {
		const status = result.failed === 0 ? colors.green : colors.red;
		console.log(
			`${status}${result.suite}: ${result.passed} passed, ${result.failed} failed${colors.reset} ` +
				`${colors.bright}(${result.duration.toFixed(1)}ms)${colors.reset}`
		);
	}

	console.log(
		`\n${colors.bright}Total: ${totalPassed} passed, ${totalFailed} failed${colors.reset}`
	);
	console.log(`${colors.bright}Time: ${(totalDuration / 1000).toFixed(2)}s${colors.reset}\n`);

	// Exit with appropriate code
	process.exit(totalFailed > 0 ? 1 : 0);
}

// Export for use by test files
export { TestContext, colors, results };

// Run tests if this is the main module
if (require.main === module) {
	const args = process.argv.slice(2);
	const verbose = args.includes('--verbose') || args.includes('-v');
	const filter = args.find((arg) => !arg.startsWith('-'));

	if (verbose) {
		process.env.VERBOSE = 'true';
	}

	runTests(filter).catch((error) => {
		console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
		process.exit(1);
	});
}
