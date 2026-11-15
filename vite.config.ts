import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// base relativa: funziona su GitHub Pages (/projectblack/) e su qualunque altro host
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        admin: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'm/index.html'),
      },
    },
  },
})
