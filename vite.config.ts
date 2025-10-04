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
        '@/types': resolve(__dirname, 'src/types'),
        '@/utils': resolve(__dirname, 'src/utils')
      }
    },
    build: {
      target: 'es2020',
      outDir: 'dist',
      // Enable source maps for debugging in production
      sourcemap: false,
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable rollup optimizations
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // Vendor chunk for third-party libraries
            vendor: ['vue', 'vue-router'],
            // Firebase chunk
            firebase: ['firebase/app', 'firebase/firestore'],
            // Utils chunk for utilities
            utils: ['uuid']
          },
          // Use content hash for better caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
        // External dependencies (if any)
        external: [],
        // Tree shaking configuration
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },
      // Minification options
      minify: 'esbuild',
      // CSS code splitting
      cssCodeSplit: true,
      // Asset inlining threshold (4kb)
      assetsInlineLimit: 4096
    },
    esbuild: {
      target: 'es2020',
      // Remove console.log in production
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },
    // Optimization options
    optimizeDeps: {
      include: ['vue', 'vue-router', 'firebase/app', 'firebase/firestore', 'uuid'],
      // Force optimize these dependencies
      force: false
    },
    // Server configuration for development
    server: {
      // Enable pre-bundling in development
      fs: {
        allow: ['..']
      }
    },
    // Preview configuration
    preview: {
      port: 5173
    },
    // Define global constants that will be replaced during build
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'Trade Journal'),
      // Enable performance monitoring in development
      __DEV__: mode === 'development'
    },
    // Environment variables validation (optional)
    envPrefix: 'VITE_'
  }
})
