import { expect, test, type Page } from '@playwright/test';

const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;
const hasCredentials = Boolean(email && password);

const modules = [
  { label: 'PDV (Caixa)', heading: 'PDV (Caixa)', endpoint: '/api/management/pos/catalog' },
  { label: 'Financeiro', heading: 'Financeiro', endpoint: '/api/management/finance/entries' },
  { label: 'Central de Equipe', heading: 'Central de Equipe', endpoint: '/api/saas/staff' },
  { label: 'Projetos', heading: 'Projetos', endpoint: '/api/management/projects' },
] as const;

const forbiddenAuthority = /(?:org_dev_default|prop_dev_default|(?:[?&=\/])(beach|sanctuary)(?:[?&=\/]|$))/i;

type RuntimeAudit = { failures: string[]; consoleErrors: string[] };

test.describe('runtime P1 de gestão autenticado', () => {
  test.skip(!hasCredentials, 'P1_E2E_SKIPPED_MISSING_TEST_EMAIL_OR_TEST_PASSWORD');

  const attachRuntimeAudit = (page: Page): RuntimeAudit => {
    const audit: RuntimeAudit = { failures: [], consoleErrors: [] };
    page.on('pageerror', error => audit.consoleErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') audit.consoleErrors.push(message.text());
    });
    page.on('response', response => {
      const url = response.url();
      const isCanonicalManagementRequest = url.includes('/api/management/') || url.includes('/api/saas/staff');
      if (!isCanonicalManagementRequest) return;
      if (response.status() >= 500 || response.status() === 401 || response.status() === 403) {
        audit.failures.push(`${response.status()} ${url}`);
      }
      if (forbiddenAuthority.test(url)) audit.failures.push(`autoridade demo na URL: ${url}`);
    });
    return audit;
  };

  const login = async (page: Page) => {
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
    await expect(page.locator('input[type="email"]').first()).toBeHidden({ timeout: 15000 });
  };

  for (const module of modules) {
    test(`${module.label} abre com leitura canônica tenant-scoped`, async ({ page }) => {
      const audit = attachRuntimeAudit(page);
      await login(page);

      const responsePromise = page.waitForResponse(
        response => response.url().includes(module.endpoint),
        { timeout: 15000 },
      );
      await page.getByRole('button', { name: module.label, exact: true }).click();
      const response = await responsePromise;

      expect(response.status(), `falha na leitura canônica de ${module.label}`).toBeLessThan(400);
      await expect(page.getByRole('heading', {
        level: 2,
        name: module.heading,
        exact: true,
      })).toBeVisible();
      await expect(page.locator('body')).not.toContainText('org_dev_default');
      await expect(page.locator('body')).not.toContainText('prop_dev_default');
      expect(audit.failures).toEqual([]);
      expect(audit.consoleErrors).toEqual([]);
    });
  }
});
