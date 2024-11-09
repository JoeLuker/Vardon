<script lang="ts">
    export let isLoading: boolean = false;
    export let message: string = 'Loading...';
    export let progress: number | null = null;
  
    // Optional spinner animation frames
    const spinnerFrames = ['◜', '◠', '◝', '◞', '◡', '◟'];
    let currentFrame = 0;
    let interval: ReturnType<typeof setInterval>;
  
    // Animate the spinner when loading
    $: if (isLoading) {
      interval = setInterval(() => {
        currentFrame = (currentFrame + 1) % spinnerFrames.length;
      }, 150);
    }
  
    // Cleanup on component destroy
    import { onDestroy } from 'svelte';
    onDestroy(() => {
      if (interval) clearInterval(interval);
    });
  </script>
  
  {#if isLoading}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
    >
      <div class="min-w-[200px] rounded-lg bg-white p-6 shadow-lg">
        <div class="flex items-center justify-center space-x-3">
          <span class="text-2xl text-[#c19a6b]" aria-hidden="true">
            {spinnerFrames[currentFrame]}
          </span>
          <span class="text-lg text-gray-700">{message}</span>
        </div>
  
        {#if progress !== null}
          <div class="mt-4">
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-full rounded-full bg-[#c19a6b] transition-all duration-300"
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
  
  <style>
    /* Add a subtle fade animation */
    div[role="alert"] {
      animation: fadeIn 0.2s ease-out;
    }
  
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  </style>