// src/utils/versionCheck.ts
const APP_VERSION = '1.0.' + Date.now(); // Genera versión única por build

export const checkForUpdates = () => {
  const storedVersion = localStorage.getItem('app_version');
  
  if (storedVersion !== APP_VERSION) {
    console.log('🔄 Nueva versión detectada. Limpiando cache...');
    localStorage.setItem('app_version', APP_VERSION);
    sessionStorage.clear();
    
    // Limpiar cache de Service Workers
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    return true;
  }
  return false;
};

export const forceReloadIfNeeded = () => {
  if (checkForUpdates()) {
    // Opcional: Mostrar mensaje al usuario
    if (window.confirm('Hay una nueva versión disponible. ¿Recargar ahora?')) {
      window.location.reload();
    }
  }
};

export default APP_VERSION;