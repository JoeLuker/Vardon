/**
 * IdempotentOperation
 *
 * A Unix-inspired pattern for idempotent operations.
 * Idempotency is a key Unix principle allowing operations to be repeated
 * without causing unintended side effects.
 */

/**
 * Operation result
 */
export interface OperationResult<T> {
	/** Whether the operation succeeded */
	success: boolean;

	/** Result data if successful */
	data?: T;

	/** Error message if failed */
	error?: string;

	/** Whether the operation was already executed */
	alreadyExecuted?: boolean;

	/** Operation ID for tracking */
	operationId?: string;

	/** Timestamp of execution */
	timestamp: number;
}

/**
 * Operation options
 */
export interface OperationOptions {
	/** Operation ID for idempotency */
	operationId?: string;

	/** Whether to check for prior execution */
	checkPriorExecution?: boolean;

	/** Whether to record execution */
	recordExecution?: boolean;

	/** Operation timeout in milliseconds */
	timeout?: number;

	/** Debug logging */
	debug?: boolean;
}

/**
 * Idempotent operation interface
 */
export interface IdempotentOperation<TInput, TOutput> {
	/**
	 * Get the operation ID
	 */
	getOperationId(): string;

	/**
	 * Check if the operation has already been executed
	 * @param input Operation input
	 * @returns Whether the operation has been executed
	 */
	hasBeenExecuted(input: TInput): Promise<boolean>;

	/**
	 * Execute the operation
	 * @param input Operation input
	 * @param options Operation options
	 * @returns Operation result
	 */
	execute(input: TInput, options?: OperationOptions): Promise<OperationResult<TOutput>>;

	/**
	 * Record that the operation has been executed
	 * @param input Operation input
	 * @param result Operation result
	 */
	recordExecution(input: TInput, result: OperationResult<TOutput>): Promise<void>;
}

/**
 * Base implementation of an idempotent operation
 */
export abstract class BaseIdempotentOperation<TInput, TOutput>
	implements IdempotentOperation<TInput, TOutput>
{
	protected readonly id: string;
	protected readonly debug: boolean;
	protected readonly executionLog: Map<string, OperationResult<TOutput>> = new Map();

	constructor(id: string, debug: boolean = false) {
		this.id = id;
		this.debug = debug;
	}

	/**
	 * Get the operation ID
	 */
	getOperationId(): string {
		return this.id;
	}

	/**
	 * Check if the operation has already been executed
	 * Default implementation uses an in-memory map
	 * @param input Operation input
	 * @returns Whether the operation has been executed
	 */
	async hasBeenExecuted(input: TInput): Promise<boolean> {
		const operationId = this.getExecutionId(input);
		return this.executionLog.has(operationId);
	}

	/**
	 * Execute the operation
	 * @param input Operation input
	 * @param options Operation options
	 * @returns Operation result
	 */
	async execute(input: TInput, options?: OperationOptions): Promise<OperationResult<TOutput>> {
		const opts = this.prepareOptions(options);
		const operationId = opts.operationId || this.getExecutionId(input);

		try {
			// Check for prior execution if enabled
			if (opts.checkPriorExecution) {
				const alreadyExecuted = await this.hasBeenExecuted(input);
				if (alreadyExecuted) {
					// Return cached result if available
					const cachedResult = this.executionLog.get(operationId);
					if (cachedResult) {
						if (this.debug) {
							console.log(`[${this.id}] Operation already executed, returning cached result`);
						}
						return {
							...cachedResult,
							alreadyExecuted: true
						};
					}
				}
			}

			// Create promise for operation execution with timeout
			const executionPromise = this.doExecute(input);

			// Apply timeout if specified
			let result: OperationResult<TOutput>;
			if (opts.timeout && opts.timeout > 0) {
				result = await this.withTimeout(executionPromise, opts.timeout);
			} else {
				result = await executionPromise;
			}

			// Add operation ID and timestamp
			result.operationId = operationId;
			result.timestamp = Date.now();

			// Record execution if enabled
			if (opts.recordExecution) {
				await this.recordExecution(input, result);
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			if (this.debug) {
				console.error(`[${this.id}] Operation failed: ${errorMessage}`);
			}

			const result: OperationResult<TOutput> = {
				success: false,
				error: errorMessage,
				operationId,
				timestamp: Date.now()
			};

			// Even failures are recorded
			if (opts.recordExecution) {
				await this.recordExecution(input, result);
			}

			return result;
		}
	}

	/**
	 * Record that the operation has been executed
	 * Default implementation stores in an in-memory map
	 * @param input Operation input
	 * @param result Operation result
	 */
	async recordExecution(input: TInput, result: OperationResult<TOutput>): Promise<void> {
		const operationId = result.operationId || this.getExecutionId(input);
		this.executionLog.set(operationId, result);

		if (this.debug) {
			console.log(`[${this.id}] Recorded execution of operation ${operationId}`);
		}
	}

	/**
	 * Get a unique ID for this execution based on input
	 * @param input Operation input
	 * @returns Execution ID
	 */
	protected getExecutionId(input: TInput): string {
		// Default implementation uses JSON stringification
		// Subclasses should override this for more appropriate IDs
		const inputStr = JSON.stringify(input);
		const hash = this.simpleHash(inputStr);
		return `${this.id}-${hash}`;
	}

	/**
	 * Create a simple hash from a string
	 * @param str String to hash
	 * @returns Simple hash value
	 */
	protected simpleHash(str: string): string {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash).toString(16);
	}

	/**
	 * Apply timeout to a promise
	 * @param promise Promise to apply timeout to
	 * @param timeout Timeout in milliseconds
	 * @returns Promise with timeout
	 */
	protected async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error(`Operation timed out after ${timeout}ms`));
			}, timeout);

			promise
				.then((result) => {
					clearTimeout(timeoutId);
					resolve(result);
				})
				.catch((error) => {
					clearTimeout(timeoutId);
					reject(error);
				});
		});
	}

	/**
	 * Prepare options with defaults
	 * @param options User-provided options
	 * @returns Options with defaults applied
	 */
	protected prepareOptions(options?: OperationOptions): Required<OperationOptions> {
		return {
			operationId: options?.operationId || '',
			checkPriorExecution: options?.checkPriorExecution !== false,
			recordExecution: options?.recordExecution !== false,
			timeout: options?.timeout || 0,
			debug: options?.debug || this.debug
		};
	}

	/**
	 * Implement the actual operation execution
	 * @param input Operation input
	 * @returns Operation result
	 */
	protected abstract doExecute(input: TInput): Promise<OperationResult<TOutput>>;
}

