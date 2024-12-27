export interface OptimisticUpdateConfig<T> {
	key: string;
	execute: () => Promise<T>;
	optimisticUpdate: () => void;
	rollback: () => void;
}

export function createOptimisticUpdate<T>({
	key,
	execute,
	optimisticUpdate,
	rollback
}: OptimisticUpdateConfig<T>) {
	return {
		key,
		execute,
		optimisticUpdate,
		rollback
	};
}
