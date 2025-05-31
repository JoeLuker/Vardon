<!-- FILE: src/lib/ui/CharacterLoader.svelte -->
<script lang="ts">
	// Character Loader component
	// This component loads a character using file operations

	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { PageData } from '../../routes/characters/[id]/$types';
	import type { AssembledCharacter } from '$lib/domain/character/characterTypes';
	import type { CompleteCharacter } from '$lib/domain/exports';
	import type { GameKernel } from '$lib/domain/kernel/GameKernel';
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
		data?: PageData | null;
		kernel?: GameKernel | null;
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

	// Add safety timer to prevent getting stuck in "waiting for device" state
	let deviceCheckTimer: any = null;

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
			openFileDescriptors = openFileDescriptors.filter((openFd) => openFd !== fd);
		}
	}

	// Load character using unix-style file operations
	async function loadCharacterUnix(
		characterId: string | number,
		forceRefresh: boolean = false,
		preloadedData: any = null
	): Promise<AssembledCharacter> {
		console.log(`[DEBUG] loadCharacterUnix starting for character ${characterId}`);
		if (!kernel) {
			throw new Error('Kernel not available, cannot load character');
		}

		// Create character entity path
		// Characters are FILES, not directories
		const characterPath = `${PATHS.PROC_CHARACTER}/${characterId}`;

		// Check if path exists as a directory (would be an error)
		const stats = kernel.stat(characterPath);
		if (stats?.isDirectory) {
			console.error(
				`Found a directory at ${characterPath} when it should be a file. This will cause errors.`
			);
		}

		// Check if the character device is mounted and available
		// Ensure devices map exists
		if (!kernel.devices) {
			console.error('Device map is undefined, creating empty map');
			kernel.devices = new Map();
		}

		// Check for character device mount
		if (!kernel.devices.has(PATHS.DEV_CHARACTER)) {
			console.error(
				`Character device not found in devices map. Available devices:`,
				Array.from(kernel.devices.keys())
			);
			throw new Error(
				`Character device not mounted at ${PATHS.DEV_CHARACTER}: ${ErrorCode.EDEVNOTREADY}`
			);
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
			console.log(
				`[CharacterLoader] Calling ioctl with request code 1001 (GET_CHARACTER) and buffer:`,
				buffer
			);
			// Note: ioctl is now an async function
			const result = await kernel.ioctl(deviceFd, 1001, buffer);
			console.log(`[CharacterLoader] ioctl result: ${result}, buffer now:`, {
				id: buffer.character?.id,
				name: buffer.character?.name,
				errorDetails: buffer.errorDetails
			});

			if (result !== 0) {
				console.error(
					`[CharacterLoader] Failed ioctl call with error code: ${result}`,
					buffer.errorDetails || 'No error details'
				);
				throw new Error(`Failed to get character data: ${ErrorCode[result]}`);
			}

			// Validate character data
			const loadedCharacter = buffer.character as AssembledCharacter;
			if (!loadedCharacter?.id) {
				// Check if there are error details to include
				const errorDetails = buffer.errorDetails
					? `Error details: ${JSON.stringify(buffer.errorDetails)}`
					: '';

				// Log the error with more details for debugging
				console.error(
					`[CharacterLoader] Invalid character data received from device. Buffer:`,
					buffer
				);

				throw new Error(`Invalid character data received from device. ${errorDetails}`);
			}

			// Log successful character data for debugging
			console.log(`[CharacterLoader] Loaded character successfully:`, {
				id: loadedCharacter.id,
				name: loadedCharacter.name,
				classes: loadedCharacter.game_character_class?.map((c) => c.class?.name) || [],
				level: loadedCharacter.totalLevel || '?'
			});

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
					console.warn(
						`Failed to create character file: ${createResult.errorMessage || 'Unknown error'}`
					);
				}
			}

			// Record diagnostic info
			diagnosticInfo = {
				characterId: loadedCharacter.id,
				loadTime: new Date().toISOString(),
				source: 'device',
				ancestryId: loadedCharacter.game_character_ancestry?.[0]?.ancestry_id,
				ancestry: loadedCharacter.game_character_ancestry?.[0]?.ancestry?.name,
				classes: loadedCharacter.game_character_class?.map((c) => c.class?.name),
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

		console.log(
			`${getTimestamp()} - Unix Character Loader effect running with kernel: ${kernelReady} and ID: ${hasId}, load attempted: ${loadAttempted}, isWaitingForDevice: ${isWaitingForDevice}`
		);

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

		// The Unix Way: Check all required resources - character device, DB device, and directories
		// Ensure devices map exists
		if (!kernel.devices) {
			console.log(`${getTimestamp()} - Device map is undefined, creating empty map`);
			kernel.devices = new Map();
		}

		// Check both character device and database capability
		const needsCharDevice = !kernel.devices.has(PATHS.DEV_CHARACTER);
		const needsDbDevice = !kernel.devices.has('/dev/db');

		// Check for sentinel file that indicates database is ready
		const dbDirsReady = kernel.exists('/etc/db_dirs_ready');

		if (needsCharDevice || needsDbDevice || !dbDirsReady) {
			// Log what resources we're waiting for
			console.log(
				`${getTimestamp()} - Waiting for resources: ${[
					needsCharDevice ? 'character device' : '',
					needsDbDevice ? 'database device' : '',
					!dbDirsReady ? 'database directories' : ''
				]
					.filter(Boolean)
					.join(', ')}`
			);

			console.log(`${getTimestamp()} - Available devices:`, Array.from(kernel.devices.keys()));

			// Set flag to indicate we're waiting for resources
			isWaitingForDevice = true;

			// The Unix Way: Set up comprehensive event listeners for all needed events
			// This is the Unix approach - use notification rather than polling

			// 1. Listen for mount events for either device
			const mountSubscription = kernel.events?.on('fs:mount', (event) => {
				console.log(`${getTimestamp()} - Mount event received:`, event);

				// Check if this is a device we're waiting for
				if (event.path === PATHS.DEV_CHARACTER || event.path === '/dev/db') {
					console.log(`${getTimestamp()} - Device ${event.path} mounted`);

					// Check if we still need to wait for anything
					const stillNeedsChar = !kernel.devices?.has(PATHS.DEV_CHARACTER);
					const stillNeedsDb = !kernel.devices?.has('/dev/db');
					const stillNeedsDirs = !kernel.exists('/etc/db_dirs_ready');

					if (!stillNeedsChar && !stillNeedsDb && stillNeedsDirs === false) {
						console.log(
							`${getTimestamp()} - All required resources are now available, proceeding with character load`
						);

						// Clear the waiting flag to allow loading
						isWaitingForDevice = false;
					} else {
						console.log(
							`${getTimestamp()} - Still waiting for: ${[
								stillNeedsChar ? 'character device' : '',
								stillNeedsDb ? 'database device' : '',
								stillNeedsDirs ? 'database directories' : ''
							]
								.filter(Boolean)
								.join(', ')}`
						);
					}
				}
			});

			// 2. Listen for character device ready event
			const deviceReadySubscription = kernel.events?.on('character:device_ready', (event) => {
				console.log(`${getTimestamp()} - Character device ready event received:`, event);

				// Check if database is also ready before proceeding
				if (kernel.devices?.has('/dev/db') && kernel.exists('/etc/db_dirs_ready')) {
					console.log(
						`${getTimestamp()} - Character device and database both ready, proceeding with character load`
					);
					isWaitingForDevice = false;
				}
			});

			// 3. Listen for database ready event - a key part of our fix
			const databaseReadySubscription = kernel.events?.on('database:ready', (event) => {
				console.log(`${getTimestamp()} - Database ready event received:`, event);

				// Check if character device is also ready before proceeding
				if (kernel.devices?.has(PATHS.DEV_CHARACTER)) {
					console.log(
						`${getTimestamp()} - Character device and database both ready, proceeding with character load`
					);
					isWaitingForDevice = false;
				}
			});

			// 4. Listen for database recovery event
			const databaseRecoveredSubscription = kernel.events?.on('database:recovered', (event) => {
				console.log(`${getTimestamp()} - Database recovered event received:`, event);

				// If this is for our character, we can proceed
				if (event.characterId === data?.id) {
					console.log(
						`${getTimestamp()} - Database recovered for our character, proceeding with character load`
					);
					isWaitingForDevice = false;
				}
			});

			// Track all subscriptions for cleanup
			if (mountSubscription) subscriptions.push(mountSubscription);
			if (deviceReadySubscription) subscriptions.push(deviceReadySubscription);
			if (databaseReadySubscription) subscriptions.push(databaseReadySubscription);
			if (databaseRecoveredSubscription) subscriptions.push(databaseRecoveredSubscription);

			// Start safety timer to check for device readiness
			// This prevents getting stuck in "waiting for device" state if events don't fire
			clearInterval(deviceCheckTimer);
			deviceCheckTimer = setInterval(() => {
				if (isWaitingForDevice && kernel) {
					console.log(`${getTimestamp()} - Safety timer checking if devices are available`);

					// Re-check if devices are available now
					const stillNeedsChar = !kernel.devices?.has(PATHS.DEV_CHARACTER);
					const stillNeedsDb = !kernel.devices?.has('/dev/db');
					const stillNeedsDirs = !kernel.exists('/etc/db_dirs_ready');

					// If both devices are available but the sentinel file is missing, create it
					if (!stillNeedsChar && !stillNeedsDb && stillNeedsDirs) {
						console.log(
							`${getTimestamp()} - Both devices available but missing sentinel file, creating it`
						);

						// Ensure /etc directory exists
						if (!kernel.exists('/etc')) {
							console.log(`${getTimestamp()} - Creating /etc directory`);
							kernel.mkdir('/etc');
						}

						// Create the sentinel file
						try {
							const createResult = kernel.create('/etc/db_dirs_ready', {
								timestamp: Date.now(),
								status: 'ready',
								createdBy: 'CharacterLoader safety timer'
							});

							if (createResult.success) {
								console.log(
									`${getTimestamp()} - Successfully created sentinel file /etc/db_dirs_ready`
								);
							} else {
								console.error(
									`${getTimestamp()} - Failed to create sentinel file: ${createResult.errorMessage}`
								);
							}
						} catch (sentinelError) {
							console.error(`${getTimestamp()} - Error creating sentinel file:`, sentinelError);
						}

						// Proceed with loading regardless
						console.log(
							`${getTimestamp()} - All resources are available (or attempted to create), unblocking load`
						);
						isWaitingForDevice = false;
						loadAttempted = false;
					}
					// If everything is ready, proceed with loading
					else if (!stillNeedsChar && !stillNeedsDb && stillNeedsDirs === false) {
						console.log(`${getTimestamp()} - All resources are now available, unblocking load`);
						isWaitingForDevice = false;
						loadAttempted = false;
					} else {
						// Debug log what we're still waiting for
						console.log(`${getTimestamp()} - Still waiting for: `, {
							needsChar: stillNeedsChar,
							needsDb: stillNeedsDb,
							needsDirs: stillNeedsDirs,
							dbDirsExist: kernel.exists('/etc/db_dirs_ready')
						});

						// If only waiting for the sentinel file AND we've been waiting for more than 5 seconds,
						// proceed anyway as it's likely a missing sentinel file that won't be created
						if (!stillNeedsChar && !stillNeedsDb && stillNeedsDirs) {
							const waitingThreshold = 5000; // 5 seconds
							const waitingStartTime = parseInt(localStorage.getItem('waitingStartTime') || '0');
							const currentTime = Date.now();

							// Store the start time if we haven't already
							if (waitingStartTime === 0) {
								localStorage.setItem('waitingStartTime', currentTime.toString());
							}
							// If we've been waiting long enough, proceed anyway
							else if (currentTime - waitingStartTime > waitingThreshold) {
								console.log(
									`${getTimestamp()} - Waiting threshold exceeded (${waitingThreshold}ms), proceeding anyway`
								);
								isWaitingForDevice = false;
								loadAttempted = false;
								localStorage.removeItem('waitingStartTime');
							}
						}
					}
				} else if (!isWaitingForDevice) {
					// Clear interval if we're no longer waiting
					clearInterval(deviceCheckTimer);
					deviceCheckTimer = null;
				}
			}, 1000);

			// Wait for events to trigger before proceeding
			return;
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
					classes: character.game_character_class?.map((c) => c.class?.name) || [],
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
			let errorMessage =
				loadError instanceof Error ? loadError.message : 'Failed to load character data';

			// Add specific information for known error types
			if (loadError instanceof Error) {
				// Check for database errors
				if (
					loadError.message.includes('Database error') ||
					loadError.message.includes('Character not found')
				) {
					errorMessage = `Database error: ${loadError.message}. Please check if this character ID exists in the database.`;
					diagnosticInfo.errorType = 'database';
				}
				// Check for device errors
				else if (
					loadError.message.includes('Character device not mounted') ||
					loadError.message.includes('EDEVNOTREADY')
				) {
					errorMessage = `Device not ready: ${loadError.message}. The system is still initializing.`;
					diagnosticInfo.errorType = 'device';
				}
				// Check for other specific error codes
				else if (loadError.message.includes('ENOSYS')) {
					errorMessage = 'System error: Database capability not available';
					diagnosticInfo.errorType = 'capability';
				} else if (loadError.message.includes('EIO')) {
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
			if (
				loadError instanceof Error &&
				(loadError.message.includes('Character device not mounted') ||
					loadError.message.includes('EDEVNOTREADY'))
			) {
				console.log(
					`${getTimestamp()} - Detected device not ready error, waiting for device mount event`
				);

				// Reset loading state to retry after device is mounted
				loadAttempted = false;
				isWaitingForDevice = true;

				// Set up event listeners for both standard mount events and custom device ready events
				// Only if not already listening
				if (!subscriptions.some((s) => s.includes('fs:mount'))) {
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
				if (!subscriptions.some((s) => s.includes('character:device_ready'))) {
					const deviceReadySubscription = kernel.events?.on('character:device_ready', (event) => {
						console.log(
							`${getTimestamp()} - Character device ready event received in error handler:`,
							event
						);

						// Clear the waiting flag to allow loading
						isWaitingForDevice = false;
					});

					if (deviceReadySubscription) {
						subscriptions.push(deviceReadySubscription);
					}
				}

				// Also listen for database ready events
				if (!subscriptions.some((s) => s.includes('database:ready'))) {
					const dbReadySubscription = kernel.events?.on('database:ready', (event) => {
						console.log(
							`${getTimestamp()} - Database ready event received in error handler:`,
							event
						);

						// Only clear if character device is also ready
						if (kernel.devices?.has(PATHS.DEV_CHARACTER)) {
							isWaitingForDevice = false;
						}
					});

					if (dbReadySubscription) {
						subscriptions.push(dbReadySubscription);
					}
				}

				// Also listen for database recovery events
				if (!subscriptions.some((s) => s.includes('database:recovered'))) {
					const dbRecoveredSubscription = kernel.events?.on('database:recovered', (event) => {
						console.log(
							`${getTimestamp()} - Database recovered event received in error handler:`,
							event
						);

						// If this is for our character, we can proceed
						if (event.characterId === data?.id) {
							isWaitingForDevice = false;
						}
					});

					if (dbRecoveredSubscription) {
						subscriptions.push(dbRecoveredSubscription);
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
			subscriptions.forEach((id) => {
				kernel.events.off(id);
			});
		}

		// Close all open file descriptors
		if (kernel) {
			openFileDescriptors.forEach((fd) => {
				try {
					kernel.close(fd);
				} catch (e) {
					console.error(`Error closing fd ${fd} during cleanup:`, e);
				}
			});
		}

		// Clear the safety timer
		if (deviceCheckTimer) {
			clearInterval(deviceCheckTimer);
			deviceCheckTimer = null;
		}

		// Clear waiting time storage
		try {
			localStorage.removeItem('waitingStartTime');
		} catch (e) {
			// Ignore errors with localStorage
		}
	});
</script>

{#if isLoading}
	<div class="flex items-center justify-center">
		<div
			class="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
		></div>
		<p class="ml-2">Loading character{isWaitingForDevice ? ' (waiting for device)' : ''}...</p>
	</div>
{:else if error}
	<div class="rounded-md bg-red-100 p-4 text-red-800">
		<p class="font-semibold">Error loading character</p>
		<p>{error}</p>

		<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<h3 class="mb-2 font-medium">Suggestions:</h3>
				<ul class="list-disc space-y-1 pl-5">
					<li>Check if Supabase is running: <code>docker ps | grep supabase</code></li>
					<li>
						Visit the <a href="/diagnostics" class="text-blue-600 hover:underline"
							>diagnostics page</a
						> for detailed testing
					</li>
					<li>Verify character exists in database</li>
					<li>Ensure all devices are mounted correctly</li>
				</ul>
			</div>

			<div>
				<h3 class="mb-2 font-medium">Common Solutions:</h3>
				<ul class="list-disc space-y-1 pl-5">
					<li>Restart Supabase: <code>supabase stop && supabase start</code></li>
					<li>Check environment variables in <code>.env</code> file</li>
					<li>Clear browser cache and reload</li>
				</ul>
			</div>
		</div>

		{#if Object.keys(diagnosticInfo).length > 0}
			<details class="mt-4">
				<summary class="cursor-pointer font-medium">Diagnostic Information</summary>
				<pre class="mt-2 overflow-auto rounded bg-red-50 p-2 text-xs">
{JSON.stringify(diagnosticInfo, null, 2)}</pre>
			</details>
		{/if}

		<div class="mt-4 flex flex-wrap gap-2">
			<button
				class="rounded bg-primary px-4 py-2 text-white"
				onclick={() => window.location.reload()}
			>
				Retry Loading
			</button>
			<a href="/diagnostics" class="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300">
				Run Diagnostics
			</a>
			<button
				class="rounded bg-orange-500 px-4 py-2 text-white"
				onclick={() => {
					// Force database driver connection
					if (kernel) {
						console.log('Forcing database driver reconnection');

						// Find the database driver - with better driver extraction
						const dbDevice = kernel.mountPoints?.get('/dev/db') || kernel.devices?.get('/dev/db');

						// Find the character device
						const charDevice =
							kernel.mountPoints?.get('/dev/character') || kernel.devices?.get('/dev/character');

						if (dbDevice && charDevice) {
							// Force connect database driver to character capability
							console.log('Found both devices, connecting them');

							// Try to get the actual driver from the device
							const dbDriver = dbDevice.driver || dbDevice;

							// Log driver details for debugging
							const driverDetails = {
								hasClient: !!(dbDriver as any).client,
								hasKernel: !!(dbDriver as any).kernel,
								type: dbDriver.constructor ? dbDriver.constructor.name : 'unknown',
								methods: Object.getOwnPropertyNames((dbDriver as any).__proto__).filter(
									(m) => typeof (dbDriver as any)[m] === 'function'
								)
							};
							console.log('Database driver details:', driverDetails);

							// Connect the driver to the character device
							(charDevice as any).databaseDriver = dbDriver;

							// For better diagnostics, check character device methods too
							console.log('Character device details:', {
								methods: Object.getOwnPropertyNames((charDevice as any).__proto__).filter(
									(m) => typeof (charDevice as any)[m] === 'function'
								),
								type: charDevice.constructor ? charDevice.constructor.name : 'unknown'
							});

							// Signal that db connection has been repaired
							if (kernel.events) {
								kernel.events.emit('database:connection_repaired', {
									timestamp: Date.now(),
									source: 'manual_reconnect',
									characterId: data?.id
								});
							}

							// Retry loading
							loadAttempted = false;
							isWaitingForDevice = false;
							isLoading = true;
							error = null;
						} else {
							// More diagnostic information to help troubleshoot
							const deviceStatus = {
								dbFound: !!dbDevice,
								charFound: !!charDevice,
								dbMountPoints: kernel.mountPoints
									? Array.from(kernel.mountPoints.entries())
											.filter(([k]) => k.includes('db'))
											.map(([k, v]) => ({ path: k, type: v?.constructor?.name }))
									: [],
								charMountPoints: kernel.mountPoints
									? Array.from(kernel.mountPoints.entries())
											.filter(([k]) => k.includes('character'))
											.map(([k, v]) => ({ path: k, type: v?.constructor?.name }))
									: [],
								kernelDevices: kernel.devices ? Array.from(kernel.devices.keys()) : [],
								kernelMountPoints: kernel.mountPoints ? Array.from(kernel.mountPoints.keys()) : [],
								eventsRegistered: !!kernel.events,
								sentinelFileExists: kernel.exists('/etc/db_dirs_ready')
							};
							console.error('Device status:', deviceStatus);

							// Alert with more helpful message
							alert(
								`Could not find required devices. Missing: ${!dbDevice ? 'Database' : ''} ${!charDevice ? 'Character' : ''}\nCheck console for details. Try reloading the page.`
							);
						}
					} else {
						alert('Kernel not available. Try reloading the page.');
					}
				}}
			>
				Force Reconnect Drivers
			</button>
		</div>
	</div>
{:else if character}
	<slot />
{:else}
	<div class="rounded-md bg-yellow-100 p-4 text-yellow-800">
		<p>No character data available.</p>
	</div>
{/if}
