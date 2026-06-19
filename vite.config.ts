import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
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