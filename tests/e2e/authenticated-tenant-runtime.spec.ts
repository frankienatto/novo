import { test, expect } from '@playwright/test';

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const hasCredentials = Boolean(email && password);
const prohibitedTenantIds = ['org_dev_default', 'prop_dev_default'];

test.describe('runtime autenticado e tenant canônico', () => {
  test.skip(!hasCredentials, 'AUTHENTICATED_E2E_SKIPPED_MISSING_TEST_EMAIL_OR_TEST_PASSWORD');

  test('alcança o runtime administrativo canônico sem autoridade demo após login', async ({ page }) => {
    const violations: string[] = [];
    const internalFailures: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (prohibitedTenantIds.some(id => url.includes(id)) && url.includes('/api/')) {
        violations.push(url.replace(/([?&]Authorization=)[^&]+/i, '$1[redacted]'));
      }
    });
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') && [401, 403].includes(response.status())) internalFailures.push(`${response.status()} ${url}`);
    });

    await page.goto('/?page=login', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await emailInput.fill(email!);
    await passwordInput.fill(password!);
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    await expect(page.getByTestId('canonical-admin-runtime')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).not.toContainText('Acesso ainda não provisionado');

    expect(violations).toEqual([]);
    expect(internalFailures).toEqual([]);
    await expect(page.locator('body')).not.toContainText('org_dev_default');
    await expect(page.locator('body')).not.toContainText('prop_dev_default');
  });
});
