import { expect, test } from '@playwright/test';

/**
 * HU-08 caso 3: un correo de dominio público (gmail.com) se rechaza.
 * Requiere la semilla de universidades cargada (supabase db reset).
 */
test('el registro rechaza correos de dominio público', async ({ page }) => {
  await page.goto('/registro');

  // Espera la lista de dominios aceptados: garantiza que la validación
  // de dominio del cliente ya está activa (el servidor la repite igual)
  await expect(page.getByText(/dominios aceptados/i)).toBeVisible();

  await page.getByLabel(/correo institucional/i).fill('persona@gmail.com');
  await page.getByLabel(/seudónimo/i).fill('lobo_azul');
  await page.getByLabel(/contraseña/i).fill('ClaveSegura123');
  await page.getByRole('button', { name: /crear cuenta/i }).click();

  await expect(page.getByRole('alert')).toContainText(/institucional/i);
});
