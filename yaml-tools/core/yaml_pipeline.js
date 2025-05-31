#!/usr/bin/env node
/**
 * YAML Management Pipeline with Preserved Anchors/Aliases
 *
 * This script guides you through the process of:
 * 1. Splitting a YAML file into manageable pieces
 * 2. Editing the pieces as needed
 * 3. Combining the pieces back into the original file
 * 4. Loading the data into the database
 *
 * All while preserving anchor/alias relationships.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Create readline interface
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// Promisify readline.question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runCommand(cmd, description) {
	console.log(`\n> ${description}...`);
	console.log(`Running: ${cmd}`);

	try {
		const { stdout, stderr } = await execAsync(cmd);
		if (stdout) console.log(stdout);
		if (stderr) console.error(stderr);
		return true;
	} catch (error) {
		console.error(`Error: ${error.message}`);
		return false;
	}
}

async function checkDirectoryContents(dir) {
	try {
		const files = await fs.readdir(dir);
		return files.filter((file) => !file.startsWith('.'));
	} catch (error) {
		console.error(`Error checking directory ${dir}: ${error.message}`);
		return [];
	}
}

async function runPipeline() {
	console.log('=== YAML Management Pipeline with Preserved Anchors/Aliases ===');

	// Check if this is a dry run
	const isDryRun = process.argv.includes('--dry-run');

	// Step 1: Split the YAML file
	console.log('\n=== Step 1: Split YAML File ===');
	const splitCmd = 'npm run yaml:split';
	const splitSuccess = await runCommand(splitCmd, 'Splitting YAML file into manageable pieces');

	if (!splitSuccess) {
		console.error('Failed to split the YAML file. Pipeline aborted.');
		rl.close();
		return;
	}

	// Step 2: Edit the files
	console.log('\n=== Step 2: Edit YAML Files ===');
	const splitDir = 'data/split';

	const splitFiles = await checkDirectoryContents(splitDir);

	console.log(`\nSplit files available in ${splitDir}:`);
	splitFiles.forEach((file) => console.log(`- ${file}`));

	if (isDryRun) {
		console.log('\nDry run completed. Exiting without editing or combining files.');
		rl.close();
		return;
	}

	const editResponse = await question('\nDo you want to edit any files now? (y/n): ');

	if (editResponse.toLowerCase() === 'y') {
		console.log('\nEditing instructions:');
		console.log('1. Edit the files in your preferred editor');
		console.log('2. Save your changes');
		console.log('3. Return here when finished');

		await question('\nPress Enter when you have finished editing the files...');
	}

	// Step 3: Combine all files back into the original YAML file
	console.log('\n=== Step 3: Combine Files ===');
	const combineCmd = 'npm run yaml:combine';
	const combineSuccess = await runCommand(
		combineCmd,
		'Combining all files back into a single YAML file'
	);

	if (!combineSuccess) {
		console.error('Failed to combine the files. Pipeline aborted.');
		rl.close();
		return;
	}

	// Step 4: Load the data into the database
	console.log('\n=== Step 4: Load Data to Database ===');
	const loadResponse = await question(
		'Do you want to load the data into the database now? (y/n): '
	);

	if (loadResponse.toLowerCase() === 'y') {
		const loadCmd = 'npm run yaml:load';
		await runCommand(loadCmd, 'Loading data into the database');
	}

	console.log('\n=== Pipeline Complete ===');
	console.log('All operations have completed successfully.');
	rl.close();
}

runPipeline().catch((error) => {
	console.error(`Pipeline error: ${error.message}`);
	rl.close();
});
