<script lang="ts">
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
	let currentFrame = $state(0);
	let spinnerTimeout = $state<ReturnType<typeof setTimeout> | undefined>(undefined);
	let animationInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

	// Spinner configuration
	const spinnerConfig = $state.raw({
		frames: ['◜', '◠', '◝', '◞', '◡', '◟'],
		interval: 150
	});

	// Handle showing/hiding the overlay with delay
	$effect.pre(() => {
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

	// Handle spinner animation
	$effect(() => {
		if (shouldShow) {
			animationInterval = setInterval(() => {
				currentFrame = (currentFrame + 1) % spinnerConfig.frames.length;
			}, spinnerConfig.interval);
		} else if (animationInterval) {
			clearInterval(animationInterval);
			animationInterval = undefined;
		}

		return () => {
			if (animationInterval) {
				clearInterval(animationInterval);
				animationInterval = undefined;
			}
		};
	});

	// Derived values
	let currentSpinnerFrame = $derived(spinnerConfig.frames[currentFrame]);
	
	let progressProps = $derived.by(() => {
		if (progress === null) return null;
		return {
			style: `width: ${progress}%`,
			'aria-valuenow': progress,
			'aria-valuemin': 0,
			'aria-valuemax': 100
		};
	});
</script>

{#if shouldShow}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity duration-200"
		role="alert"
		aria-live="polite"
		aria-busy="true"
	>
		<div 
			class="min-w-[200px] rounded-lg bg-white p-6 shadow-lg"
			role="status"
		>
			<div class="flex items-center justify-center space-x-3">
				<span 
					class="text-2xl text-primary" 
					aria-hidden="true"
				>
					{currentSpinnerFrame}
				</span>
				<span class="text-lg text-gray-700">
					{message}
				</span>
			</div>

			{#if progress !== null}
				<div class="mt-4">
					<div class="h-2 w-full rounded-full bg-gray-200">
						<div
							class="h-full rounded-full bg-primary transition-all duration-300"
							{...progressProps}
							role="progressbar"
						></div>
					</div>
					<div 
						class="mt-1 text-center text-sm text-gray-600"
						aria-hidden="true"
					>
						{progress}%
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}