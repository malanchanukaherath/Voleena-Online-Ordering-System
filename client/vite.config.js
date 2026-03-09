/* eslint-env node */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ngrokHost = env.VITE_NGROK_HOST || env.NGROK_HOST || '';

  const resolvedServerConfig = { ...serverConfig };
  if (ngrokHost) {
    resolvedServerConfig.hmr = {
      protocol: 'wss',
      host: ngrokHost,
      port: 443
    };
  }

  return {
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
    server: resolvedServerConfig,

    // Preview server config (for testing production build)
    preview: {
      host: true,
      port: 4173,
      strictPort: false,
      open: true
    }
  };
})
