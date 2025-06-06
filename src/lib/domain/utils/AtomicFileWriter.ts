/**
 * AtomicFileWriter
 *
 * A Unix-inspired utility for atomic file operations.
 * Following Unix principles of atomic operations, this implements a transactional
 * approach to file writing similar to how Unix filesystems handle file operations.
 */

import {
	TransactionalOperation,
	TransactionState,
	TransactionContext,
	LogLevel,
	type TransactionResult
} from './TransactionalOperation';
import type { GameKernel } from '../kernel/GameKernel';
import { ErrorCode } from '../kernel/types';

/**
 * Input for atomic file writer
 */
export interface AtomicFileInput {
	/** Path to write to */
	path: string;

	/** Content to write */
	content: any;

	/** Whether to create parent directories */
	createDirectories?: boolean;

	/** Whether to overwrite existing file */
	overwrite?: boolean;

	/** Whether to keep backup */
	keepBackup?: boolean;
}

/**
 * Output for atomic file writer
 */
export interface AtomicFileOutput {
	/** Path that was written */
	path: string;

	/** Whether the file was created */
	created: boolean;

	/** Temporary file path used (if any) */
	tempPath?: string;

	/** Backup file path (if kept) */
	backupPath?: string;

	/** Bytes written */
	bytesWritten?: number;
}

/**
 * Implements atomic file writing using a transactional approach
 */
export class AtomicFileWriter extends TransactionalOperation<AtomicFileInput, AtomicFileOutput> {
	private kernel: GameKernel;

	/**
	 * Create a new atomic file writer
	 * @param kernel Kernel to use for file operations
	 * @param debug Whether to enable debug logging
	 */
	constructor(kernel: GameKernel, debug: boolean = false) {
		super('atomic-file-writer', { logLevel: debug ? LogLevel.DEBUG : LogLevel.ERROR }, debug);
		this.kernel = kernel;
	}

	/**
	 * Write a file atomically
	 * @param path File path
	 * @param content File content
	 * @param options Write options
	 * @returns File operation result
	 */
	async writeFile(
		path: string,
		content: any,
		options: {
			createDirectories?: boolean;
			overwrite?: boolean;
			keepBackup?: boolean;
		} = {}
	): Promise<TransactionResult<AtomicFileOutput>> {
		return this.execute({
			path,
			content,
			createDirectories: options.createDirectories,
			overwrite: options.overwrite,
			keepBackup: options.keepBackup
		});
	}

	/**
	 * Prepare the file write operation
	 * @param input File input
	 * @param context Transaction context
	 * @returns Whether preparation was successful
	 */
	protected async prepare(input: AtomicFileInput, context: TransactionContext): Promise<boolean> {
		try {
			// Verify the path is absolute
			if (!input.path.startsWith('/')) {
				context.log(`Path must be absolute: ${input.path}`, LogLevel.ERROR);
				return false;
			}

			// Check if target file exists
			const targetExists = this.kernel.exists(input.path);
			context.data.targetExists = targetExists;

			// If target exists and not overwriting, fail
			if (targetExists && input.overwrite !== true) {
				context.log(`Target file already exists: ${input.path}`, LogLevel.ERROR);
				return false;
			}

			// Check parent directory exists, create if needed
			const parentPath = input.path.substring(0, input.path.lastIndexOf('/')) || '/';
			const parentStats = this.kernel.stat(parentPath);

			if (!parentStats?.isDirectory) {
				if (input.createDirectories) {
					// Create parent directories
					const mkdirResult = this.kernel.mkdir(parentPath);
					if (!mkdirResult.success) {
						context.log(
							`Failed to create parent directory: ${parentPath}, error: ${mkdirResult.errorMessage}`,
							LogLevel.ERROR
						);
						return false;
					}
					context.log(`Created parent directory: ${parentPath}`, LogLevel.INFO);
				} else {
					context.log(`Parent directory does not exist: ${parentPath}`, LogLevel.ERROR);
					return false;
				}
			}

			// Generate a temporary file path
			const tempPath = `${input.path}.${Date.now()}.tmp`;
			context.data.tempPath = tempPath;

			// Generate backup file path if needed
			if (input.keepBackup && targetExists) {
				const backupPath = `${input.path}.${Date.now()}.bak`;
				context.data.backupPath = backupPath;
			}

			context.log(`Prepared to write ${input.path} via temp file ${tempPath}`, LogLevel.INFO);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			context.log(`Error in prepare phase: ${errorMessage}`, LogLevel.ERROR);
			return false;
		}
	}

