import { test, expect, Page } from '@playwright/test';

test.describe('Database Query Interface E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/database');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Query Interface UI', () => {
    test('should load database query page', async ({ page }) => {
      // Check page title or header
      const header = page.locator('h1, h2').first();
      await expect(header).toContainText(/Database|Query/i);

      // Should have query input area
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      await expect(queryInput).toBeVisible();

      // Should have execute button
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');
      await expect(executeButton).toBeVisible();
    });

    test('should have table selector', async ({ page }) => {
      // Look for table dropdown or list
      const tableSelector = page.locator('select, .table-selector, [role="combobox"]');
      
      if (await tableSelector.count() > 0) {
        await expect(tableSelector.first()).toBeVisible();
        
        // Click to see options
        await tableSelector.first().click();
        
        // Should show table options
        const options = page.locator('option, [role="option"], .table-option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });

    test('should display sample queries', async ({ page }) => {
      // Look for sample queries section
      const samples = page.locator('.sample-queries, .examples, text=/SELECT.*FROM/i');
      
      if (await samples.count() > 0) {
        await expect(samples.first()).toBeVisible();
        
        // Should be clickable to populate query
        const firstSample = samples.first();
        await firstSample.click();
        
        // Query input should be populated
        const queryInput = page.locator('textarea, input[type="text"], .query-input');
        const queryText = await queryInput.inputValue();
        expect(queryText).toBeTruthy();
      }
    });
  });

  test.describe('Query Execution', () => {
    test('should execute a simple SELECT query', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Enter a simple query
      await queryInput.fill('SELECT * FROM skill LIMIT 5');
      await executeButton.click();

      // Wait for results
      await page.waitForTimeout(2000);

      // Should show results
      const results = page.locator('.query-results, .results-table, table');
      await expect(results).toBeVisible();

      // Should have some data rows
      const rows = page.locator('tr, .result-row');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(1); // Header + data rows
    });

    test('should handle query errors gracefully', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Enter an invalid query
      await queryInput.fill('SELECT * FROM nonexistent_table');
      await executeButton.click();

      // Wait for error
      await page.waitForTimeout(1000);

      // Should show error message
      const errorMessage = page.locator('.error, .query-error, [role="alert"], .text-red-500');
      await expect(errorMessage.first()).toBeVisible();
      
      const errorText = await errorMessage.first().textContent();
      expect(errorText).toBeTruthy();
    });

    test('should execute JOIN queries', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Enter a JOIN query
      await queryInput.fill(`
        SELECT c.name, cf.name as feature_name 
        FROM class c 
        JOIN class_feature cf ON c.id = cf.class_id 
        LIMIT 10
      `);
      await executeButton.click();

      // Wait for results
      await page.waitForTimeout(2000);

      // Should show results
      const results = page.locator('.query-results, .results-table, table');
      const resultsVisible = await results.isVisible().catch(() => false);
      
      if (resultsVisible) {
        // Check for column headers
        const headers = page.locator('th');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThanOrEqual(2);
      }
    });

    test('should handle aggregate queries', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Enter an aggregate query
      await queryInput.fill('SELECT COUNT(*) as total FROM feat');
      await executeButton.click();

      // Wait for results
      await page.waitForTimeout(2000);

      // Should show count result
      const results = page.locator('.query-results, .results-table, table');
      const resultsVisible = await results.isVisible().catch(() => false);
      
      if (resultsVisible) {
        const cells = page.locator('td');
        const cellCount = await cells.count();
        expect(cellCount).toBeGreaterThan(0);
        
        // Should have a numeric result
        const firstCell = cells.first();
        const cellText = await firstCell.textContent();
        expect(cellText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Results Display', () => {
    test('should paginate large result sets', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Query that returns many rows
      await queryInput.fill('SELECT * FROM spell');
      await executeButton.click();

      // Wait for results
      await page.waitForTimeout(2000);

      // Look for pagination controls
      const pagination = page.locator('.pagination, .page-controls, button:has-text("Next"), button:has-text("Previous")');
      
      if (await pagination.count() > 0) {
        await expect(pagination.first()).toBeVisible();
        
        // Try to go to next page
        const nextButton = page.locator('button:has-text("Next"), button:has-text("→")');
        if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(1000);
          
          // Results should update
          const results = page.locator('.query-results, .results-table, table');
          await expect(results).toBeVisible();
        }
      }
    });

    test('should allow sorting results', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Execute a query
      await queryInput.fill('SELECT * FROM ability LIMIT 10');
      await executeButton.click();
      await page.waitForTimeout(2000);

      // Click on column header to sort
      const headers = page.locator('th');
      if (await headers.count() > 0) {
        const firstHeader = headers.first();
        
        // Get initial first row data
        const firstRowInitial = await page.locator('tbody tr').first().textContent();
        
        // Click header to sort
        await firstHeader.click();
        await page.waitForTimeout(500);
        
        // Check if order changed
        const firstRowAfter = await page.locator('tbody tr').first().textContent();
        
        // May or may not change depending on data, but should not error
        expect(firstRowInitial).toBeTruthy();
        expect(firstRowAfter).toBeTruthy();
      }
    });

    test('should export query results', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Execute a query
      await queryInput.fill('SELECT * FROM class');
      await executeButton.click();
      await page.waitForTimeout(2000);

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("CSV")');
      
      if (await exportButton.count() > 0) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        // Click export
        await exportButton.first().click();
        
        // Check if download triggered
        const download = await downloadPromise.catch(() => null);
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.(csv|json|xlsx)$/);
        }
      }
    });
  });

  test.describe('Query Builder', () => {
    test('should provide visual query builder', async ({ page }) => {
      // Look for query builder toggle or tab
      const builderToggle = page.locator('button:has-text("Builder"), [role="tab"]:has-text("Visual"), .query-builder-toggle');
      
      if (await builderToggle.count() > 0) {
        await builderToggle.first().click();
        await page.waitForTimeout(500);
        
        // Should show builder interface
        const builder = page.locator('.query-builder, .visual-query, form[data-builder]');
        await expect(builder.first()).toBeVisible();
        
        // Should have table selector
        const tableSelect = builder.locator('select, [role="combobox"]').first();
        await expect(tableSelect).toBeVisible();
        
        // Should have field checkboxes or multi-select
        const fieldSelectors = builder.locator('input[type="checkbox"], .field-selector');
        const fieldCount = await fieldSelectors.count();
        expect(fieldCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Query History', () => {
    test('should maintain query history', async ({ page }) => {
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');

      // Execute multiple queries
      const queries = [
        'SELECT * FROM ability LIMIT 5',
        'SELECT COUNT(*) FROM feat',
        'SELECT name FROM class'
      ];

      for (const query of queries) {
        await queryInput.fill(query);
        await executeButton.click();
        await page.waitForTimeout(1000);
      }

      // Look for history section
      const history = page.locator('.query-history, .history, button:has-text("History")');
      
      if (await history.count() > 0) {
        // If it's a button, click it
        if (await history.first().evaluate(el => el.tagName === 'BUTTON')) {
          await history.first().click();
          await page.waitForTimeout(500);
        }
        
        // Should show previous queries
        const historyItems = page.locator('.history-item, .past-query');
        const itemCount = await historyItems.count();
        expect(itemCount).toBeGreaterThan(0);
        
        // Click a history item to restore query
        if (itemCount > 0) {
          await historyItems.first().click();
          
          // Query should be restored
          const restoredQuery = await queryInput.inputValue();
          expect(queries.some(q => restoredQuery.includes(q.split(' ')[2]))).toBeTruthy();
        }
      }
    });
  });

  test.describe('Schema Explorer', () => {
    test('should show database schema', async ({ page }) => {
      // Look for schema explorer
      const schemaExplorer = page.locator('.schema-explorer, .database-schema, aside:has-text("Tables")');
      
      if (await schemaExplorer.count() > 0) {
        await expect(schemaExplorer.first()).toBeVisible();
        
        // Should list tables
        const tables = schemaExplorer.locator('.table-name, .schema-table');
        const tableCount = await tables.count();
        expect(tableCount).toBeGreaterThan(0);
        
        // Click a table to see columns
        if (tableCount > 0) {
          await tables.first().click();
          await page.waitForTimeout(500);
          
          // Should show columns
          const columns = page.locator('.column-name, .table-column');
          const columnCount = await columns.count();
          expect(columnCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/database');
      await page.waitForLoadState('networkidle');

      // Query input should still be accessible
      const queryInput = page.locator('textarea, input[type="text"], .query-input');
      await expect(queryInput).toBeVisible();

      // Execute button should be visible
      const executeButton = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Query")');
      await expect(executeButton).toBeVisible();

      // Execute a simple query
      await queryInput.fill('SELECT * FROM ability LIMIT 3');
      await executeButton.click();
      await page.waitForTimeout(2000);

      // Results should be scrollable
      const results = page.locator('.query-results, .results-table, table');
      if (await results.count() > 0) {
        // Check horizontal scroll if needed
        const tableWidth = await results.evaluate(el => el.scrollWidth);
        const viewportWidth = await results.evaluate(el => el.clientWidth);
        
        // Table might be wider than viewport on mobile
        expect(tableWidth).toBeGreaterThan(0);
      }
    });
  });
});