import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'DiskJockey',
        short_name: 'DiskJockey',
        description: 'Simple client-side DJ app with two decks and a crossfader',
        theme_color: '#0a0b12',
        background_color: '#0a0b12',
        display: 'standalone',
        start_url: '/diskJockey/',
        scope: '/diskJockey/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/diskJockey/index.html',
      },
    }),
  ],
  // Set base for GitHub Pages project site: https://<user>.github.io/diskJockey/
  base: '/diskJockey/',
})
