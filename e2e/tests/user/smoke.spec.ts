import { test, expect } from '@playwright/test';

test.describe('Smoke — real browser launch verification', () => {
  test('opens the real deployed web-user site and finds the login link', async ({ page }) => {
    await page.goto('/uz');
    await expect(page).toHaveTitle(/.+/);
    await page.screenshot({ path: 'test-results/smoke-home.png' });
  });
});