	/**
	 * Commit the file write operation
	 * @param input File input
	 * @param context Transaction context
	 * @returns Whether commit was successful
	 */
	protected async commit(input: AtomicFileInput, context: TransactionContext): Promise<boolean> {
		try {
			const { tempPath } = context.data;

			// 1. Create the temporary file
			const createResult = this.kernel.create(tempPath, input.content);
			if (!createResult.success) {
				context.log(
					`Failed to create temp file: ${tempPath}, error: ${createResult.errorMessage}`,
					LogLevel.ERROR
				);
				return false;
			}

			const contentSize = JSON.stringify(input.content).length;
			context.data.bytesWritten = contentSize;
			context.log(`Wrote ${contentSize} bytes to temp file ${tempPath}`, LogLevel.DEBUG);

			// 2. Create a backup if needed
			if (context.data.targetExists && input.keepBackup && context.data.backupPath) {
				// Read existing file
				const fd = this.kernel.open(input.path);
				if (fd < 0) {
					context.log(`Failed to open target file for backup: ${input.path}`, LogLevel.ERROR);
					// Don't fail the transaction, just skip the backup
				} else {
					// Read current content
					const [readResult, existingContent] = this.kernel.read(fd);
					this.kernel.close(fd);

					if (readResult !== ErrorCode.SUCCESS) {
						context.log(
							`Failed to read target file for backup: ${input.path}, error code: ${readResult}`,
							LogLevel.ERROR
						);
					} else {
						// Create backup file
						const backupResult = this.kernel.create(context.data.backupPath, existingContent);
						if (!backupResult.success) {
							context.log(
								`Failed to create backup file: ${context.data.backupPath}, ` +
									`error: ${backupResult.errorMessage}`,
								LogLevel.ERROR
							);
						} else {
							context.log(`Created backup at ${context.data.backupPath}`, LogLevel.INFO);
						}
					}
				}
			}

			// 3. Move temp file to target
			//    Unix approach: 1. fsync temp file, 2. rename to target (atomic), 3. fsync parent dir
			//    Since we don't have direct fsync, we'll use the kernel's unlink/create pattern

			// First, unlink target if it exists
			if (context.data.targetExists) {
				const unlinkResult = this.kernel.unlink(input.path);
				if (unlinkResult !== ErrorCode.SUCCESS) {
					context.log(
						`Failed to unlink target file: ${input.path}, error code: ${unlinkResult}`,
						LogLevel.ERROR
					);
					return false;
				}
			}

			// Read temp file
			const fd = this.kernel.open(tempPath);
			if (fd < 0) {
				context.log(`Failed to open temp file for reading: ${tempPath}`, LogLevel.ERROR);
				return false;
			}

			const [readResult, tempContent] = this.kernel.read(fd);
			this.kernel.close(fd);

			if (readResult !== ErrorCode.SUCCESS) {
				context.log(
					`Failed to read temp file: ${tempPath}, error code: ${readResult}`,
					LogLevel.ERROR
				);
				return false;
			}

			// Create target file with temp content
			const targetResult = this.kernel.create(input.path, tempContent);
			if (!targetResult.success) {
				context.log(
					`Failed to create target file: ${input.path}, error: ${targetResult.errorMessage}`,
					LogLevel.ERROR
				);
				return false;
			}

			// Unlink temp file (cleanup)
			const tempUnlinkResult = this.kernel.unlink(tempPath);
			if (tempUnlinkResult !== ErrorCode.SUCCESS) {
				context.log(
					`Failed to unlink temp file: ${tempPath}, error code: ${tempUnlinkResult}`,
					LogLevel.WARNING
				);
				// Don't fail the transaction for this
			}

			context.log(`Successfully wrote file ${input.path}`, LogLevel.INFO);
			context.data.created = !context.data.targetExists;
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			context.log(`Error in commit phase: ${errorMessage}`, LogLevel.ERROR);
			return false;
		}
	}

