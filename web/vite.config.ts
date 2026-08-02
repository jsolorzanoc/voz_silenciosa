import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// PWA instalable (WBS 1.2.4.3 / 1.6.1): un solo código para web y móvil
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Modo offline (WBS 1.6.1.2): se precachea el shell de la app y
        // la navegación cae a index.html sin conexión. Deliberadamente
        // NO se cachean respuestas de la API: contienen datos sensibles
        // de salud (Ley 8968). Las líneas de emergencia se guardan en
        // localStorage desde el botón de ayuda (datos públicos).
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
      manifest: {
        name: 'La Voz Silenciosa',
        short_name: 'Voz Silenciosa',
        description:
          'Plataforma confidencial de bienestar estudiantil del consorcio RUBE-CR',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4c1d95',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
