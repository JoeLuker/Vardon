<!-- 
	QueryDatabase Component - Refactored to use Domain Layer
	
	This component now uses the kernel's Unix file system abstraction
	instead of direct database access
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
			const characterListPath = '/v_proc/character/list';
			
			if (kernel.exists(characterListPath)) {
				const fd = kernel.open(characterListPath, OpenMode.READ);
				if (fd < 0) {
					queryResults += `Error opening character list: ${ErrorCode[fd]}\n`;
				} else {
					try {
						const [result, data] = kernel.read(fd);
						if (result === ErrorCode.SUCCESS) {
							const characters = Array.isArray(data) ? data : [];
							queryResults += `Found ${characters.length} characters:\n`;
							characters.forEach((char: any) => {
								queryResults += `- ID: ${char.id}, Name: ${char.name}, Path: /v_proc/character/${char.id}\n`;
							});
						} else {
							queryResults += `Error reading character list: ${ErrorCode[result]}\n`;
						}
					} finally {
						kernel.close(fd);
					}
				}
			} else {
				queryResults += 'Character list not found. Loading from database device...\n';
				
				// Try to read from database device
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
							queryResults += `Found ${characters.length} characters from database:\n`;
							characters.forEach((char: any) => {
								queryResults += `- ID: ${char.id}, Name: ${char.name}\n`;
							});
						} else {
							queryResults += `Database query failed: ${ioctlResult}\n`;
						}
					} finally {
						kernel.close(dbFd);
					}
				} else {
					queryResults += `Failed to open database device: ${ErrorCode[-dbFd]}\n`;
				}
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

		} catch (err) {
			hasError = true;
			errorMessage = err instanceof Error ? err.message : String(err);
			queryResults += `\nError: ${errorMessage}\n`;
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

<div class="query-results-container">
	<h2 class="text-2xl font-bold mb-4">Unix File System Query</h2>
	
	{#if isLoading}
		<div class="animate-pulse">
			<div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
			<div class="h-4 bg-gray-200 rounded w-1/2"></div>
		</div>
	{:else}
		<pre class="bg-gray-100 p-4 rounded overflow-auto max-h-[600px] text-sm font-mono {hasError ? 'border-2 border-red-500' : ''}">
{queryResults}
		</pre>
		
		{#if hasError}
			<div class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
				<p class="font-bold">Error Details:</p>
				<p>{errorMessage}</p>
			</div>
		{/if}
	{/if}
	
	<div class="mt-4">
		<button 
			class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
			onclick={() => queryData()}
			disabled={isLoading || !kernel}
		>
			Refresh Query
		</button>
	</div>
</div>

<style>
	.query-results-container {
		@apply p-6;
	}
</style>