	/**
	 * Rollback the file write operation
	 * @param input File input
	 * @param context Transaction context
	 */
	protected async rollback(input: AtomicFileInput, context: TransactionContext): Promise<void> {
		// Clean up the temp file if it exists
		if (context.data.tempPath && this.kernel.exists(context.data.tempPath)) {
			const unlinkResult = this.kernel.unlink(context.data.tempPath);
			if (unlinkResult !== ErrorCode.SUCCESS) {
				context.log(
					`Failed to clean up temp file during rollback: ${context.data.tempPath}`,
					LogLevel.WARNING
				);
			} else {
				context.log(`Cleaned up temp file: ${context.data.tempPath}`, LogLevel.DEBUG);
			}
		}

		// If we've somehow already created the target file, try to restore from backup
		if (
			!context.data.targetExists &&
			this.kernel.exists(input.path) &&
			context.data.backupPath &&
			this.kernel.exists(context.data.backupPath)
		) {
			try {
				// Read backup file
				const fd = this.kernel.open(context.data.backupPath);
				if (fd < 0) {
					context.log(
						`Failed to open backup file for rollback: ${context.data.backupPath}`,
						LogLevel.ERROR
					);
					return;
				}

				// Read backup content
				const [readResult, backupContent] = this.kernel.read(fd);
				this.kernel.close(fd);

				if (readResult !== ErrorCode.SUCCESS) {
					context.log(
						`Failed to read backup file for rollback: ${context.data.backupPath}`,
						LogLevel.ERROR
					);
					return;
				}

				// Unlink the target
				const unlinkResult = this.kernel.unlink(input.path);
				if (unlinkResult !== ErrorCode.SUCCESS) {
					context.log(
						`Failed to unlink target file during rollback: ${input.path}`,
						LogLevel.ERROR
					);
					return;
				}

				// Restore from backup
				const restoreResult = this.kernel.create(input.path, backupContent);
				if (!restoreResult.success) {
					context.log(`Failed to restore from backup: ${context.data.backupPath}`, LogLevel.ERROR);
					return;
				}

				context.log(`Restored from backup: ${context.data.backupPath}`, LogLevel.INFO);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				context.log(`Error restoring from backup: ${errorMessage}`, LogLevel.ERROR);
			}
		}
	}

	/**
	 * Get the output from the transaction context
	 * @param context Transaction context
	 * @returns Output data
	 */
	protected getOutput(context: TransactionContext): AtomicFileOutput {
		return {
			path: context.data.path,
			created: context.data.created || false,
			tempPath: context.data.tempPath,
			backupPath: context.data.backupPath,
			bytesWritten: context.data.bytesWritten
		};
	}
}

/**
 * Helper function to write a file atomically
 * @param kernel Kernel to use for file operations
 * @param path File path
 * @param content File content
 * @param options Write options
 * @returns Operation result
 */
export async function writeAtomicFile(
	kernel: GameKernel,
	path: string,
	content: any,
	options: {
		createDirectories?: boolean;
		overwrite?: boolean;
		keepBackup?: boolean;
		debug?: boolean;
	} = {}
): Promise<AtomicFileOutput> {
	const writer = new AtomicFileWriter(kernel, options.debug);
	const result = await writer.writeFile(path, content, options);

	if (!result.success) {
		throw new Error(`Failed to write file: ${result.error}`);
	}

	return result.data!;
}
