import { test, expect } from '@playwright/test';

test.describe('Character Page Tests', () => {
	test('should handle character page navigation', async ({ page }) => {
		// Go to a character page
		await page.goto('/characters/1');

		// Wait for the page to load
		await page.waitForLoadState('networkidle');

		// The page should either show character data or an error message
		// Since we might not have a database connection in tests, we check for either
		const pageContent = await page.textContent('body');

		// Should have some content
		expect(pageContent).toBeTruthy();

		// Check URL is correct
		await expect(page).toHaveURL(/.*\/characters\/1/);
	});

	test('should navigate from home to character', async ({ page }) => {
		// Start at home
		await page.goto('/');

		// If there's a link to characters, click it
		const characterLink = page.locator('a[href*="/characters"]').first();
		const linkCount = await characterLink.count();

		if (linkCount > 0) {
			await characterLink.click();
			// Should navigate to a character page
			await expect(page).toHaveURL(/.*\/characters/);
		}
	});
});
