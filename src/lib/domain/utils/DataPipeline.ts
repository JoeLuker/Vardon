/**
 * Unix-style Data Pipeline
 *
 * This module implements a data transformation pipeline following Unix principles:
 * - One operation per step (do one thing well)
 * - Composable transformations (output of one is input to the next)
 * - Supports both synchronous and asynchronous transforms
 * - Built on file-based operations
 * - Each stage reads from a file and writes to a file
 * - Pipeline stages can be inspected, debugged, and reused
 */

import type { GameKernel } from '../kernel/GameKernel';
import { OpenMode, ErrorCode } from '../kernel/types';

/**
 * Transform function interface
 * Takes input data and returns transformed data
 */
export interface Transform<TInput = any, TOutput = any> {
	(input: TInput): TOutput | Promise<TOutput>;
}

/**
 * Named transform
 * A transform with a descriptive name for debugging and monitoring
 */
export interface NamedTransform<TInput = any, TOutput = any> {
	name: string;
	transform: Transform<TInput, TOutput>;
	description?: string;
}

/**
 * Pipeline stage information
 * Contains details about a pipeline stage including its input/output paths
 */
export interface PipelineStage {
	name: string;
	description?: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	inputPath?: string;
	outputPath?: string;
	startTime?: number;
	endTime?: number;
	duration?: number;
	error?: string;
	inputSize?: number;
	outputSize?: number;
}

/**
 * Pipeline result
 * Contains the final output and metrics about the pipeline execution
 */
export interface PipelineResult<T = any> {
	output: T;
	pipelineId: string;
	pipelinePath: string;
	metrics: {
		startTime: number;
		endTime: number;
		duration: number;
		stages: PipelineStage[];
	};
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
	debug?: boolean;
	pipeDir?: string;
	collectMetrics?: boolean;
	cleanup?: boolean;
	description?: string;
	name?: string;
	retainIntermediateFiles?: boolean;
}

/**
 * Unix-style Data Pipeline
 * Processes data through a series of transforms, storing intermediate results in files
 */
export class DataPipeline<TInput = any, TOutput = any> {
	private readonly transforms: NamedTransform[] = [];
	private readonly debug: boolean;
	private readonly pipeDir: string;
	private readonly collectMetrics: boolean;
	private readonly cleanup: boolean;
	private readonly name: string;
	private readonly description: string;
	private readonly retainIntermediateFiles: boolean;

	/**
	 * Create a new data pipeline
	 * @param kernel Kernel for file operations
	 * @param config Pipeline configuration
	 */
	constructor(
		private readonly kernel: GameKernel,
		config: PipelineConfig = {}
	) {
		this.debug = config.debug || false;
		this.pipeDir = config.pipeDir || '/v_tmp/pipelines';
		this.collectMetrics = config.collectMetrics || true;
		this.cleanup = config.cleanup || false;
		this.name = config.name || `pipeline_${Date.now()}`;
		this.description = config.description || 'Unix-style data pipeline';
		this.retainIntermediateFiles = config.retainIntermediateFiles || true;

		// Ensure pipeline directory exists
		this.initializePipelineDir();
	}

	/**
	 * Initialize pipeline directory
	 */
	private initializePipelineDir(): void {
		if (!this.kernel.exists(this.pipeDir)) {
			// Create the directory using unix-style open with DIRECTORY mode
			const fd = this.kernel.open(this.pipeDir, OpenMode.WRITE | OpenMode.DIRECTORY);
			if (fd < 0) {
				if (this.debug) {
					console.error(`Failed to create pipeline directory: ${this.pipeDir}, error code: ${fd}`);
				}
				throw new Error(`Failed to create pipeline directory: ${this.pipeDir}`);
			}
			this.kernel.close(fd);
		}
	}

	/**
	 * Add a transform to the pipeline
	 * @param name Transform name
	 * @param transform Transform function
	 * @param description Optional description of what this transform does
	 * @returns This pipeline for chaining
	 */
	add<TStep>(
		name: string,
		transform: Transform<any, TStep>,
		description?: string
	): DataPipeline<TInput, TStep> {
		this.transforms.push({ name, transform, description });
		return this as unknown as DataPipeline<TInput, TStep>;
	}

	/**
	 * Add a transform using a standard pipe syntax
	 * @param transform Transform function
	 * @param options Optional configuration
	 * @returns This pipeline for chaining
	 */
	pipe<TStep>(
		transform: Transform<any, TStep>,
		options: { name?: string; description?: string } = {}
	): DataPipeline<TInput, TStep> {
		const name = options.name || `step_${this.transforms.length + 1}`;
		return this.add(name, transform, options.description);
	}

