import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // ✅ CORREGIDO: Placeholders correctos para Rollup
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
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
  // ✅ Definir __APP_VERSION__ globalmente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.1')
  }
})