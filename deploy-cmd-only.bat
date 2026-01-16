@echo off
chcp 65001 >nul
title 🔥 TOCHO PRIME - DEPLOY SIN CACHE 🔥
echo.
echo ========================================
echo       DEPLOY TOCHO PRIME - CMD ONLY
echo ========================================
echo.

:: ========== CONFIGURACIÓN ==========
set "PROJECT_DIR=C:\Users\Fabia\OneDrive\Escritorio\tochoprime"
cd /d "%PROJECT_DIR%"

:: Generar versión única
set "version=cmd-%date:~6,4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%"
set "timestamp=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
echo 📌 VERSIÓN: %version%
echo 🕐 TIMESTAMP: %timestamp%
echo.

:: ========== LIMPIAR ==========
echo 🧹 LIMPIANDO CACHE...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite rmdir /s /q .vite
echo ✅ Cache limpiado
echo.

:: ========== CREAR .ENV ==========
echo ⚙️  CREANDO .ENV...
echo VITE_APP_VERSION=%version% > .env.production
echo ✅ Archivo .env.production creado
echo.

:: ========== BUILD ==========
echo 🏗️  EJECUTANDO BUILD...
call npm run build
if errorlevel 1 (
    echo ❌ ERROR en el build
    pause
    exit /b 1
)
echo ✅ Build completado exitosamente
echo.

:: ========== INYECTAR VERSIÓN ==========
echo ✏️  INYECTANDO VERSIÓN EN HTML...
if not exist dist\index.html (
    echo ❌ ERROR: No existe dist\index.html
    pause
    exit /b 1
)

:: Método 1: Usar PowerShell de forma segura
echo   Intentando con PowerShell...
powershell -Command "& {(Get-Content 'dist\index.html') -replace '</head>', '<script>window.APP_VERSION=\"%version%\";</script></head>' | Set-Content 'dist\index.html' -Encoding UTF8}" >nul 2>&1

:: Verificar si funcionó
findstr /C:"APP_VERSION" dist\index.html >nul
if errorlevel 1 (
    echo   ⚠️  PowerShell falló, usando método alternativo...
    
    :: Método 2: Backup y recreación
    copy dist\index.html dist\index.html.backup >nul
    
    :: Crear nuevo HTML con versión
    (
        echo ^<html^>
        echo ^<head^>
        echo ^<meta charset="UTF-8" /^>
        echo ^<link rel="icon" type="image/svg+xml" href="/vite.svg" /^>
        echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
        echo ^<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" /^>
        echo ^<meta http-equiv="Pragma" content="no-cache" /^>
        echo ^<meta http-equiv="Expires" content="0" /^>
        echo ^<script^>window.APP_VERSION="%version%";window.BUILD_TIME="%date% %time%";^</script^>
        echo ^<title^>Tocho Prime^</title^>
        echo ^</head^>
        echo ^<body^>
        echo ^<div id="root"^>^</div^>
        echo ^<script src="/assets/index-*.js"^>^</script^>
        echo ^</body^>
        echo ^</html^>
    ) > dist\index.html.new
    
    :: Pero mejor usar el original e inyectar al final
    echo ^<script^>console.log("🚀 Tocho Prime v%version%");^</script^> >> dist\index.html
)

:: Verificar final
findstr /C:"%version%" dist\index.html >nul
if errorlevel 0 (
    echo ✅ Versión inyectada correctamente
) else (
    echo ⚠️  No se pudo verificar, pero continuando...
)
echo.

:: ========== DEPLOY ==========
echo 🚀 DESPLEGANDO A FIREBASE...
call firebase deploy --only hosting --force
if errorlevel 1 (
    echo ❌ ERROR en el deploy
    pause
    exit /b 1
)
echo ✅ Deploy completado
echo.

:: ========== RESULTADOS ==========
echo ========================================
echo            🎉 ¡DEPLOY EXITOSO! 🎉
echo ========================================
echo.
echo 📊 INFORMACIÓN:
echo    Versión: %version%
echo    Hora: %date% %time%
echo    Timestamp: %timestamp%
echo.
echo 🌐 URLS PARA PROBAR:
echo    • https://tochoprime.web.app?v=%timestamp%
echo    • https://tochoprime.web.app?version=%version%
echo    • https://tochoprime.web.app?force=%random%
echo.
echo 📋 INSTRUCCIONES:
echo    1. Abre Chrome/Edge
echo    2. Presiona Ctrl+Shift+N (modo incógnito)
echo    3. Visita: https://tochoprime.web.app?test=%timestamp%
echo    4. Presiona Ctrl+Shift+R (forzar recarga)
echo    5. Abre consola (F12) y busca el mensaje de versión
echo.

:: ========== ABRIR NAVEGADOR ==========
echo.
set /p ABRIR="¿Abrir en navegador? (s/n): "
if /i "%ABRIR%"=="s" (
    echo 🌐 Abriendo Chrome en modo incógnito...
    start chrome.exe --incognito "https://tochoprime.web.app?test=%timestamp%"
)

echo.
echo ✅ Proceso finalizado. Presiona cualquier tecla para salir...
pause >nul