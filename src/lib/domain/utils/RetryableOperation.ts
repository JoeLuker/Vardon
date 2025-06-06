/**
 * RetryableOperation
 *
 * A Unix-inspired utility for making operations retryable with backoff.
 * In Unix, commands are designed to be retried on failure, often with
 * exponential backoff (like in network protocols, etc).
 */

import {
	BaseIdempotentOperation,
	type OperationResult,
	type OperationOptions
} from './IdempotentOperation';

/**
 * Retry strategy options
 */
export interface RetryOptions {
	/** Maximum number of retries */
	maxRetries: number;

	/** Initial delay in milliseconds */
	initialDelay: number;

	/** Maximum delay in milliseconds */
	maxDelay?: number;

	/** Backoff factor (multiply delay by this each retry) */
	backoffFactor?: number;

	/** Whether to add jitter to the delay */
	jitter?: boolean;

	/** Debug logging */
	debug?: boolean;

	/** Predicate to determine if an error is retryable */
	isRetryable?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: 3,
	initialDelay: 100,
	maxDelay: 30000,
	backoffFactor: 2,
	jitter: true,
	debug: false,
	isRetryable: () => true
};

/**
 * Retry attempt information
 */
export interface RetryAttempt {
	/** Current attempt number (1-based) */
	attempt: number;

	/** Maximum number of retries */
	maxRetries: number;

	/** Time to wait before next retry */
	nextDelayMs: number;

	/** Error that caused the retry */
	error?: Error;

	/** Timestamp of the retry */
	timestamp: number;
}

/**
 * Result of a retryable operation
 */
export interface RetryableResult<T> extends OperationResult<T> {
	/** Number of attempts made */
	attempts: number;

	/** Total time spent in retries (ms) */
	retryTimeMs: number;

	/** Retry attempts history */
	retryHistory: RetryAttempt[];
}

/**
 * Retryable operation implementation
 */
export abstract class RetryableOperation<TInput, TOutput> extends BaseIdempotentOperation<
	TInput,
	TOutput
> {
	protected readonly retryOptions: Required<RetryOptions>;

	/**
	 * Create a new retryable operation
	 * @param id Operation ID
	 * @param retryOptions Retry options
	 * @param debug Debug logging
	 */
	constructor(
		id: string,
		retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
		debug: boolean = false
	) {
		super(id, debug);
		this.retryOptions = {
			...DEFAULT_RETRY_OPTIONS,
			...retryOptions,
			debug: retryOptions.debug || debug
		};
	}

	/**
	 * Execute the operation with retries
	 * @param input Operation input
	 * @param options Operation options
	 * @returns Operation result
	 */
	protected async doExecute(input: TInput): Promise<RetryableResult<TOutput>> {
		const startTime = Date.now();
		let attempts = 0;
		let totalDelayMs = 0;
		const retryHistory: RetryAttempt[] = [];

		while (true) {
			attempts++;

			try {
				// Execute the operation
				const result = await this.executeOnce(input);

				// Add retry information
				return {
					...result,
					attempts,
					retryTimeMs: Date.now() - startTime,
					retryHistory
				};
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));

				// Check if we should retry
				if (attempts <= this.retryOptions.maxRetries && this.retryOptions.isRetryable(err)) {
					// Calculate delay for next retry
					const delayMs = this.calculateDelay(attempts);

					// Record retry attempt
					const retryAttempt: RetryAttempt = {
						attempt: attempts,
						maxRetries: this.retryOptions.maxRetries,
						nextDelayMs: delayMs,
						error: err,
						timestamp: Date.now()
					};
					retryHistory.push(retryAttempt);

					// Log retry attempt
					if (this.retryOptions.debug) {
						console.log(
							`[${this.id}] Retry ${attempts}/${this.retryOptions.maxRetries} ` +
								`after ${delayMs}ms due to: ${err.message}`
						);
					}

					// Wait before retrying
					await this.delay(delayMs);
					totalDelayMs += delayMs;
				} else {
					// Max retries exceeded or non-retryable error
					if (this.retryOptions.debug) {
						if (attempts > this.retryOptions.maxRetries) {
							console.error(`[${this.id}] Max retries (${this.retryOptions.maxRetries}) exceeded`);
						} else {
							console.error(`[${this.id}] Non-retryable error: ${err.message}`);
						}
					}

					return {
						success: false,
						error: err.message,
						attempts,
						retryTimeMs: Date.now() - startTime,
						retryHistory,
						timestamp: Date.now()
					};
				}
			}
		}
	}

	/**
	 * Execute the operation once
	 * @param input Operation input
	 * @returns Operation result
	 */
	protected abstract executeOnce(input: TInput): Promise<OperationResult<TOutput>>;

	/**
	 * Calculate delay for next retry using exponential backoff
	 * @param attempt Current attempt number (1-based)
	 * @returns Delay in milliseconds
	 */
	private calculateDelay(attempt: number): number {
		// Calculate exponential backoff
		const exponentialDelay =
			this.retryOptions.initialDelay * Math.pow(this.retryOptions.backoffFactor, attempt - 1);

		// Apply maximum delay
		let delay = Math.min(exponentialDelay, this.retryOptions.maxDelay);

		// Add jitter if enabled (±25%)
		if (this.retryOptions.jitter) {
			const jitterFactor = 0.5 + Math.random();
			delay = Math.floor(delay * jitterFactor);
		}

		return delay;
	}

	/**
	 * Wait for a specified time
	 * @param ms Time to wait in milliseconds
	 * @returns Promise that resolves after the delay
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Create a retryable function
 * @param fn Function to make retryable
 * @param options Retry options
 * @returns Retryable function
 */
