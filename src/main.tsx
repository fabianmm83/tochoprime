import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Detectar cambios de versión
const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

// Función para forzar actualización
const checkForUpdates = () => {
  const storedVersion = localStorage.getItem('tochoprime_version')
  
  if (storedVersion !== CURRENT_VERSION) {
    console.log(`🔄 Nueva versión detectada: ${CURRENT_VERSION}`)
    localStorage.setItem('tochoprime_version', CURRENT_VERSION)
    sessionStorage.clear()
    
    // Si ya había una versión anterior, sugerir recarga
    if (storedVersion && !sessionStorage.getItem('update_shown')) {
      sessionStorage.setItem('update_shown', 'true')
      setTimeout(() => {
        if (window.confirm('🎉 Hay una nueva versión disponible. ¿Recargar para ver los cambios?')) {
          window.location.reload()
        }
      }, 1000)
    }
  }
}

// Verificar al cargar
checkForUpdates()

// También verificar periódicamente (cada 5 minutos)
setInterval(checkForUpdates, 5 * 60 * 1000)

// Mostrar versión en consola para debugging
console.log(`🚀 Tocho Prime v${CURRENT_VERSION}`)
console.log(`📅 Build: ${new Date().toLocaleString()}`)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)