/**
 * In-memory store for idempotent operations
 * Provides a singleton for operation results across instances
 */
export class IdempotencyStore {
	private static instance: IdempotencyStore;
	private readonly store: Map<string, any> = new Map();

	private constructor() {}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): IdempotencyStore {
		if (!IdempotencyStore.instance) {
			IdempotencyStore.instance = new IdempotencyStore();
		}
		return IdempotencyStore.instance;
	}

	/**
	 * Check if an operation has been executed
	 * @param operationId Operation ID
	 * @returns Whether the operation has been executed
	 */
	has(operationId: string): boolean {
		return this.store.has(operationId);
	}

	/**
	 * Get an operation result
	 * @param operationId Operation ID
	 * @returns Operation result or undefined
	 */
	get<T>(operationId: string): T | undefined {
		return this.store.get(operationId);
	}

	/**
	 * Set an operation result
	 * @param operationId Operation ID
	 * @param result Operation result
	 */
	set<T>(operationId: string, result: T): void {
		this.store.set(operationId, result);
	}

	/**
	 * Delete an operation result
	 * @param operationId Operation ID
	 * @returns Whether the operation was deleted
	 */
	delete(operationId: string): boolean {
		return this.store.delete(operationId);
	}

	/**
	 * Clear all operation results
	 */
	clear(): void {
		this.store.clear();
	}
}

/**
 * Make a function idempotent
 * @param fn Function to make idempotent
 * @param getKey Function to get idempotency key from arguments
 * @param options Idempotency options
 * @returns Idempotent function
 */
export function makeIdempotent<TArgs extends any[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
	getKey: (...args: TArgs) => string,
	options: {
		store?: IdempotencyStore;
		timeout?: number;
		debug?: boolean;
	} = {}
): (...args: TArgs) => Promise<TResult> {
	const store = options.store || IdempotencyStore.getInstance();
	const debug = options.debug || false;

	return async (...args: TArgs): Promise<TResult> => {
		const key = getKey(...args);

		// Check if we've already processed this
		if (store.has(key)) {
			if (debug) {
				console.log(`[Idempotent] Returning cached result for ${key}`);
			}
			return store.get<TResult>(key)!;
		}

		// Execute the function
		let result: TResult;
		try {
			if (options.timeout && options.timeout > 0) {
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(
						() => reject(new Error(`Operation timed out after ${options.timeout}ms`)),
						options.timeout
					);
				});
				result = await Promise.race([fn(...args), timeoutPromise]);
			} else {
				result = await fn(...args);
			}

			// Store the result
			store.set(key, result);

			return result;
		} catch (error) {
			// Don't store errors in idempotency cache
			throw error;
		}
	};
}
