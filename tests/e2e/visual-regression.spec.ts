import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * These tests capture screenshots of key UI components and compare them
 * against baseline images to detect unintended visual changes.
 */

test.describe('Visual Regression Tests', () => {
  // Helper to wait for animations to complete
  async function waitForAnimations(page) {
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    });
  }

  test.describe('Character Sheet Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });
      await waitForAnimations(page);
    });

    test('character header appearance', async ({ page }) => {
      const header = page.locator('.character-header, header, [data-testid="character-header"]').first();
      
      if (await header.count() > 0) {
        await expect(header).toHaveScreenshot('character-header.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });

    test('ability scores section', async ({ page }) => {
      const abilitySection = page.locator('.ability-scores, [data-testid="ability-scores"]').first();
      
      if (await abilitySection.count() > 0) {
        await expect(abilitySection).toHaveScreenshot('ability-scores.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });

    test('skills section', async ({ page }) => {
      const skillsSection = page.locator('.skills, [data-testid="skills"]').first();
      
      if (await skillsSection.count() > 0) {
        // Scroll to skills if needed
        await skillsSection.scrollIntoViewIfNeeded();
        await waitForAnimations(page);
        
        await expect(skillsSection).toHaveScreenshot('skills-section.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });

    test('combat stats section', async ({ page }) => {
      const combatSection = page.locator('.ac-stats, .combat-stats, [data-testid="combat-stats"]').first();
      
      if (await combatSection.count() > 0) {
        await combatSection.scrollIntoViewIfNeeded();
        await waitForAnimations(page);
        
        await expect(combatSection).toHaveScreenshot('combat-stats.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });

    test('saving throws section', async ({ page }) => {
      const savesSection = page.locator('.saves, [data-testid="saves"]').first();
      
      if (await savesSection.count() > 0) {
        await savesSection.scrollIntoViewIfNeeded();
        await waitForAnimations(page);
        
        await expect(savesSection).toHaveScreenshot('saving-throws.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });

    test('full character sheet', async ({ page }) => {
      // Take a full page screenshot
      await expect(page).toHaveScreenshot('full-character-sheet.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });
  });

  test.describe('Component State Visual Tests', () => {
    test('HP tracker states', async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });

      const hpTracker = page.locator('.hp-tracker, [data-testid="hp-tracker"]').first();
      
      if (await hpTracker.count() > 0) {
        // Full HP state
        await expect(hpTracker).toHaveScreenshot('hp-tracker-full.png', {
          maxDiffPixels: 50,
          animations: 'disabled'
        });

        // Apply some damage
        const damageInput = page.locator('input[placeholder*="damage"]').first();
        const applyButton = page.locator('button:has-text("Apply")').first();
        
        if (await damageInput.count() > 0 && await applyButton.count() > 0) {
          await damageInput.fill('10');
          await applyButton.click();
          await waitForAnimations(page);
          
          // Damaged state
          await expect(hpTracker).toHaveScreenshot('hp-tracker-damaged.png', {
            maxDiffPixels: 50,
            animations: 'disabled'
          });
        }
      }
    });

    test('expanded vs collapsed sections', async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });

      const collapsibleSection = page.locator('[aria-expanded], .collapsible').first();
      
      if (await collapsibleSection.count() > 0) {
        // Capture expanded state
        await expect(collapsibleSection).toHaveScreenshot('section-expanded.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });

        // Collapse it
        const header = collapsibleSection.locator('.collapsible-header, [aria-expanded]').first();
        await header.click();
        await waitForAnimations(page);
        
        // Capture collapsed state
        await expect(collapsibleSection).toHaveScreenshot('section-collapsed.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    test('mobile character sheet', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('character-sheet-mobile.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });

    test('tablet character sheet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('character-sheet-tablet.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });

    test('desktop character sheet', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('character-sheet-desktop.png', {
        fullPage: false, // Just viewport
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });
  });

  test.describe('Theme Visual Tests', () => {
    test('light theme character sheet', async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });

      // Ensure light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('character-sheet-light.png', {
        fullPage: false,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });

    test('dark theme character sheet', async ({ page }) => {
      await page.goto('/characters/1');
      await page.waitForSelector('.character-header, .error-message', { 
        timeout: 30000,
        state: 'visible' 
      });

      // Switch to dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('character-sheet-dark.png', {
        fullPage: false,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });
  });

  test.describe('Diagnostics Page Visual Tests', () => {
    test('diagnostics page layout', async ({ page }) => {
      await page.goto('/diagnostics');
      await page.waitForLoadState('networkidle');
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('diagnostics-page.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });

    test('console output appearance', async ({ page }) => {
      await page.goto('/diagnostics');
      await page.waitForLoadState('networkidle');
      
      // Show console
      const consoleButton = page.locator('button:has-text("Show Console")');
      await consoleButton.click();
      await waitForAnimations(page);

      const consoleOutput = page.locator('.bg-black.text-green-400');
      await expect(consoleOutput).toHaveScreenshot('console-output.png', {
        maxDiffPixels: 100,
        animations: 'disabled'
      });
    });
  });

  test.describe('Database Query Page Visual Tests', () => {
    test('database query interface', async ({ page }) => {
      await page.goto('/database');
      await page.waitForLoadState('networkidle');
      await waitForAnimations(page);

      await expect(page).toHaveScreenshot('database-query-page.png', {
        fullPage: true,
        maxDiffPixels: 200,
        animations: 'disabled'
      });
    });

    test('query results table', async ({ page }) => {
      await page.goto('/database');
      await page.waitForLoadState('networkidle');

      // Execute a query
      const queryInput = page.locator('textarea, .query-input').first();
      const executeButton = page.locator('button:has-text("Execute")').first();
      
      await queryInput.fill('SELECT * FROM ability LIMIT 5');
      await executeButton.click();
      await page.waitForTimeout(2000);
      await waitForAnimations(page);

      const results = page.locator('.query-results, .results-table').first();
      if (await results.count() > 0) {
        await expect(results).toHaveScreenshot('query-results.png', {
          maxDiffPixels: 100,
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('character not found error', async ({ page }) => {
      await page.goto('/characters/99999');
      await page.waitForSelector('.error-message, [role="alert"]', { 
        timeout: 30000,
        state: 'visible' 
      });
      await waitForAnimations(page);

      const errorSection = page.locator('.error-message, [role="alert"]').first();
      await expect(errorSection).toHaveScreenshot('character-not-found.png', {
        maxDiffPixels: 100,
        animations: 'disabled'
      });
    });

    test('network error state', async ({ page, context }) => {
      // Block API calls
      await context.route('**/api/**', route => route.abort());
      
      await page.goto('/characters/1');
      await page.waitForSelector('.error-message, [role="alert"]', { 
        timeout: 30000
      });
      await waitForAnimations(page);

      const errorSection = page.locator('.error-message, [role="alert"]').first();
      await expect(errorSection).toHaveScreenshot('network-error.png', {
        maxDiffPixels: 100,
        animations: 'disabled'
      });
    });
  });
});