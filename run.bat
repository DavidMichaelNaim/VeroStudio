@echo off
title VeroStudio Local Server
echo ==================================================
echo         VeroStudio Local Web Server
echo ==================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Python detected.
    echo [INFO] Starting server on http://localhost:8000 ...
    echo [INFO] Close this window to stop the server.
    echo.
    
    :: Open browser
    start "" "http://localhost:8000"
    
    :: Start local server (blocks until window is closed)
    python -m http.server 8000
    goto end
)

:: Check if Node/npx is installed
npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Node.js/npx detected.
    echo [INFO] Starting server on http://localhost:3000 ...
    echo [INFO] Close this window to stop the server.
    echo.
    
    :: Open browser
    start "" "http://localhost:3000"
    
    :: Start local server (blocks until window is closed)
    npx serve -l 3000
    goto end
)

echo [ERROR] Neither Python nor Node.js/npx was detected in your system PATH.
echo Please install Python (https://www.python.org/) or Node.js (https://nodejs.org/) to run the local server.
echo.
pause

:end
