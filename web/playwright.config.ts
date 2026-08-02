import { defineConfig } from '@playwright/test';

/**
 * Pruebas E2E de flujos críticos (WBS 1.7.1.2).
 * Requieren web/.env configurado y un Supabase con las migraciones y
 * la semilla aplicadas (`supabase start` + `supabase db reset`).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
