import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });

    test('carrega sem overflow horizontal estrutural', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/', {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForTimeout(1500);

      const dimensions = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        bodyScrollWidth: document.body.scrollWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
      }));

      console.log(
        `[${viewport.name}] innerWidth=${dimensions.innerWidth} body=${dimensions.bodyScrollWidth} document=${dimensions.documentScrollWidth}`
      );

      expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(
        dimensions.innerWidth + 2
      );

      expect(dimensions.documentScrollWidth).toBeLessThanOrEqual(
        dimensions.innerWidth + 2
      );

      const bodyText = await page.locator('body').innerText();

      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('Cannot GET');

      if (consoleErrors.length) {
        console.log(
          `[${viewport.name}] console errors:\n${consoleErrors.join('\n')}`
        );
      }
    });
  });
}
