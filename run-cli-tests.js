#!/usr/bin/env node

/**
 * Simple CLI Test Runner for Node.js
 *
 * This script compiles and runs the TypeScript CLI tests.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const filter = args.find((arg) => !arg.startsWith('-'));
const verbose = args.includes('--verbose') || args.includes('-v');

// Set environment variables
if (verbose) {
	process.env.VERBOSE = 'true';
}

// Compile and run the TypeScript tests
const testFile = path.join(__dirname, 'tests', 'cli-runner.ts');

console.log('🚀 Starting Vardon CLI Tests...\n');

// Use ts-node to run TypeScript directly
const command = `npx ts-node ${testFile} ${filter || ''} ${verbose ? '--verbose' : ''}`;

const child = exec(command, {
	cwd: __dirname,
	env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') }
});

child.stdout.on('data', (data) => {
	process.stdout.write(data);
});

child.stderr.on('data', (data) => {
	process.stderr.write(data);
});

child.on('close', (code) => {
	if (code === 0) {
		console.log('\n✅ All tests completed successfully!');
	} else {
		console.log(`\n❌ Tests failed with exit code ${code}`);
	}
	process.exit(code);
});

child.on('error', (error) => {
	console.error('❌ Failed to run tests:', error.message);

	// Fallback: try with basic node compilation
	console.log('\n⚠️  Falling back to basic TypeScript compilation...');

	const fallbackCommand = `npx tsc ${testFile} --outDir ./dist && node ./dist/tests/cli-runner.js ${filter || ''} ${verbose ? '--verbose' : ''}`;

	exec(fallbackCommand, { cwd: __dirname }, (err, stdout, stderr) => {
		if (err) {
			console.error('❌ Fallback also failed:', err.message);
			process.exit(1);
		}

		console.log(stdout);
		if (stderr) console.error(stderr);
	});
});