	/**
	 * Execute the pipeline
	 * @param input Input data
	 * @returns Pipeline result
	 */
	async execute(input: TInput): Promise<PipelineResult<TOutput>> {
		const pipelineId = `${this.name}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
		const pipelinePath = `${this.pipeDir}/${pipelineId}`;

		// Create pipeline directory using unix-style open
		const pipelineDirFd = this.kernel.open(pipelinePath, OpenMode.WRITE | OpenMode.DIRECTORY);
		if (pipelineDirFd < 0) {
			throw new Error(`Failed to create pipeline directory: ${pipelinePath}`);
		}
		this.kernel.close(pipelineDirFd);

		// Write pipeline manifest
		const manifestPath = `${pipelinePath}/manifest.json`;
		const manifestFd = this.kernel.open(manifestPath, OpenMode.WRITE);
		if (manifestFd >= 0) {
			const manifest = {
				id: pipelineId,
				name: this.name,
				description: this.description,
				createdAt: Date.now(),
				transforms: this.transforms.map((t) => ({
					name: t.name,
					description: t.description
				}))
			};
			this.kernel.write(manifestFd, manifest);
			this.kernel.close(manifestFd);
		}

		// Initialize metrics
		const startTime = Date.now();
		const stages: PipelineStage[] = [];

		try {
			// Write input to first stage file
			const inputFile = `${pipelinePath}/input.json`;
			const inputFd = this.kernel.open(inputFile, OpenMode.WRITE);
			if (inputFd < 0) {
				throw new Error(`Failed to create input file: ${inputFile}`);
			}
			this.kernel.write(inputFd, input);
			this.kernel.close(inputFd);

			// Track the current working data
			let currentData = input;

			// Process each transform
			for (let i = 0; i < this.transforms.length; i++) {
				const { name, transform, description } = this.transforms[i];
				const stageDir = `${pipelinePath}/stage_${i + 1}_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

				// Create stage directory
				const stageDirFd = this.kernel.open(stageDir, OpenMode.WRITE | OpenMode.DIRECTORY);
				if (stageDirFd < 0) {
					throw new Error(`Failed to create stage directory: ${stageDir}`);
				}
				this.kernel.close(stageDirFd);

				// Create stage information
				const stage: PipelineStage = {
					name,
					description,
					status: 'pending',
					inputPath: `${stageDir}/input.json`,
					outputPath: `${stageDir}/output.json`
				};
				stages.push(stage);

				// Write stage information
				const stageInfoPath = `${stageDir}/info.json`;
				const stageInfoFd = this.kernel.open(stageInfoPath, OpenMode.WRITE);
				if (stageInfoFd >= 0) {
					this.kernel.write(stageInfoFd, {
						name,
						description,
						status: 'pending',
						pipelineId,
						stageIndex: i
					});
					this.kernel.close(stageInfoFd);
				}

				// Write stage input
				const stageInputFd = this.kernel.open(stage.inputPath!, OpenMode.WRITE);
				if (stageInputFd < 0) {
					throw new Error(`Failed to create stage input file: ${stage.inputPath}`);
				}
				this.kernel.write(stageInputFd, currentData);
				this.kernel.close(stageInputFd);

				const inputSize = JSON.stringify(currentData).length;
				stage.inputSize = inputSize;
				stage.status = 'running';
				stage.startTime = Date.now();

				// Update stage info
				const runningInfoFd = this.kernel.open(stageInfoPath, OpenMode.WRITE);
				if (runningInfoFd >= 0) {
					this.kernel.write(runningInfoFd, {
						name,
						description,
						status: 'running',
						startTime: stage.startTime,
						inputSize,
						pipelineId,
						stageIndex: i
					});
					this.kernel.close(runningInfoFd);
				}

				// Apply transform
				try {
					currentData = await transform(currentData);
				} catch (error) {
					// Update stage status on error
					stage.status = 'failed';
					stage.endTime = Date.now();
					stage.duration = stage.endTime - (stage.startTime || stage.endTime);
					stage.error = error.message;

					// Write error information
					const errorPath = `${stageDir}/error.json`;
					const errorFd = this.kernel.open(errorPath, OpenMode.WRITE);
					if (errorFd >= 0) {
						this.kernel.write(errorFd, {
							message: error.message,
							stack: error.stack,
							timestamp: stage.endTime
						});
						this.kernel.close(errorFd);
					}

					// Update stage info
					const failedInfoFd = this.kernel.open(stageInfoPath, OpenMode.WRITE);
					if (failedInfoFd >= 0) {
						this.kernel.write(failedInfoFd, {
							name,
							description,
							status: 'failed',
							startTime: stage.startTime,
							endTime: stage.endTime,
							duration: stage.duration,
							error: error.message,
							inputSize,
							pipelineId,
							stageIndex: i
						});
						this.kernel.close(failedInfoFd);
					}

					if (this.debug) {
						console.error(`Error in pipeline stage ${name}:`, error);
					}
					throw new Error(`Pipeline stage "${name}" failed: ${error.message}`);
				}

				// Write stage output
				const stageOutputFd = this.kernel.open(stage.outputPath!, OpenMode.WRITE);
				if (stageOutputFd < 0) {
					throw new Error(`Failed to create stage output file: ${stage.outputPath}`);
				}
				this.kernel.write(stageOutputFd, currentData);
				this.kernel.close(stageOutputFd);

				// Update stage status
				stage.status = 'completed';
				stage.endTime = Date.now();
				stage.duration = stage.endTime - (stage.startTime || stage.endTime);
				stage.outputSize = JSON.stringify(currentData).length;

				// Update stage info
				const completedInfoFd = this.kernel.open(stageInfoPath, OpenMode.WRITE);
				if (completedInfoFd >= 0) {
					this.kernel.write(completedInfoFd, {
						name,
						description,
						status: 'completed',
						startTime: stage.startTime,
						endTime: stage.endTime,
						duration: stage.duration,
						inputSize: stage.inputSize,
						outputSize: stage.outputSize,
						pipelineId,
						stageIndex: i
					});
					this.kernel.close(completedInfoFd);
				}
			}

