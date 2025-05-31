/**
 * BrowserStorage.ts - Storage Adapter for Browser Environments
 *
 * This implements a storage adapter that works with browser storage mechanisms:
 * - localStorage for small data and fast access
 * - IndexedDB for larger data and structured storage
 *
 * It provides an abstraction layer for the filesystem to use either storage
 * mechanism transparently with proper fallbacks.
 */

/**
 * Storage interface that both implementations must provide
 */
export interface StorageAdapter {
	/**
	 * Get a value from storage
	 * @param key Storage key
	 * @returns The value, or null if not found
	 */
	getItem(key: string): Promise<any>;

	/**
	 * Set a value in storage
	 * @param key Storage key
	 * @param value Value to store
	 */
	setItem(key: string, value: any): Promise<void>;

	/**
	 * Remove a value from storage
	 * @param key Storage key
	 */
	removeItem(key: string): Promise<void>;

	/**
	 * Clear all values from storage
	 */
	clear(): Promise<void>;

	/**
	 * Check if a key exists in storage
	 * @param key Storage key
	 * @returns Whether the key exists
	 */
	hasKey(key: string): Promise<boolean>;
}

/**
 * LocalStorage adapter - simple but limited to ~5MB and string values
 */
class LocalStorageAdapter implements StorageAdapter {
	constructor(private readonly prefix: string = 'vardon_fs_') {}

	async getItem(key: string): Promise<any> {
		const prefixedKey = this.prefix + key;
		const value = localStorage.getItem(prefixedKey);

		if (value === null) return null;

		try {
			return JSON.parse(value);
		} catch (e) {
			console.error(`Failed to parse localStorage value for key ${key}`, e);
			return null;
		}
	}

	async setItem(key: string, value: any): Promise<void> {
		const prefixedKey = this.prefix + key;
		try {
			const serialized = JSON.stringify(value);
			localStorage.setItem(prefixedKey, serialized);
		} catch (e) {
			console.error(`Failed to set localStorage value for key ${key}`, e);
			throw new Error(`LocalStorage write failed: ${e instanceof Error ? e.message : String(e)}`);
		}
	}

	async removeItem(key: string): Promise<void> {
		const prefixedKey = this.prefix + key;
		localStorage.removeItem(prefixedKey);
	}

	async clear(): Promise<void> {
		// Only clear keys with our prefix
		const keysToRemove: string[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.prefix)) {
				keysToRemove.push(key);
			}
		}

		for (const key of keysToRemove) {
			localStorage.removeItem(key);
		}
	}

	async hasKey(key: string): Promise<boolean> {
		const prefixedKey = this.prefix + key;
		return localStorage.getItem(prefixedKey) !== null;
	}
}

/**
 * IndexedDB adapter - more sophisticated with larger storage limits
 */
class IndexedDBAdapter implements StorageAdapter {
	private db: IDBDatabase | null = null;
	private readonly dbName: string;
	private readonly storeName: string = 'filesystem';
	private dbPromise: Promise<IDBDatabase> | null = null;

	constructor(dbName: string = 'vardon_filesystem') {
		this.dbName = dbName;
	}

	/**
	 * Initialize the database connection
	 */
	private initDB(): Promise<IDBDatabase> {
		if (this.db) return Promise.resolve(this.db);
		if (this.dbPromise) return this.dbPromise;

		this.dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 1);

