import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  // sockjs-client tham chiếu biến `global` của Node — polyfill sang globalThis cho trình duyệt.
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.skillswap.asia',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      ignored: [
        '**/tsconfig.json',
        '**/tsconfig.app.json',
        '**/tsconfig.node.json',
        '**/vite.config.ts',
      ],
    },
  },
})