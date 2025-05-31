# Vardon E2E Tests

This directory contains comprehensive end-to-end tests for the Vardon Pathfinder Character Manager using Playwright.

## Test Structure

### Core Test Suites

1. **basic.spec.ts** - Basic smoke tests for app loading
2. **character.spec.ts** - Simple character page navigation tests
3. **character-sheet.spec.ts** - Comprehensive character sheet display tests
4. **character-interactions.spec.ts** - Interactive elements testing (HP tracker, tabs, forms)
5. **unix-filesystem.spec.ts** - Unix filesystem architecture validation
6. **database-query.spec.ts** - Database query interface testing
7. **diagnostics.spec.ts** - System diagnostics page tests
8. **visual-regression.spec.ts** - Visual regression tests with screenshots

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### Specific Test Suite

```bash
npm run test:e2e -- tests/e2e/character-sheet.spec.ts
```

### With UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)

```bash
npm run test:e2e -- --headed
```

### Debug Mode

```bash
npm run test:e2e -- --debug
```

### Single Browser

```bash
npm run test:e2e -- --project=chromium
```

## Visual Regression Tests

Visual tests capture screenshots and compare against baselines.

### Update Screenshots

```bash
npm run test:e2e -- --update-snapshots
```

### View Differences

After a failed visual test, view the report:

```bash
npx playwright show-report
```

## Test Categories

### Smoke Tests

Quick tests to ensure basic functionality:

- App loads
- Navigation works
- No console errors

### Functional Tests

Detailed testing of features:

- Character data display
- HP tracking
- Skill calculations
- Combat stats

### Integration Tests

Unix filesystem integration:

- Virtual filesystem operations
- Capability mounting
- File descriptor management
- Message queues

### Visual Tests

UI consistency:

- Component appearance
- Responsive design
- Theme switching
- Error states

## Best Practices

1. **Wait for Content**: Always wait for character data or error messages
2. **Handle Both States**: Tests should handle both success and error cases
3. **Mobile Testing**: Include mobile viewport tests
4. **Accessibility**: Test keyboard navigation and ARIA attributes
5. **Performance**: Use appropriate timeouts and wait strategies

## Debugging Failed Tests

1. **Screenshots**: Check `test-results/` folder for failure screenshots
2. **Traces**: Enable tracing for detailed debugging:
   ```bash
   npm run test:e2e -- --trace on
   ```
3. **Videos**: Record test execution:
   ```bash
   npm run test:e2e -- --video on
   ```

## CI/CD Integration

Tests are configured to run in CI with:

- Retry on failure (2 attempts)
- Single worker to avoid conflicts
- HTML report generation

## Common Issues

### Local Database

Tests may fail if local database is not running. Start with:

```bash
supabase start
```

### Character IDs

Tests use character IDs 1 and 2. Ensure test data exists.

### Timeouts

Increase timeouts for slow connections:

```javascript
test.setTimeout(60000); // 60 seconds
```

## Adding New Tests

1. Create new `.spec.ts` file in `tests/e2e/`
2. Import Playwright test utilities
3. Use descriptive test names
4. Group related tests with `test.describe()`
5. Add appropriate waits and assertions
6. Handle both success and error cases

## Test Data

Tests assume:

- Character with ID 1 exists
- Standard Pathfinder tables (skills, abilities, etc.)
- Unix filesystem structure initialized

## Maintenance

- Update visual regression baselines when UI changes
- Review and update selectors if HTML structure changes
- Add tests for new features
- Remove tests for deprecated features
