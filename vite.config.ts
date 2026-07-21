import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages serves from /kazu-friends/; Vercel and local dev serve from /
  base: process.env.DEPLOY_BASE ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'audio/**/*'],
      manifest: {
        name: 'Kazu Friends',
        short_name: 'Kazu',
        description: 'Aventura de matemática / さんすうのぼうけん',
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#FDF6EC',
        theme_color: '#FDF6EC',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3,json,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ]
})
