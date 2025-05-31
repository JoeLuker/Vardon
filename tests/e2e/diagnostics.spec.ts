import { test, expect } from '@playwright/test';

test.describe('Diagnostics Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the diagnostics page
    await page.goto('/diagnostics');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load diagnostics page', async ({ page }) => {
    // Check that the page has the correct title
    await expect(page.locator('h1')).toContainText('System Diagnostics');
    
    // Check for the info box
    await expect(page.locator('.bg-blue-50')).toContainText('This page helps diagnose character loading issues');
  });

  test('should initialize system components', async ({ page }) => {
    // Wait for initialization to complete
    await page.waitForTimeout(2000); // Give system time to initialize
    
    // Check for system initialization section
    await expect(page.locator('h2').first()).toContainText('System Initialization');
    
    // Look for success indicators
    const successItems = page.locator('.bg-green-50');
    const count = await successItems.count();
    
    // Should have at least some successful initializations
    expect(count).toBeGreaterThan(0);
    
    // Check for specific initialization steps
    const kernelInit = page.locator('text=Kernel initialization');
    await expect(kernelInit).toBeVisible();
    
    const dirCreation = page.locator('text=Directory creation');
    await expect(dirCreation).toBeVisible();
  });

  test('should test character loading', async ({ page }) => {
    // Wait for system to initialize
    await page.waitForTimeout(3000);
    
    // Count initial results before clicking
    const characterSection = page.locator('h2:has-text("Character Loading Test")').locator('..').locator('..');
    const resultElements = characterSection.locator('.p-2.border.rounded');
    const initialCount = await resultElements.count();
    
    // Find and click the test loading button
    const testButton = page.locator('button:has-text("Test Loading")');
    
    // Wait for button to be enabled
    await expect(testButton).toBeEnabled({ timeout: 15000 });
    
    // Click the test button
    await testButton.click();
    
    // Wait for character loading results
    await page.waitForTimeout(2000);
    
    // Check that we have more results than before (indicating a new test was run)
    const newCount = await resultElements.count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should show console output', async ({ page }) => {
    // Click the show console button
    const consoleButton = page.locator('button:has-text("Show Console")');
    await consoleButton.click();
    
    // Check that console output is visible
    const consoleOutput = page.locator('.bg-black.text-green-400');
    await expect(consoleOutput).toBeVisible();
    
    // Should have some console content
    const consoleContent = await consoleOutput.textContent();
    expect(consoleContent).toBeTruthy();
  });

  test('should handle different character IDs', async ({ page }) => {
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    // Change character ID
    const input = page.locator('input[type="number"]');
    await input.clear();
    await input.fill('2');
    
    // Verify the input value changed
    await expect(input).toHaveValue('2');
    
    // Click test button
    const testButton = page.locator('button:has-text("Test Loading")');
    await expect(testButton).toBeEnabled({ timeout: 15000 });
    await testButton.click();
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Check that a test was run (we don't care about the specific text)
    const characterSection = page.locator('h2:has-text("Character Loading Test")').locator('..').locator('..');
    const resultElements = characterSection.locator('.p-2.border.rounded');
    
    // Should have results after clicking the test button
    const count = await resultElements.count();
    expect(count).toBeGreaterThan(0);
  });
});