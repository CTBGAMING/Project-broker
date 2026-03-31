// vite.config.js   ← or .ts if using TypeScript

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',      // ← Change this to 3001 (your backend port)
        changeOrigin: true,
        secure: false,                        // optional but helpful locally
      }
    }
  }
})