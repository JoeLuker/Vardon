<script lang="ts">
	// Client-side filesystem initialization component for Vardon
	// This component can be placed in the root layout to ensure filesystem is initialized

	import { onMount, onDestroy } from 'svelte';
	import { fsStatus, fsProgress, fsReady, application, isInitialized } from '../domain/fs-init';
	import { BrowserInitStatus } from '../domain/BrowserInitializer';

	// Props
	export let showInitStatus = false;
	export let debug = false;

	// Local state
	let status = $fsStatus;
	let progress = $fsProgress;
	let showStatus = showInitStatus;
	let ready = $fsReady;
	let initialized = $isInitialized;

	// Subscribe to status updates
	const unsubscribeStatus = fsStatus.subscribe((value) => {
		status = value;
		if (value === BrowserInitStatus.READY) {
			ready = true;

			// Auto-hide status after a delay when ready
			if (showStatus) {
				setTimeout(() => {
					showStatus = false;
				}, 2000);
			}
		}
	});

	// Subscribe to progress updates
	const unsubscribeProgress = fsProgress.subscribe((value) => {
		progress = value;
	});

	const unsubscribeInit = isInitialized.subscribe((value) => {
		initialized = value;
	});

	// Clean up subscriptions
	onDestroy(() => {
		unsubscribeStatus();
		unsubscribeProgress();
		unsubscribeInit();
	});

	// Helper for testing if we're in browser
	const isBrowser = typeof window !== 'undefined';

	// Debug logging
	if (debug && isBrowser) {
		onMount(() => {
			console.log('[VardonFilesystem] Component mounted');
			if (initialized) {
				console.log('[VardonFilesystem] Filesystem already initialized');
			}
		});
	}
</script>

<!-- Initialization status UI -->
{#if showStatus && isBrowser}
	<div class="filesystem-status" class:ready>
		<div class="status-text">
			{#if status === BrowserInitStatus.NOT_STARTED}
				Filesystem: Not started
			{:else if status === BrowserInitStatus.INITIALIZING}
				Filesystem: Initializing ({Math.round(progress)}%)
			{:else if status === BrowserInitStatus.READY}
				Filesystem: Ready
			{:else if status === BrowserInitStatus.FAILED}
				Filesystem: Failed to initialize
			{/if}
		</div>

		<div class="progress-container">
			<div class="progress-bar" style="width: {progress}%"></div>
		</div>
	</div>
{/if}

<style>
	.filesystem-status {
		position: fixed;
		bottom: 10px;
		right: 10px;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px;
		border-radius: 5px;
		font-family: monospace;
		font-size: 12px;
		z-index: 9999;
		transition: opacity 0.5s ease;
	}

	.filesystem-status.ready {
		opacity: 0.6;
	}

	.progress-container {
		width: 100%;
		background-color: #333;
		margin-top: 5px;
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar {
		height: 5px;
		background-color: #2196f3;
		transition: width 0.3s ease;
	}

	/* Change color based on status */
	.ready .progress-bar {
		background-color: #4caf50;
	}
</style>
