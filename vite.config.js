import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'My Trade Journal',
          short_name: 'TradeJournal',
          description: 'A modern trading journal application for tracking and analyzing trades',
          theme_color: '#42b883',
          background_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300 // 5 minutes
                }
              }
            }
          ]
        }
      })
    ],
    base: '/MyTradeJournal/', // Replace with your repository name
    build: {
      target: 'es2015',
      outDir: 'dist'
    },
    esbuild: {
      target: 'es2015'
    },
    // Define global constants that will be replaced during build
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'Trade Journal'),
    },
    // Environment variables validation (optional)
    envPrefix: 'VITE_'
  }
})