			// Write final output
			const outputFile = `${pipelinePath}/output.json`;
			const outputFd = this.kernel.open(outputFile, OpenMode.WRITE);
			if (outputFd < 0) {
				throw new Error(`Failed to create output file: ${outputFile}`);
			}
			this.kernel.write(outputFd, currentData);
			this.kernel.close(outputFd);

			// Finalize metrics
			const endTime = Date.now();

			// Write metrics if collecting
			if (this.collectMetrics) {
				const metrics = {
					startTime,
					endTime,
					duration: endTime - startTime,
					stages
				};

				const metricsFile = `${pipelinePath}/metrics.json`;
				const metricsFd = this.kernel.open(metricsFile, OpenMode.WRITE);
				if (metricsFd >= 0) {
					this.kernel.write(metricsFd, metrics);
					this.kernel.close(metricsFd);
				}
			}

			// Clean up if requested
			if (this.cleanup && !this.retainIntermediateFiles) {
				this.cleanupPipeline(pipelineId);
			}

			return {
				output: currentData as TOutput,
				pipelineId,
				pipelinePath,
				metrics: {
					startTime,
					endTime,
					duration: endTime - startTime,
					stages
				}
			};
		} catch (error) {
			// Write error log
			const errorFile = `${pipelinePath}/error.json`;
			const errorFd = this.kernel.open(errorFile, OpenMode.WRITE);
			if (errorFd >= 0) {
				this.kernel.write(errorFd, {
					error: error.message,
					stack: error.stack,
					timestamp: Date.now()
				});
				this.kernel.close(errorFd);
			}

			throw error;
		}
	}

	/**
	 * Clean up pipeline files
	 * @param pipelineId Pipeline ID to clean up
	 */
	private cleanupPipeline(pipelineId: string): void {
		const pipelinePath = `${this.pipeDir}/${pipelineId}`;

		// In a real implementation, we would recursively delete the pipeline directory
		// For now, we'll leave this as a placeholder
		if (this.debug) {
			console.log(`[DataPipeline] Would clean up pipeline: ${pipelinePath}`);
		}
	}

	/**
	 * List all pipelines in the pipeline directory
	 * @returns Array of pipeline IDs
	 */
	async listPipelines(): Promise<string[]> {
		if (!this.kernel.exists(this.pipeDir)) {
			return [];
		}

		// List all subdirectories in the pipeline directory
		const dirFd = this.kernel.open(this.pipeDir, OpenMode.READ | OpenMode.DIRECTORY);
		if (dirFd < 0) {
			return [];
		}

		try {
			const entries: string[] = [];
			this.kernel.readdir(dirFd, entries);
			return entries.filter((entry) => entry !== '.' && entry !== '..');
		} finally {
			this.kernel.close(dirFd);
		}
	}

	/**
	 * Get pipeline information
	 * @param pipelineId Pipeline ID
	 * @returns Pipeline information if available
	 */
	async getPipelineInfo(pipelineId: string): Promise<any | null> {
		const pipelinePath = `${this.pipeDir}/${pipelineId}`;
		const manifestPath = `${pipelinePath}/manifest.json`;

		if (!this.kernel.exists(manifestPath)) {
			return null;
		}

		const manifestFd = this.kernel.open(manifestPath, OpenMode.READ);
		if (manifestFd < 0) {
			return null;
		}

		try {
			const manifest: any = {};
			const [result] = this.kernel.read(manifestFd, manifest);
			if (result !== 0) {
				return null;
			}

			return manifest;
		} finally {
			this.kernel.close(manifestFd);
		}
	}

	/**
	 * Static method to create a pipeline
	 * @param kernel Kernel for file operations
	 * @param config Pipeline configuration
	 * @returns New pipeline
	 */
	static create<TInput = any, TOutput = any>(
		kernel: GameKernel,
		config: PipelineConfig = {}
	): DataPipeline<TInput, TOutput> {
		return new DataPipeline<TInput, TOutput>(kernel, config);
	}
}

