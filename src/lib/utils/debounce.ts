export function debounce<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	wait: number = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timeout: ReturnType<typeof setTimeout>;
	let pendingPromise: Promise<ReturnType<T>> | null = null;

	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		if (pendingPromise) return pendingPromise;

		pendingPromise = new Promise((resolve, reject) => {
			if (timeout) clearTimeout(timeout);

			timeout = setTimeout(async () => {
				try {
					const result = await fn(...args);
					resolve(result);
				} catch (err) {
					reject(err);
				} finally {
					pendingPromise = null;
				}
			}, wait);
		});

		return pendingPromise;
	};
}
