import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Declarar variable global para TypeScript
declare global {
  const __APP_VERSION__: string
  interface Window {
    APP_VERSION?: string
    BUILD_TIME?: string
  }
}

// Detectar si es Safari/iOS
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                 /iPad|iPhone|iPod/.test(navigator.userAgent);

// Obtener versión - PRIORIDAD: window.APP_VERSION > __APP_VERSION__ > import.meta.env.VITE_APP_VERSION
const CURRENT_VERSION = window.APP_VERSION || __APP_VERSION__ || import.meta.env.VITE_APP_VERSION || '1.0.0';

// Establecer en window para acceso global
window.APP_VERSION = CURRENT_VERSION;
window.BUILD_TIME = new Date().toISOString();

// Función agresiva para limpiar cache
const clearAllCaches = async (): Promise<void> => {
  try {
    console.log('🧹 Iniciando limpieza de cache...');
    
    // Limpiar localStorage excepto auth
    const keepKeys = ['firebase:authUser:', 'user_', 'auth_', 'tochoprime_version'];
    Object.keys(localStorage).forEach(key => {
      if (!keepKeys.some(keep => key.startsWith(keep))) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar caches API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🗑️  Eliminando ${cacheNames.length} caches...`);
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Limpiar IndexedDB (si existe)
    if ('indexedDB' in window && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) {
            console.log(`🗑️  Eliminando IndexedDB: ${db.name}`);
            indexedDB.deleteDatabase(db.name);
          }
        });
      } catch (e) {
        console.warn('No se pudo limpiar IndexedDB:', e);
      }
    }
    
    console.log('✅ Cache limpiado completamente');
  } catch (error) {
    console.warn('⚠️ Error limpiando cache:', error);
  }
};

// Función para forzar actualización
const checkForUpdates = async (): Promise<void> => {
  try {
    const storedVersion = localStorage.getItem('tochoprime_version');
    
    console.log(`🔍 Verificando versión:
      Actual: ${CURRENT_VERSION}
      Almacenada: ${storedVersion || 'ninguna'}
      Safari: ${isSafari ? 'Sí' : 'No'}
      URL: ${window.location.href}`);
    
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 Nueva versión detectada: ${CURRENT_VERSION}`);
      
      // Para Safari, limpiar todo cache agresivamente
      if (isSafari) {
        console.log('🦁 Safari detectado - limpiando cache agresivamente');
        await clearAllCaches();
      } else {
        // Para otros navegadores, limpiar cache suavemente
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const appCaches = cacheNames.filter(name => name.includes('tocho') || name.includes('prime'));
          if (appCaches.length > 0) {
            await Promise.all(appCaches.map(name => caches.delete(name)));
          }
        }
      }
      
      localStorage.setItem('tochoprime_version', CURRENT_VERSION);
      sessionStorage.clear();
      
      // Si ya había una versión anterior
      if (storedVersion) {
        const updateShown = sessionStorage.getItem('update_shown');
        
        // Para Safari, forzar recarga inmediata
        if (isSafari) {
          console.log('🦁 Safari: Forzando recarga inmediata...');
          if (!updateShown) {
            sessionStorage.setItem('update_shown', 'true');
            setTimeout(() => {
              const newUrl = `${window.location.origin}${window.location.pathname}?v=${Date.now()}&version=${CURRENT_VERSION}`;
              console.log('🔄 Recargando a:', newUrl);
              window.location.href = newUrl;
            }, 800);
          }
        } else {
          // Para otros navegadores, preguntar amablemente
          if (!updateShown) {
            sessionStorage.setItem('update_shown', 'true');
            setTimeout(() => {
              if (window.confirm('🎉 ¡Hay una nueva versión disponible!\n\n¿Recargar para ver los cambios?')) {
                console.log('🔄 Usuario aceptó recarga');
                window.location.reload();
              } else {
                console.log('⏸️  Usuario pospuso recarga');
              }
            }, 1500);
          }
        }
      } else {
        console.log('🌟 Primera carga de esta versión');
      }
    } else {
      console.log('✅ Versión actual - todo está bien');
    }
  } catch (error) {
    console.error('❌ Error en checkForUpdates:', error);
  }
};

// Configurar listeners para recargas
const setupUpdateListeners = (): void => {
  // Verificar cuando la página vuelve a estar visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('📱 Página visible nuevamente - verificando updates');
      checkForUpdates().catch(console.error);
    }
  });

  // Verificar cuando la conexión vuelve (para móviles)
  window.addEventListener('online', () => {
    console.log('📶 Conexión restablecida - verificando updates');
    checkForUpdates().catch(console.error);
  });

  // También verificar periódicamente
  const checkInterval = isSafari ? 2 * 60 * 1000 : 5 * 60 * 1000;
  console.log(`⏰ Verificando updates cada ${checkInterval / 60000} minutos`);
  setInterval(checkForUpdates, checkInterval);
};

// Mostrar información de debug
console.log(`🚀 Tocho Prime v${CURRENT_VERSION}`);
console.log(`📅 Build: ${window.BUILD_TIME}`);
console.log(`🌐 URL: ${window.location.href}`);
console.log(`📱 User Agent: ${navigator.userAgent.substring(0, 80)}...`);
console.log(`🖥️  Plataforma: ${navigator.platform}`);
console.log(`🔍 Safari/iOS: ${isSafari ? 'Sí 🦁' : 'No'}`);

// Verificar si hay Service Workers y eliminarlos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log(`🗑️  Eliminando ${registrations.length} Service Workers...`);
      registrations.forEach(registration => {
        registration.unregister();
        console.log(`   - Eliminado: ${registration.scope}`);
      });
    }
  });
}

// Inicializar React con manejo de errores robusto
try {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('❌ No se encontró el elemento #root');
  }

  console.log('⚛️  Montando React...');
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('✅ React montado exitosamente');
  
  // Configurar listeners después de montar React
  setTimeout(() => {
    checkForUpdates().catch(console.error);
    setupUpdateListeners();
  }, 1000);

} catch (error) {
  console.error('💥 Error fatal iniciando React:', error);
  
  // Mostrar mensaje de error amigable
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        padding: 40px 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); 
                    padding: 40px; border-radius: 20px; max-width: 500px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 20px; color: white;">
            😱 ¡Ups! Algo salió mal
          </h1>
          <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">
            Hubo un error al cargar la aplicación. Esto suele pasar cuando hay 
            problemas de caché o la versión está desactualizada.
          </p>
          
          <button onclick="window.location.reload()" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.2s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          " onmouseover="this.style.transform='scale(1.05)'" 
          onmouseout="this.style.transform='scale(1)'">
            🔄 Recargar aplicación
          </button>
          
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" style="
            background: transparent;
            color: white;
            border: 2px solid white;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.1rem;
            cursor: pointer;
            margin: 10px;
            transition: all 0.2s;
          " onmouseover="this.style.background='rgba(255,255,255,0.2)'" 
          onmouseout="this.style.background='transparent'">
            🧹 Limpiar cache y recargar
          </button>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
            <p style="font-size: 0.9rem; opacity: 0.7;">
              Versión: ${CURRENT_VERSION}<br>
              Hora: ${new Date().toLocaleString()}<br>
              Error: ${error instanceof Error ? error.message : 'Desconocido'}
            </p>
            <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 10px;">
              Si el problema persiste, contacta al soporte técnico.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
