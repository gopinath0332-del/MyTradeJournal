import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command: _command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
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
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'Trade Journal')
    },
    // Environment variables validation (optional)
    envPrefix: 'VITE_'
  }
})
