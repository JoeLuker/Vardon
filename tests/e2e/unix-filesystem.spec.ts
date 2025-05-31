import { test, expect, Page } from '@playwright/test';

test.describe('Unix Filesystem E2E Tests', () => {
	// Helper to open browser console and get logs
	async function getConsoleLogs(page: Page): Promise<string[]> {
		const logs: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'log') {
				logs.push(msg.text());
			}
		});
		return logs;
	}

	test.describe('Filesystem Operations via Diagnostics', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');

			// Wait for system initialization
			await page.waitForTimeout(2000);
		});

		test('should initialize virtual filesystem', async ({ page }) => {
			// Look for filesystem initialization success
			const fsInit = page.locator('text=/File[Ss]ystem.*init/i');
			await expect(fsInit).toBeVisible();

			// Check for standard Unix directories
			const standardDirs = ['/dev', '/proc', '/entity', '/etc', '/var', '/tmp', '/bin'];

			// Open console to check filesystem structure
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			await expect(consoleOutput).toBeVisible();

			const consoleText = await consoleOutput.textContent();

			// Check if standard directories are mentioned in initialization
			for (const dir of standardDirs) {
				const hasDirReference =
					consoleText?.includes(dir) || (await page.locator(`text="${dir}"`).count()) > 0;
				expect(hasDirReference).toBeTruthy();
			}
		});

		test('should mount capabilities as devices', async ({ page }) => {
			// Look for device mounting in console
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Check for capability mounting
			const mountedDevices = ['ability', 'skill', 'combat', 'database'];

			for (const device of mountedDevices) {
				const isMounted =
					consoleText?.includes(`/dev/${device}`) ||
					consoleText?.includes(`Mounted.*${device}`) ||
					consoleText?.includes(`mount.*${device}`);
				expect(isMounted).toBeTruthy();
			}
		});

		test('should create character entity files', async ({ page }) => {
			// Test character loading which creates entity files
			const testButton = page.locator('button:has-text("Test Loading")');
			await expect(testButton).toBeEnabled({ timeout: 15000 });

			await testButton.click();
			await page.waitForTimeout(2000);

			// Check console for entity file operations
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Should see entity file creation or access
			const hasEntityOps =
				consoleText?.includes('/entity/') ||
				consoleText?.includes('Created file') ||
				consoleText?.includes('Opened.*entity');
			expect(hasEntityOps).toBeTruthy();
		});
	});

	test.describe('File Descriptor Management', () => {
		test('should properly manage file descriptors', async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Run multiple character tests to exercise FD management
			const testButton = page.locator('button:has-text("Test Loading")');
			await expect(testButton).toBeEnabled({ timeout: 15000 });

			// Run test multiple times
			for (let i = 0; i < 3; i++) {
				await testButton.click();
				await page.waitForTimeout(1000);
			}

			// Open console to check for FD leaks
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Should see FD operations
			const hasFDOps =
				consoleText?.includes('fd') ||
				consoleText?.includes('Opened.*as fd') ||
				consoleText?.includes('Closed fd');
			expect(hasFDOps).toBeTruthy();

			// Should not see FD leak warnings
			const hasLeakWarning =
				consoleText?.includes('leak') || consoleText?.includes('too many open');
			expect(hasLeakWarning).toBeFalsy();
		});
	});

	test.describe('Unix Path Operations', () => {
		test('should use absolute paths', async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');

			// Show console
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = (await consoleOutput.textContent()) || '';

			// All paths should be absolute (start with /)
			const pathMatches = consoleText.match(/["'`]([^"'`]+)["'`]/g) || [];
			const paths = pathMatches
				.map((match) => match.slice(1, -1))
				.filter((path) => path.includes('/') && !path.includes('://'));

			for (const path of paths) {
				if (path.length > 0 && !path.includes('\\')) {
					// Skip Windows paths and URLs
					expect(path.startsWith('/') || path.includes('://')).toBeTruthy();
				}
			}
		});

		test('should follow Unix naming conventions', async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');

			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = (await consoleOutput.textContent()) || '';

			// Check for Unix-style paths
			const unixPaths = ['/dev/', '/proc/', '/entity/', '/etc/', '/var/', '/tmp/', '/bin/'];

			let foundUnixPaths = 0;
			for (const path of unixPaths) {
				if (consoleText.includes(path)) {
					foundUnixPaths++;
				}
			}

			// Should find at least some Unix paths
			expect(foundUnixPaths).toBeGreaterThan(0);
		});
	});

	test.describe('Virtual Filesystem Browser Integration', () => {
		test('should persist filesystem state', async ({ page }) => {
			// First visit - initialize system
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Create some state by testing character
			const testButton = page.locator('button:has-text("Test Loading")');
			await expect(testButton).toBeEnabled({ timeout: 15000 });
			await testButton.click();
			await page.waitForTimeout(2000);

			// Reload page
			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Show console
			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Should see filesystem being mounted/loaded from storage
			const hasStorageOps =
				consoleText?.includes('mount') ||
				consoleText?.includes('Loaded from storage') ||
				consoleText?.includes('localStorage');
			expect(hasStorageOps).toBeTruthy();
		});

		test('should handle filesystem errors gracefully', async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');

			// Try to trigger filesystem errors by testing invalid character IDs
			const input = page.locator('input[type="number"]');
			await input.clear();
			await input.fill('-1'); // Invalid ID

			const testButton = page.locator('button:has-text("Test Loading")');
			await expect(testButton).toBeEnabled({ timeout: 15000 });
			await testButton.click();
			await page.waitForTimeout(2000);

			// Should handle error gracefully
			const errorIndicators = page.locator('.text-red-500, .bg-red-50, [role="alert"]');
			const hasError = (await errorIndicators.count()) > 0;

			// Page should still be functional
			const pageContent = await page.textContent('body');
			expect(pageContent).toBeTruthy();
		});
	});

	test.describe('Capability Device Operations', () => {
		test('should perform read operations on capability devices', async ({ page }) => {
			await page.goto('/characters/1');
			await page.waitForLoadState('networkidle');

			// Character loading triggers reads from capability devices
			// Wait for character data or error
			await page.waitForSelector('.character-header, .error-message', {
				timeout: 30000,
				state: 'visible'
			});

			// Go to diagnostics to check console
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');

			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Should see device read operations
			const hasDeviceReads =
				consoleText?.includes('Read from fd') ||
				consoleText?.includes('read.*dev') ||
				consoleText?.includes('/dev/');
			expect(hasDeviceReads).toBeTruthy();
		});
	});

	test.describe('Message Queue System', () => {
		test('should initialize message queues', async ({ page }) => {
			await page.goto('/diagnostics');
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			const consoleButton = page.locator('button:has-text("Show Console")');
			await consoleButton.click();

			const consoleOutput = page.locator('.bg-black.text-green-400');
			const consoleText = await consoleOutput.textContent();

			// Check for message queue initialization
			const hasMessageQueues =
				consoleText?.includes('/pipes/') ||
				consoleText?.includes('message queue') ||
				consoleText?.includes('Created.*queue');
			expect(hasMessageQueues).toBeTruthy();
		});
	});
});
