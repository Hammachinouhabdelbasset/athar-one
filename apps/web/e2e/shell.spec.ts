import { expect, test } from '@playwright/test';

test.describe('application shell', () => {
  test('renders English LTR shell with navigation and main content', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation', { name: /navigation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /control tower/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create/i })).toBeVisible();
    await expect(page.locator('[dir="ltr"]')).toBeVisible();
  });

  test('renders Arabic RTL shell with mirrored direction', async ({ page }) => {
    await page.goto('/ar-DZ');
    const shell = page.locator('[dir="rtl"]');
    await expect(shell).toBeVisible();
    await expect(page.getByRole('link', { name: /مركز القيادة/ })).toBeVisible();
  });

  test('renders French LTR shell', async ({ page }) => {
    await page.goto('/fr-FR');
    await expect(page.getByRole('link', { name: /tour de contrôle/i })).toBeVisible();
  });

  test('keyboard focus moves through interactive elements with visible focus', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus-visible');
    await expect(focused.first()).toBeVisible();
  });

  test('touch targets meet 44px minimum on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en');
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('settings read-write flow', () => {
  test.skip('updates workspace settings through the typed SDK', async ({ page }) => {
    await page.goto('/en/settings');
    await page.getByLabel(/language/i).selectOption('fr-FR');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByRole('status')).toContainText(/saved/i);
  });
});
