import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: app deploys don't invalidate cached libraries
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux', 'zustand'],
          i18n: ['i18next', 'react-i18next'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          network: ['axios'],
        },
      },
    },
  },
})
