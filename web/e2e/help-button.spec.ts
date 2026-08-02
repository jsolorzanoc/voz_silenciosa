import { expect, test } from '@playwright/test';

/**
 * HU-09 caso 3: el botón de ayuda sigue accesible en un toque o menos
 * en todas las vistas.
 */
const publicViews = ['/', '/login', '/registro'];

for (const view of publicViews) {
  test(`el botón Ayuda 24/7 está visible en ${view}`, async ({ page }) => {
    await page.goto(view);
    const helpButton = page.getByRole('button', {
      name: /ayuda inmediata, disponible 24 horas/i,
    });
    await expect(helpButton).toBeVisible();
  });
}

test('el botón abre el diálogo de líneas con una sola pulsación', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /ayuda inmediata, disponible 24 horas/i })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /apoyo inmediato con una persona real/i,
    }),
  ).toBeVisible();
});
