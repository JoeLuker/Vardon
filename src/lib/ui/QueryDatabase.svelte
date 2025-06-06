<!-- 
	QueryDatabase Component - Uses Unix file system abstraction
	No direct database access - everything goes through the kernel
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
	import { OpenMode, ErrorCode } from '$lib/domain/kernel/types';

	// Accept kernel from parent
	let { kernel = null } = $props<{
		kernel?: GameKernel | null;
	}>();

	let queryResults = $state('');
	let isLoading = $state(true);
	let hasError = $state(false);
	let errorMessage = $state('');

	// Query data using Unix file operations
	async function queryData() {
		if (!kernel) {
			errorMessage = 'Kernel not available';
			hasError = true;
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			hasError = false;
			queryResults = 'Querying through Unix file system...\n';

			// Test kernel availability
			queryResults += '\n===== Checking Kernel =====\n';
			queryResults += `Kernel version: ${kernel.version || 'unknown'}\n`;
			queryResults += `Debug mode: ${kernel.debug ? 'enabled' : 'disabled'}\n`;

			// Query characters through file system
			queryResults += '\n===== Characters =====\n';
			const dbDevicePath = '/v_dev/db';
			const dbFd = kernel.open(dbDevicePath, OpenMode.READ_WRITE);
			
			if (dbFd >= 0) {
				try {
					// Use ioctl to query characters
					const buffer: any = {};
					const ioctlResult = kernel.ioctl(dbFd, 2, { // DatabaseOperation.QUERY
						resource: 'game_character',
						buffer
					});
					
					if (ioctlResult === 0 && buffer.data) {
						const characters = buffer.data;
						queryResults += `Found ${characters.length} characters:\n`;
						characters.forEach((char: any) => {
							queryResults += `- ID: ${char.id}, Name: ${char.name}, Path: /v_proc/character/${char.id}\n`;
						});
					} else {
						queryResults += `Database query failed: ${ioctlResult}\n`;
					}

					// Query abilities
					queryResults += '\n===== Abilities =====\n';
					const abilityBuffer: any = {};
					const abilityResult = kernel.ioctl(dbFd, 2, {
						resource: 'ability',
						buffer: abilityBuffer
					});

					if (abilityResult === 0 && abilityBuffer.data) {
						const abilities = abilityBuffer.data;
						queryResults += `Found ${abilities.length} abilities:\n`;
						abilities.slice(0, 10).forEach((ability: any) => {
							queryResults += `- ID: ${ability.id}, Name: ${ability.name}, Label: ${ability.label}\n`;
						});
						if (abilities.length > 10) {
							queryResults += `... and ${abilities.length - 10} more\n`;
						}
					} else {
						queryResults += `Ability query failed: ${abilityResult}\n`;
					}

					// Query skills
					queryResults += '\n===== Skills =====\n';
					const skillBuffer: any = {};
					const skillResult = kernel.ioctl(dbFd, 2, {
						resource: 'skill',
						buffer: skillBuffer
					});

					if (skillResult === 0 && skillBuffer.data) {
						const skills = skillBuffer.data;
						queryResults += `Found ${skills.length} skills (showing first 10):\n`;
						skills.slice(0, 10).forEach((skill: any) => {
							queryResults += `- ID: ${skill.id}, Name: ${skill.name}\n`;
						});
					} else {
						queryResults += `Skill query failed: ${skillResult}\n`;
					}

				} finally {
					kernel.close(dbFd);
				}
			} else {
				queryResults += `Failed to open database device: ${ErrorCode[-dbFd]}\n`;
			}

			// List mounted devices
			queryResults += '\n===== Mounted Devices =====\n';
			const devPath = '/v_dev';
			if (kernel.exists(devPath)) {
				const entries = kernel.readdir(devPath);
				if (entries.success && entries.entries) {
					entries.entries.forEach((entry: any) => {
						queryResults += `- ${entry.name} (${entry.type})\n`;
					});
				}
			}

			// Show file system structure
			queryResults += '\n===== File System Structure =====\n';
			const rootEntries = kernel.readdir('/');
			if (rootEntries.success && rootEntries.entries) {
				rootEntries.entries.forEach((entry: any) => {
					queryResults += `/${entry.name}/ (${entry.type})\n`;
				});
			}

			// Schema information
			queryResults += '\n===== Available Schemas =====\n';
			const schemaPath = '/v_etc/schema';
			if (kernel.exists(schemaPath)) {
				const schemaEntries = kernel.readdir(schemaPath);
				if (schemaEntries.success && schemaEntries.entries) {
					schemaEntries.entries.forEach((entry: any) => {
						queryResults += `- ${entry.name}\n`;
					});
				}
			}

			queryResults += '\nQuery complete!';
		} catch (err) {
			hasError = true;
			errorMessage = err instanceof Error ? err.message : String(err);
			queryResults += `\nUnexpected error: ${errorMessage}`;
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if (kernel) {
			queryData();
		}
	});

	// React to kernel changes
	$effect(() => {
		if (kernel && !isLoading) {
			queryData();
		}
	});
</script>

<div class="query-database">
	<h2 class="mb-4 text-2xl font-bold">Unix File System Query</h2>

	{#if isLoading}
		<div class="loading">
			<p>Loading file system data...</p>
			<div class="loading-spinner"></div>
		</div>
	{/if}

	{#if hasError}
		<div class="error mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			<p><strong>Error:</strong> {errorMessage}</p>
		</div>
	{/if}

	<pre
		class="max-h-[70vh] overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-green-400">{queryResults}</pre>
	
	<div class="mt-4">
		<button 
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
			onclick={() => queryData()}
			disabled={isLoading || !kernel}
		>
			Refresh Query
		</button>
	</div>
</div>

<style>
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-left-color: #09f;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 10px auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>