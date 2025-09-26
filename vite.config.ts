import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command: _command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    base: '/MyTradeJournal/', // Replace with your repository name
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/components': resolve(__dirname, 'src/components'),
        '@/composables': resolve(__dirname, 'src/composables'),
        '@/firebase': resolve(__dirname, 'src/firebase'),
        '@/styles': resolve(__dirname, 'src/styles'),
        '@/types': resolve(__dirname, 'src/types')
      }
    },
    build: {
      target: 'es2020',
      outDir: 'dist'
    },
    esbuild: {
      target: 'es2020'
    },
    // Define global constants that will be replaced during build
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'Trade Journal')
    },
    // Environment variables validation (optional)
    envPrefix: 'VITE_'
  }
})
