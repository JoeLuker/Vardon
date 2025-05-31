import { test, expect } from '@playwright/test';

test.describe('Basic Vardon Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page has loaded
    await expect(page).toHaveURL(/.*localhost:5173/);
    
    // Look for any content that indicates the app loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('can navigate to diagnostics', async ({ page }) => {
    await page.goto('/diagnostics');
    
    // Should be on diagnostics page
    await expect(page).toHaveURL(/.*\/diagnostics/);
    
    // Page should have some content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});