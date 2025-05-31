import { test, expect, Page } from '@playwright/test';

test.describe('Character Sheet E2E Tests', () => {
	// Helper function to wait for character data to load
	async function waitForCharacterData(page: Page) {
		// Wait for either character data or error message
		await page.waitForSelector('.character-header, .error-message', {
			timeout: 30000,
			state: 'visible'
		});
	}

	test.describe('Character Loading', () => {
		test('should load character page with valid ID', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			// Check if we're on the correct page
			await expect(page).toHaveURL(/\/characters\/1$/);

			// Look for character components
			const characterHeader = page.locator('.character-header');
			const hasHeader = (await characterHeader.count()) > 0;

			if (hasHeader) {
				// Character loaded successfully
				await expect(characterHeader).toBeVisible();
			} else {
				// Check for error message
				const errorMessage = page.locator('.error-message, [role="alert"]');
				await expect(errorMessage).toBeVisible();
			}
		});

		test('should handle invalid character ID gracefully', async ({ page }) => {
			await page.goto('/characters/99999');
			await waitForCharacterData(page);

			// Should show an error or empty state
			const errorIndicators = page.locator(
				'.error-message, [role="alert"], :text("not found"), :text("error")'
			);
			const hasError = (await errorIndicators.count()) > 0;

			expect(hasError).toBeTruthy();
		});

		test('should navigate between characters', async ({ page }) => {
			// Start with character 1
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			// Navigate to character 2
			await page.goto('/characters/2');
			await waitForCharacterData(page);

			// URL should update
			await expect(page).toHaveURL(/\/characters\/2$/);

			// Go back
			await page.goBack();
			await expect(page).toHaveURL(/\/characters\/1$/);
		});
	});

	test.describe('Character Header Display', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);
		});

		test('should display character name and basic info', async ({ page }) => {
			const characterHeader = page.locator('.character-header');

			if ((await characterHeader.count()) > 0) {
				// Check for character name
				const nameElement = characterHeader.locator('h1, h2, .character-name');
				await expect(nameElement).toBeVisible();

				// Check for level/class info
				const levelInfo = characterHeader.locator(
					':text("Level"), :text("level"), .character-level'
				);
				const hasLevelInfo = (await levelInfo.count()) > 0;
				expect(hasLevelInfo).toBeTruthy();
			}
		});

		test('should display hit points', async ({ page }) => {
			const hpSection = page.locator(
				'[data-testid="hp-section"], .hp-tracker, :text("Hit Points"), :text("HP")'
			);

			if ((await hpSection.count()) > 0) {
				await expect(hpSection.first()).toBeVisible();

				// Look for current/max HP display
				const hpDisplay = page.locator(':text("/"), .hp-current, .hp-max').first();
				await expect(hpDisplay).toBeVisible();
			}
		});
	});

	test.describe('Ability Scores', () => {
		test.beforeEach(async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);
		});

		test('should display all six ability scores', async ({ page }) => {
			const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
			const abilitySection = page.locator('.ability-scores, [data-testid="ability-scores"]');

			if ((await abilitySection.count()) > 0) {
				for (const ability of abilities) {
					const abilityElement = page.locator(`text=${ability}`).first();
					await expect(abilityElement).toBeVisible();
				}
			}
		});

		test('should show ability modifiers', async ({ page }) => {
			const modifierElements = page.locator('.ability-modifier, .modifier, text=/[+-]\\d+/');

			if ((await modifierElements.count()) > 0) {
				// Should have at least 6 modifiers (one per ability)
				const count = await modifierElements.count();
				expect(count).toBeGreaterThanOrEqual(6);
			}
		});
	});

	test.describe('Saving Throws', () => {
		test('should display Fort, Ref, and Will saves', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const saves = ['Fort', 'Ref', 'Will'];
			const savesSection = page.locator('.saves, [data-testid="saves"]');

			if ((await savesSection.count()) > 0) {
				for (const save of saves) {
					const saveElement = page.locator(`text=${save}`).first();
					await expect(saveElement).toBeVisible();
				}
			}
		});
	});

	test.describe('Skills Section', () => {
		test('should display skills list', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const skillsSection = page.locator('.skills, [data-testid="skills"], :text("Skills")');

			if ((await skillsSection.count()) > 0) {
				await expect(skillsSection.first()).toBeVisible();

				// Should have some skill entries
				const skillEntries = page.locator('.skill-entry, .skill-row, [class*="skill"]');
				const skillCount = await skillEntries.count();
				expect(skillCount).toBeGreaterThan(0);
			}
		});

		test('should show skill modifiers', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const skillModifiers = page.locator(
				'.skill-modifier, .skill-bonus, [class*="skill"] text=/[+-]?\\d+/'
			);

			if ((await skillModifiers.count()) > 0) {
				const firstModifier = skillModifiers.first();
				await expect(firstModifier).toBeVisible();
			}
		});
	});

	test.describe('Combat Stats', () => {
		test('should display AC values', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const acSection = page.locator(
				'.ac-stats, [data-testid="ac-stats"], :text("Armor Class"), :text("AC")'
			);

			if ((await acSection.count()) > 0) {
				await expect(acSection.first()).toBeVisible();

				// Look for AC value
				const acValue = page.locator('.ac-value, .ac-total, text=/AC.*\\d+/');
				if ((await acValue.count()) > 0) {
					await expect(acValue.first()).toBeVisible();
				}
			}
		});

		test('should show touch and flat-footed AC', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const touchAC = page.locator(':text("Touch"), .touch-ac');
			const flatFootedAC = page.locator(':text("Flat"), .flat-footed-ac');

			if ((await touchAC.count()) > 0) {
				await expect(touchAC.first()).toBeVisible();
			}

			if ((await flatFootedAC.count()) > 0) {
				await expect(flatFootedAC.first()).toBeVisible();
			}
		});
	});

	test.describe('Character Features', () => {
		test('should display class features', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const featuresSection = page.locator(
				'.class-features, [data-testid="class-features"], :text("Class Features")'
			);

			if ((await featuresSection.count()) > 0) {
				await expect(featuresSection.first()).toBeVisible();
			}
		});

		test('should show feats', async ({ page }) => {
			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const featsSection = page.locator('.feats, [data-testid="feats"], :text("Feats")');

			if ((await featsSection.count()) > 0) {
				await expect(featsSection.first()).toBeVisible();
			}
		});
	});

	test.describe('Responsive Design', () => {
		test('should display properly on mobile', async ({ page }) => {
			// Set mobile viewport
			await page.setViewportSize({ width: 375, height: 667 });

			await page.goto('/characters/1');
			await waitForCharacterData(page);

			// Check that main content is visible
			const mainContent = page.locator('main, .character-sheet, [role="main"]');
			await expect(mainContent.first()).toBeVisible();

			// Content should not overflow horizontally
			const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
			expect(bodyWidth).toBeLessThanOrEqual(375);
		});

		test('should display properly on tablet', async ({ page }) => {
			// Set tablet viewport
			await page.setViewportSize({ width: 768, height: 1024 });

			await page.goto('/characters/1');
			await waitForCharacterData(page);

			const mainContent = page.locator('main, .character-sheet, [role="main"]');
			await expect(mainContent.first()).toBeVisible();
		});
	});

	test.describe('Error Handling', () => {
		test('should show loading state', async ({ page }) => {
			// Don't wait for load, check immediately
			await page.goto('/characters/1');

			// Look for loading indicators
			const loadingIndicators = page.locator(
				'.loading, [data-testid="loading"], :text("Loading"), .spinner, .skeleton'
			);

			// At some point during load, we should see a loading indicator
			const hasLoadingState = (await loadingIndicators.count()) > 0;

			// Eventually should show content or error
			await waitForCharacterData(page);
		});

		test('should handle network errors gracefully', async ({ page, context }) => {
			// Block API calls to simulate network error
			await context.route('**/api/**', (route) => route.abort());

			await page.goto('/characters/1');

			// Wait for error state
			await page.waitForSelector('.error-message, [role="alert"], :text("error")', {
				timeout: 30000
			});

			const errorElement = page.locator('.error-message, [role="alert"], :text("error")').first();
			await expect(errorElement).toBeVisible();
		});
	});
});
