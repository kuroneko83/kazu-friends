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
      includeAssets: ['icons/*.svg', 'audio/**/*'],
      manifest: {
        name: 'Kazu Friends',
        short_name: 'Kazu',
        description: 'Aventura de matemática / さんすうのぼうけん',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#FDF6EC',
        theme_color: '#FDF6EC',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,mp3,json,woff2}'],
        navigateFallback: 'index.html'
      }
    })
  ]
})
