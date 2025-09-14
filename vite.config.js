import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/MyTradeJournal/', // Replace with your repository name
  build: {
    target: 'es2015',
    outDir: 'dist'
  },
  esbuild: {
    target: 'es2015'
  }
})
