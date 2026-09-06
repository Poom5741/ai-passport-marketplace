/**
 * E2E tests: Registration to project submission flow
 */
import { test, expect } from '@playwright/test';

async function registerUser(page: import('@playwright/test').Page, email: string) {
  await page.goto('/en/register');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('testpass123');
  await page.getByLabel(/display\s*name/i).fill('Test User');
  await page.getByRole('button', { name: /sign up|register|create/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Registration flow', () => {
  test('registers with valid email and redirects', async ({ page }) => {
    const email = `test-${Date.now()}@ai-passport.go.th`;
    await registerUser(page, email);
    await expect(page).not.toHaveURL(/\/register/);
  });

  test('shows error for wrong domain email', async ({ page }) => {
    await page.goto('/en/register');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('user@gmail.com');
    await page.getByLabel(/password/i).fill('testpass123');
    await page.getByLabel(/display\s*name/i).fill('Test');
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page.locator('#email-error')).toBeVisible();
  });

  test('shows error for duplicate email', async ({ page }) => {
    const email = `dup-${Date.now()}@ai-passport.go.th`;
    await registerUser(page, email);

    // Log out first so we can visit /register again
    await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }));
    await page.waitForLoadState('networkidle');

    await page.goto('/en/register');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('testpass123');
    await page.getByLabel(/display\s*name/i).fill('Second User');
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    await expect(page.locator('#email-error')).toBeVisible();
  });
});

test.describe('Project submission', () => {
  test('submit project -> appears in feed', async ({ page }) => {
    const email = `submit-${Date.now()}@ai-passport.go.th`;
    await registerUser(page, email);

    await page.goto('/en/projects/new');
    await page.waitForLoadState('networkidle');

    const title = `E2E Project ${Date.now()}`;
    await page.locator('#title').fill(title);
    await page.locator('#description').fill('A test project');
    await page.locator('#liveUrl').fill('https://example.com');
    await page.getByRole('button', { name: /submit|create|publish/i }).click();

    await page.waitForURL((url) => !url.pathname.includes('/new'), { timeout: 10000 });

    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(title)).toBeVisible();
  });

  test('submit without live URL shows validation error', async ({ page }) => {
    const email = `nolive-${Date.now()}@ai-passport.go.th`;
    await registerUser(page, email);

    await page.goto('/en/projects/new');
    await page.waitForLoadState('networkidle');
    await page.locator('#title').fill('No Live URL');
    await page.locator('#description').fill('Missing live URL');
    await page.getByRole('button', { name: /submit|create|publish/i }).click();

    await expect(page.locator('#liveUrl-error')).toBeVisible();
  });
});
