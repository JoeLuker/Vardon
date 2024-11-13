<script lang="ts">
	import { onDestroy } from 'svelte';

	let {
		isLoading = false,
		message = 'Loading...',
		progress = null,
		showDelay = 500
	} = $props<{
		isLoading?: boolean;
		message?: string;
		progress?: number | null;
		showDelay?: number;
	}>();

	let shouldShow = $state(false);
	let spinnerTimeout = $state<ReturnType<typeof setTimeout> | undefined>(undefined);
	let currentFrame = $state(0);
	let interval = $state<ReturnType<typeof setInterval> | undefined>(undefined);
	const spinnerFrames = ['◜', '◠', '◝', '◞', '◡', '◟'];

	// Only show loading overlay if loading persists beyond showDelay
	$effect(() => {
		if (isLoading) {
			spinnerTimeout = setTimeout(() => {
				shouldShow = true;
			}, showDelay);
		} else {
			if (spinnerTimeout) {
				clearTimeout(spinnerTimeout);
				spinnerTimeout = undefined;
			}
			shouldShow = false;
		}

		return () => {
			if (spinnerTimeout) {
				clearTimeout(spinnerTimeout);
				spinnerTimeout = undefined;
			}
		};
	});

	// Animate the spinner when loading
	$effect(() => {
		if (shouldShow) {
			interval = setInterval(() => {
				currentFrame = (currentFrame + 1) % spinnerFrames.length;
			}, 150);
		} else if (interval) {
			clearInterval(interval);
			interval = undefined;
		}

		return () => {
			if (interval) {
				clearInterval(interval);
				interval = undefined;
			}
		};
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
		if (spinnerTimeout) clearTimeout(spinnerTimeout);
	});
</script>

{#if shouldShow}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity duration-200"
		role="alert"
		aria-live="polite"
	>
		<div class="min-w-[200px] rounded-lg bg-white p-6 shadow-lg">
			<div class="flex items-center justify-center space-x-3">
				<span class="text-2xl text-primary" aria-hidden="true">
					{spinnerFrames[currentFrame]}
				</span>
				<span class="text-lg text-gray-700">{message}</span>
			</div>

			{#if progress !== null}
				<div class="mt-4">
					<div class="h-2 w-full rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-primary transition-all duration-300"
							style="width: {progress}%"
							role="progressbar"
							aria-valuenow={progress}
							aria-valuemin="0"
							aria-valuemax="100"
						></div>
					</div>
					<div class="mt-1 text-center text-sm text-gray-600">
						{progress}%
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