/**
 * Common transforms for data processing
 */
export const CommonTransforms = {
	/**
	 * Convert character entity to UI model
	 */
	entityToUiModel: (entity: any) => {
		return {
			id: entity.id,
			name: entity.name,
			level:
				entity.character?.classes?.reduce((sum: number, cls: any) => sum + (cls.level || 0), 0) ||
				0,
			abilities: entity.character?.abilities || {}
			// Add more UI model properties as needed
		};
	},

	/**
	 * Filter array items based on predicate
	 * @param predicate Filter predicate
	 */
	filter: <T>(predicate: (item: T) => boolean) => {
		return (items: T[]) => items.filter(predicate);
	},

	/**
	 * Map array items using a transform
	 * @param mapFn Mapping function
	 */
	map: <T, U>(mapFn: (item: T) => U) => {
		return (items: T[]) => items.map(mapFn);
	},

	/**
	 * Sort array items
	 * @param compareFn Compare function
	 */
	sort: <T>(compareFn: (a: T, b: T) => number) => {
		return (items: T[]) => [...items].sort(compareFn);
	},

	/**
	 * Group array items by key
	 * @param keyFn Function to extract the grouping key
	 */
	groupBy: <T>(keyFn: (item: T) => string) => {
		return (items: T[]) => {
			const groups: Record<string, T[]> = {};
			for (const item of items) {
				const key = keyFn(item);
				if (!groups[key]) {
					groups[key] = [];
				}
				groups[key].push(item);
			}
			return groups;
		};
	},

	/**
	 * Flatten nested arrays
	 */
	flatten: <T>() => {
		return (nestedArrays: T[][]) => nestedArrays.flat();
	},

	/**
	 * Apply multiple transforms in parallel and combine results
	 * @param transforms Array of transforms to apply
	 * @param combiner Function to combine results
	 */
	parallel: <T, U>(transforms: Array<Transform<T, U>>, combiner: (results: U[]) => any) => {
		return async (input: T) => {
			const results = await Promise.all(transforms.map((t) => t(input)));
			return combiner(results);
		};
	},

	/**
	 * Pick specific properties from an object
	 * @param keys Keys to pick
	 */
	pick: <T extends object, K extends keyof T>(keys: K[]) => {
		return (obj: T): Pick<T, K> => {
			const result = {} as Pick<T, K>;
			for (const key of keys) {
				if (key in obj) {
					result[key] = obj[key];
				}
			}
			return result;
		};
	},

	/**
	 * Omit specific properties from an object
	 * @param keys Keys to omit
	 */
	omit: <T extends object, K extends keyof T>(keys: K[]) => {
		return (obj: T): Omit<T, K> => {
			const result = { ...obj } as Omit<T, K>;
			for (const key of keys) {
				delete result[key as keyof typeof result];
			}
			return result;
		};
	},

	/**
	 * Convert entity path to file path
	 */
	entityPathToFilePath: (entityPath: string) => {
		return entityPath.replace(/^\/v_entity\//, '/v_var/entity/').replace(/:/g, '/');
	},

	/**
	 * Convert file path to entity path
	 */
	filePathToEntityPath: (filePath: string) => {
		return filePath.replace(/^\/var\/entity\//, '/v_entity/').replace(/\//g, ':');
	},

	/**
	 * Transform to debug/log values in the pipeline
	 * @param prefix Optional prefix for the log message
	 */
	debug: (prefix?: string) => {
		return <T>(value: T): T => {
			console.log(`[DEBUG${prefix ? ` ${prefix}` : ''}]`, value);
			return value;
		};
	},

	/**
	 * Convert database row to entity
	 */
	dbRowToEntity: (row: any) => {
		return {
			id: `${row.type}-${row.id}`,
			type: row.type,
			name: row.name,
			properties: row.properties || {},
			capabilities: row.capabilities || {}
		};
	},

	/**
	 * Aggregate values using specified function
	 * @param aggregator Aggregation function
	 */
	aggregate: <T, R>(aggregator: (values: T[]) => R) => {
		return (values: T[]): R => aggregator(values);
	}
};