export function withRetry<TArgs extends any[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	options: RetryOptions = DEFAULT_RETRY_OPTIONS
): (...args: TArgs) => Promise<TResult> {
	const retryOpts = { ...DEFAULT_RETRY_OPTIONS, ...options };

	return async (...args: TArgs): Promise<TResult> => {
		let attempts = 0;

		while (true) {
			attempts++;

			try {
				return await fn(...args);
			} catch (error) {
				const err = error instanceof Error ? error : new Error(String(error));

				// Check if we should retry
				if (attempts <= retryOpts.maxRetries && retryOpts.isRetryable(err)) {
					// Calculate delay for next retry
					const delay = retryOpts.initialDelay * Math.pow(retryOpts.backoffFactor, attempts - 1);

					// Apply maximum delay
					let delayMs = Math.min(delay, retryOpts.maxDelay);

					// Add jitter if enabled (±25%)
					if (retryOpts.jitter) {
						const jitterFactor = 0.5 + Math.random();
						delayMs = Math.floor(delayMs * jitterFactor);
					}

					// Log retry attempt
					if (retryOpts.debug) {
						console.log(
							`[Retry] Attempt ${attempts}/${retryOpts.maxRetries} ` +
								`after ${delayMs}ms due to: ${err.message}`
						);
					}

					// Wait before retrying
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				} else {
					// Max retries exceeded or non-retryable error
					if (retryOpts.debug) {
						if (attempts > retryOpts.maxRetries) {
							console.error(`[Retry] Max retries (${retryOpts.maxRetries}) exceeded`);
						} else {
							console.error(`[Retry] Non-retryable error: ${err.message}`);
						}
					}

					throw err;
				}
			}
		}
	};
}

/**
 * Determine if an error is a transient error (network, timeout, etc.)
 * @param error Error to check
 * @returns Whether the error is transient
 */
export function isTransientError(error: Error): boolean {
	const message = error.message.toLowerCase();

	// Network-related errors (from Fetch API, etc.)
	if (
		message.includes('network') ||
		message.includes('connection') ||
		message.includes('timeout') ||
		message.includes('socket') ||
		message.includes('econnrefused') ||
		message.includes('econnreset') ||
		message.includes('offline')
	) {
		return true;
	}

	// HTTP status codes that indicate transient issues
	if (
		message.includes('status code 408') || // Request Timeout
		message.includes('status code 429') || // Too Many Requests
		message.includes('status code 500') || // Internal Server Error
		message.includes('status code 502') || // Bad Gateway
		message.includes('status code 503') || // Service Unavailable
		message.includes('status code 504') // Gateway Timeout
	) {
		return true;
	}

	// Rate limiting errors
	if (
		message.includes('rate limit') ||
		message.includes('throttle') ||
		message.includes('too many requests')
	) {
		return true;
	}

	return false;
}
