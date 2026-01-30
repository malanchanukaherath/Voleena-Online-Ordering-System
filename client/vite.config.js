import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const NGROK_HOST = process.env.VITE_NGROK_HOST || process.env.NGROK_HOST || ''

const serverConfig = {
  host: true,
  port: 5173,
  strictPort: true,
  open: false,
  allowedHosts: [
    '.ngrok-free.dev',
    '.ngrok.io',
    'localhost',
    '.local'
  ],
  cors: true
}

if (NGROK_HOST) {
  serverConfig.hmr = {
    protocol: 'wss',
    host: NGROK_HOST,
    port: 443
  }
}

export default defineConfig({
  plugins: [react()],

  // Build optimization for production
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser (faster and built-in)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          icons: ['react-icons']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Base path for assets
  base: '/',

  // Development server config
  server: serverConfig,

  // Preview server config (for testing production build)
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    open: true
  }
})
