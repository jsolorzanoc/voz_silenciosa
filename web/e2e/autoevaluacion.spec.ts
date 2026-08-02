import { expect, test } from '@playwright/test';

/**
 * HU-04: flujo de autoevaluación de un usuario autenticado.
 *
 * Requiere un usuario confirmado en el ambiente de pruebas; sus
 * credenciales se pasan por variables de entorno para no fijar datos
 * en el código:
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD
 */
const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.skip(
  !email || !password,
  'Define E2E_USER_EMAIL y E2E_USER_PASSWORD para ejecutar este flujo',
);

test('un envío incompleto se bloquea y resalta el ítem pendiente (HU-04 caso 2)', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel(/correo institucional/i).fill(email!);
  await page.getByLabel(/contraseña/i).fill(password!);
  await page.getByRole('button', { name: /^ingresar$/i }).click();
  await expect(
    page.getByRole('link', { name: /la voz silenciosa/i }),
  ).toBeVisible();

  await page.goto('/autoevaluacion');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /phq-9/i }).click();

  // Responde todos los ítems menos el 5 (índice 4)
  const groups = page.getByRole('group');
  const count = await groups.count();
  for (let i = 0; i < count; i++) {
    if (i === 4) continue;
    await groups.nth(i).getByRole('radio').first().check();
  }

  await page.getByRole('button', { name: /enviar autoevaluación/i }).click();

  // El envío se bloquea y el ítem 5 queda señalado
  await expect(page.getByRole('alert')).toContainText(/ítem/i);
  await expect(page.locator('#item-4')).toHaveAttribute('aria-invalid', 'true');
});
