import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generar hash único para cada build
const timestamp = Date.now()

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 🔥 AGREGAR TIMESTAMP AL HASH - ESTO ES CLAVE
        entryFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        chunkFileNames: `assets/[name]-[hash]-${timestamp}.js`,
        assetFileNames: `assets/[name]-[hash]-${timestamp}.[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  base: '/',
})