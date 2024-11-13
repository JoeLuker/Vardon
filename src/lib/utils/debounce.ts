export function debounce<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	wait: number = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timeout: ReturnType<typeof setTimeout>;
	let pendingPromise: Promise<ReturnType<T>> | null = null;
	let lastArgs: Parameters<T> | null = null;

	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		lastArgs = args;

		if (pendingPromise) return pendingPromise;

		pendingPromise = new Promise((resolve, reject) => {
			if (timeout) clearTimeout(timeout);

			timeout = setTimeout(async () => {
				try {
					if (lastArgs) {
						const result = await fn(...lastArgs);
						resolve(result);
					}
				} catch (err) {
					reject(err);
				} finally {
					pendingPromise = null;
					lastArgs = null;
				}
			}, wait);
		});

		return pendingPromise;
	};
}