			request.onerror = (event) => {
				console.error('IndexedDB open error:', event);
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = (event) => {
				this.db = request.result;
				resolve(this.db);
			};

			request.onupgradeneeded = (event) => {
				const db = request.result;
				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};
		});

		return this.dbPromise;
	}

	/**
	 * Get a transaction for the object store
	 * @param mode Transaction mode
	 * @returns A transaction object
	 */
	private async getTransaction(mode: IDBTransactionMode = 'readonly'): Promise<IDBTransaction> {
		const db = await this.initDB();
		return db.transaction(this.storeName, mode);
	}

	/**
	 * Get the object store
	 * @param mode Transaction mode
	 * @returns The object store
	 */
	private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
		const transaction = await this.getTransaction(mode);
		return transaction.objectStore(this.storeName);
	}

	async getItem(key: string): Promise<any> {
		try {
			const store = await this.getStore('readonly');
			return new Promise((resolve, reject) => {
				const request = store.get(key);

				request.onsuccess = () => {
					resolve(request.result);
				};

				request.onerror = (event) => {
					console.error(`Failed to get item with key ${key}:`, event);
					reject(new Error(`IndexedDB read failed for key ${key}`));
				};
			});
		} catch (error) {
			console.error(`Error accessing IndexedDB for key ${key}:`, error);
			return null;
		}
	}

	async setItem(key: string, value: any): Promise<void> {
		try {
			const store = await this.getStore('readwrite');
			return new Promise((resolve, reject) => {
				const request = store.put(value, key);

				request.onsuccess = () => {
					resolve();
				};

				request.onerror = (event) => {
					console.error(`Failed to set item with key ${key}:`, event);
					reject(new Error(`IndexedDB write failed for key ${key}`));
				};
			});
		} catch (error) {
			console.error(`Error writing to IndexedDB for key ${key}:`, error);
			throw new Error(
				`IndexedDB write failed: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	async removeItem(key: string): Promise<void> {
		try {
			const store = await this.getStore('readwrite');
			return new Promise((resolve, reject) => {
				const request = store.delete(key);

				request.onsuccess = () => {
					resolve();
				};

				request.onerror = (event) => {
					console.error(`Failed to remove item with key ${key}:`, event);
					reject(new Error(`IndexedDB delete failed for key ${key}`));
				};
			});
		} catch (error) {
			console.error(`Error removing from IndexedDB for key ${key}:`, error);
		}
	}

	async clear(): Promise<void> {
		try {
			const store = await this.getStore('readwrite');
			return new Promise((resolve, reject) => {
				const request = store.clear();

				request.onsuccess = () => {
					resolve();
				};

				request.onerror = (event) => {
					console.error('Failed to clear IndexedDB store:', event);
					reject(new Error('IndexedDB clear failed'));
				};
			});
		} catch (error) {
			console.error('Error clearing IndexedDB:', error);
		}
	}

	async hasKey(key: string): Promise<boolean> {
		try {
			const store = await this.getStore('readonly');
			return new Promise((resolve, reject) => {
				const request = store.count(key);

				request.onsuccess = () => {
					resolve(request.result > 0);
				};

				request.onerror = (event) => {
					console.error(`Failed to check for key ${key}:`, event);
					reject(new Error(`IndexedDB key check failed for key ${key}`));
				};
			});
		} catch (error) {
			console.error(`Error checking IndexedDB for key ${key}:`, error);
			return false;
		}
	}
}

/**
 * Combined storage adapter with automatic fallback
 * Uses IndexedDB with localStorage as fallback
 */
export class BrowserStorage implements StorageAdapter {
	private readonly indexedDB: IndexedDBAdapter;
	private readonly localStorage: LocalStorageAdapter;
	private useLocalStorage: boolean = false;
	private initialized: boolean = false;

	constructor() {
		this.indexedDB = new IndexedDBAdapter();
		this.localStorage = new LocalStorageAdapter();
	}

	/**
	 * Initialize the storage adapter
	 */
	async initialize(): Promise<void> {
		// Test IndexedDB availability
		try {
			await this.indexedDB.setItem('__test__', { test: 'value' });
			await this.indexedDB.removeItem('__test__');
			this.useLocalStorage = false;
		} catch (error) {
			// Fallback to localStorage
			console.warn('IndexedDB unavailable, falling back to localStorage');
			this.useLocalStorage = true;

			// Test localStorage
			try {
				await this.localStorage.setItem('__test__', { test: 'value' });
				await this.localStorage.removeItem('__test__');
			} catch (error) {
				console.error('Browser storage is completely unavailable');
				throw new Error('No storage mechanism available');
			}
		}

		this.initialized = true;
	}

	/**
	 * Get the appropriate storage adapter
	 */
	private getStorage(): StorageAdapter {
		if (!this.initialized) {
			throw new Error('BrowserStorage not initialized');
		}

		return this.useLocalStorage ? this.localStorage : this.indexedDB;
	}

	async getItem(key: string): Promise<any> {
		return this.getStorage().getItem(key);
	}

	async setItem(key: string, value: any): Promise<void> {
		return this.getStorage().setItem(key, value);
	}

	async removeItem(key: string): Promise<void> {
		return this.getStorage().removeItem(key);
	}

	async clear(): Promise<void> {
		return this.getStorage().clear();
	}

	async hasKey(key: string): Promise<boolean> {
		return this.getStorage().hasKey(key);
	}

	/**
	 * Check if browser storage is available
	 * @returns Whether browser storage is available
	 */
	static isAvailable(): boolean {
		// Check for localStorage
		try {
			if (typeof localStorage === 'undefined') {
				return false;
			}

			localStorage.setItem('__storage_test__', 'yes');
			localStorage.removeItem('__storage_test__');
		} catch (e) {
			return false;
		}

		// Check for IndexedDB (optional)
		return typeof indexedDB !== 'undefined';
	}
}
