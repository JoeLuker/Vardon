<!-- FILE: src/lib/ui/CharacterLoader.svelte -->
<script lang="ts">
	// Character Loader component
	// This component loads a character using file operations

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { PageData } from '../../routes/characters/[id]/$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { CompleteCharacter } from '$lib/domain/exports';
	import type { GameKernel } from "$lib/domain/kernel/GameKernel";
	import { ErrorCode } from '$lib/domain/kernel/ErrorHandler';
	import { OpenMode } from '$lib/domain/kernel/types';
	
	// Constants for file paths
	const PATHS = {
		PROC_CHARACTER: '/proc/character',
		DEV_CHARACTER: '/dev/character',
		SYS_CLASSES: '/sys/class'
	};
	
	// Accept parent-managed components
	let { data = null, kernel = null } = $props<{
		data?: PageData | null,
		kernel?: GameKernel | null
	}>();
	
	// Track file descriptors for cleanup
	let openFileDescriptors = $state<number[]>([]);
	
	// Local state 
	let character = $state<AssembledCharacter | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let diagnosticInfo = $state<Record<string, any>>({});
	
	// Store event subscription IDs for cleanup
	let subscriptions: string[] = [];
	
	// Create event dispatcher
	const dispatch = createEventDispatcher<{
		loading: boolean;
		loaded: AssembledCharacter;
		error: string;
	}>();
	
	// Helper function to get timestamps for logs
	function getTimestamp() {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
	}
	
	// Helper function to track file descriptors
	function registerFd(fd: number) {
		if (fd > 0) {
			openFileDescriptors = [...openFileDescriptors, fd];
		}
		return fd;
	}
	
	// Helper to close a file descriptor and remove from tracking
	function closeFd(fd: number) {
		if (fd > 0 && kernel) {
			try {
				kernel.close(fd);
			} catch (e) {
				console.error(`Error closing fd ${fd}:`, e);
			}
			openFileDescriptors = openFileDescriptors.filter(openFd => openFd !== fd);
		}
	}
	
	// Load character using unix-style file operations
	async function loadCharacterUnix(
		characterId: string | number,
		forceRefresh: boolean = false,
		preloadedData: any = null
	): Promise<AssembledCharacter> {
		if (!kernel) {
			throw new Error('Kernel not available, cannot load character');
		}
		
		// Create character entity path
		// Characters are FILES, not directories
		const characterPath = `${PATHS.PROC_CHARACTER}/${characterId}`;
		
		// Check if path exists as a directory (would be an error)
		const stats = kernel.stat(characterPath);
		if (stats?.isDirectory) {
			console.error(`Found a directory at ${characterPath} when it should be a file. This will cause errors.`);
		}
		
		// Check if the character device is mounted and available
		if (!kernel.devices?.has(PATHS.DEV_CHARACTER)) {
			throw new Error(`Character device not mounted at ${PATHS.DEV_CHARACTER}: ${ErrorCode.EDEVNOTREADY}`);
		}

		// Open character device to use its API
		const deviceFd = registerFd(kernel.open(PATHS.DEV_CHARACTER, OpenMode.READ));

		if (deviceFd < 0) {
			throw new Error(`Failed to open character device: ${ErrorCode[-deviceFd]}`);
		}
		
		try {
			// Use device to get character data through the ioctl interface
			// This is similar to how Unix device drivers work
			const buffer: any = { 
				operation: 'getCharacter', 
				entityPath: characterPath, 
				characterId 
			};
			const result = kernel.ioctl(deviceFd, 1001, buffer); // 1001 = GET_CHARACTER
			
			if (result !== 0) {
				throw new Error(`Failed to get character data: ${ErrorCode[result]}`);
			}
			
			// Validate character data
			const loadedCharacter = buffer.character as AssembledCharacter;
			if (!loadedCharacter?.id) {
				throw new Error(`Invalid character data received from device`);
			}
			
			// Add preloaded data if available
			if (preloadedData && typeof preloadedData === 'object') {
				console.log(`Merging preloaded data with device data`);
				Object.assign(loadedCharacter, preloadedData);
			}
			
			// Store character data in proc file if it doesn't exist
			// If path is a directory, try to fix it
			if (stats?.isDirectory) {
				// Try to remove the directory
				console.log(`Attempting to remove directory at ${characterPath}`);
				kernel.unlink(characterPath);
			}
			
			// Make sure parent directories exist before creating character file
			if (!kernel.exists('/proc')) {
				console.log('Creating /proc directory');
				kernel.mkdir('/proc');
			}
			
			if (!kernel.exists('/proc/character')) {
				console.log('Creating /proc/character directory');
				kernel.mkdir('/proc/character');
			}
			
			// Create/update file if it doesn't exist or was a directory
			if (!kernel.exists(characterPath) || stats?.isDirectory) {
				// Create the file with data from the device
				console.log(`Creating character file at ${characterPath}`);
				const createResult = kernel.create(characterPath, loadedCharacter);
				if (!createResult.success) {
					console.warn(`Failed to create character file: ${createResult.errorMessage || 'Unknown error'}`);
				}
			}
			
			// Record diagnostic info
			diagnosticInfo = {
				characterId: loadedCharacter.id,
				loadTime: new Date().toISOString(),
				source: 'device',
				ancestryId: loadedCharacter.game_character_ancestry?.[0]?.ancestry_id,
				ancestry: loadedCharacter.game_character_ancestry?.[0]?.ancestry?.name,
				classes: loadedCharacter.game_character_class?.map(c => c.class?.name),
				level: loadedCharacter.totalLevel,
				wasDirectory: stats?.isDirectory || false
			};
			
			return loadedCharacter;
		} finally {
			closeFd(deviceFd);
		}
	}
	
	// Track whether we've already attempted loading
	let loadAttempted = $state(false);
	let isWaitingForDevice = $state(false);
	
	// Initialize on component mount and watch for kernel to be ready
	$effect(async () => {
		// Prevent infinite loops by only attempting to load once per state change
		const kernelReady = !!kernel;
		const hasId = !!data?.id;

		console.log(`${getTimestamp()} - Unix Character Loader effect running with kernel: ${kernelReady} and ID: ${hasId}, load attempted: ${loadAttempted}, isWaitingForDevice: ${isWaitingForDevice}`);

		// Skip if no kernel or data
		if (!kernelReady || !hasId) {
			return;
		}
		
		// If we're waiting for the device mount event, don't attempt to load yet
		if (isWaitingForDevice) {
			return;
		}
		
		// Skip if we've already attempted and succeeded
		if (loadAttempted) {
			return;
		}

		// Check if the character device is already mounted
		if (!kernel.devices?.has(PATHS.DEV_CHARACTER)) {
			console.log(`${getTimestamp()} - Character device not yet mounted, setting up mount event listener...`);
			
			// Set flag to indicate we're waiting for the device
			isWaitingForDevice = true;
			
			// Set up event listeners for both standard mount events and custom device ready events
			// This is the Unix approach - use notification rather than polling
			const mountSubscription = kernel.events?.on('fs:mount', (event) => {
				console.log(`${getTimestamp()} - Mount event received:`, event);

				// Check if this is the character device being mounted
				if (event.path === PATHS.DEV_CHARACTER) {
					console.log(`${getTimestamp()} - Character device mounted, proceeding with character load`);

					// Clear the waiting flag to allow loading
					isWaitingForDevice = false;
				}
			});

			// Also listen for the custom character:device_ready event
			const deviceReadySubscription = kernel.events?.on('character:device_ready', (event) => {
				console.log(`${getTimestamp()} - Character device ready event received:`, event);

				// Clear the waiting flag to allow loading
				isWaitingForDevice = false;
			});

			if (mountSubscription) {
				subscriptions.push(mountSubscription);
			}

			if (deviceReadySubscription) {
				subscriptions.push(deviceReadySubscription);
			}
			
			return; // Wait for the mount event
		}

		// Mark that we've attempted a load with this data/kernel state
		loadAttempted = true;
		
		console.log(`${getTimestamp()} - Loading character with ID: ${data.id}`);
		dispatch('loading', true);
		
		try {
			// Load character with Unix file operations
			character = await loadCharacterUnix(
				data.id,
				false, // Not forcing refresh
				data.initialCharacter // Pass preloaded data from server
			);
			
			// Log character basics after successful loading
			if (character) {
				console.log(`${getTimestamp()} - Character loaded successfully:`, {
					id: character.id,
					name: character.name,
					classes: character.game_character_class?.map(c => c.class?.name) || [],
					ancestry: character.game_character_ancestry?.[0]?.ancestry?.name,
					level: character.totalLevel
				});
				
				// Dispatch loaded event
				dispatch('loaded', character);
			} else {
				throw new Error('Character loaded but data is null or invalid');
			}
			
			isLoading = false;
		} catch (loadError) {
			console.error(`${getTimestamp()} - Failed to load character:`, loadError);
			
			// Create more informative error message based on error type
			let errorMessage = loadError instanceof Error ? loadError.message : 'Failed to load character data';
			
			// Add specific information for known error types
			if (loadError instanceof Error) {
				// Check for database errors
				if (loadError.message.includes('Database error') || 
				    loadError.message.includes('Character not found')) {
					errorMessage = `Database error: ${loadError.message}. Please check if this character ID exists in the database.`;
					diagnosticInfo.errorType = 'database';
				} 
				// Check for device errors
				else if (loadError.message.includes('Character device not mounted') ||
				         loadError.message.includes('EDEVNOTREADY')) {
					errorMessage = `Device not ready: ${loadError.message}. The system is still initializing.`;
					diagnosticInfo.errorType = 'device';
				}
				// Check for other specific error codes
				else if (loadError.message.includes('ENOSYS')) {
					errorMessage = 'System error: Database capability not available';
					diagnosticInfo.errorType = 'capability';
				}
				else if (loadError.message.includes('EIO')) {
					errorMessage = 'I/O error: Failed to read from database';
					diagnosticInfo.errorType = 'io';
				}
			}
			
			error = errorMessage;
			isLoading = false;
			dispatch('error', error);
			
			// Update diagnostic info with error details
			diagnosticInfo = {
				...diagnosticInfo,
				characterId: data.id,
				errorTime: new Date().toISOString(),
				errorMessage: errorMessage,
				originalError: loadError instanceof Error ? loadError.message : String(loadError)
			};
			
			// If error is device not ready, we can set up a listener for mount events
			if (loadError instanceof Error && 
			    (loadError.message.includes('Character device not mounted') ||
			     loadError.message.includes('EDEVNOTREADY'))) {
				
				console.log(`${getTimestamp()} - Detected device not ready error, waiting for device mount event`);
				
				// Reset loading state to retry after device is mounted
				loadAttempted = false;
				isWaitingForDevice = true;
				
				// Set up event listeners for both standard mount events and custom device ready events
				// Only if not already listening
				if (!subscriptions.some(s => s.includes('fs:mount'))) {
					const mountSubscription = kernel.events?.on('fs:mount', (event) => {
						console.log(`${getTimestamp()} - Mount event received:`, event);

						// Check if this is the character device being mounted
						if (event.path === PATHS.DEV_CHARACTER) {
							console.log(`${getTimestamp()} - Character device mounted, releasing wait lock`);

							// Clear the waiting flag to allow loading
							isWaitingForDevice = false;
						}
					});

					if (mountSubscription) {
						subscriptions.push(mountSubscription);
					}
				}

				// Also listen for the custom character:device_ready event if not already listening
				if (!subscriptions.some(s => s.includes('character:device_ready'))) {
					const deviceReadySubscription = kernel.events?.on('character:device_ready', (event) => {
						console.log(`${getTimestamp()} - Character device ready event received in error handler:`, event);

						// Clear the waiting flag to allow loading
						isWaitingForDevice = false;
					});

					if (deviceReadySubscription) {
						subscriptions.push(deviceReadySubscription);
					}
				}
			}
		}
	});
	
	// Additional onMount for initial setup
	onMount(() => {
		console.log(`${getTimestamp()} - Unix Character Loader mounted with ID: ${data?.id}`);
		
		if (!data?.id) {
			console.warn(`${getTimestamp()} - No character ID received`);
			error = 'No character ID received';
			isLoading = false;
			dispatch('error', error);
		}
	});
	
	// Clean up resources on component destruction
	onDestroy(() => {
		// Remove event listeners
		if (kernel && kernel.events) {
			subscriptions.forEach(id => {
				kernel.events.off(id);
			});
		}
		
		// Close all open file descriptors
		if (kernel) {
			openFileDescriptors.forEach(fd => {
				try {
					kernel.close(fd);
				} catch (e) {
					console.error(`Error closing fd ${fd} during cleanup:`, e);
				}
			});
		}
	});
</script>

{#if isLoading}
	<div class="flex items-center justify-center">
		<div class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
		<p class="ml-2">Loading character{isWaitingForDevice ? ' (waiting for device)' : ''}...</p>
	</div>
{:else if error}
	<div class="bg-red-100 text-red-800 p-4 rounded-md">
		<p class="font-semibold">Error loading character</p>
		<p>{error}</p>
		
		{#if Object.keys(diagnosticInfo).length > 0}
		<details class="mt-4">
			<summary class="cursor-pointer font-medium">Diagnostic Information</summary>
			<pre class="mt-2 bg-red-50 p-2 rounded text-xs overflow-auto">
{JSON.stringify(diagnosticInfo, null, 2)}</pre>
		</details>
		{/if}
		
		<div class="mt-4">
			<button class="text-primary hover:underline" onclick={() => window.location.reload()}>
				Retry Loading
			</button>
		</div>
	</div>
{:else if character}
	<slot />
{:else}
	<div class="bg-yellow-100 text-yellow-800 p-4 rounded-md">
		<p>No character data available.</p>
	</div>
{/if}