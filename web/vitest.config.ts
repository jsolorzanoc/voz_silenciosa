import { defineConfig } from 'vitest/config';

// Pruebas unitarias de la lógica crítica (WBS 1.7.1.1).
// Importan la lógica canónica desde supabase/functions/_shared,
// la misma que ejecuta la Edge Function.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
