@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

cd /d "%ROOT%"

if not exist "backend\.env" (
  echo Creating backend\.env from backend\.env.example
  copy /y "backend\.env.example" "backend\.env" >nul
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8000 .*LISTENING"') do set BACKEND_PID=%%P
if defined BACKEND_PID (
  echo Port 8000 is already in use by PID !BACKEND_PID!.
  powershell -NoProfile -Command ^
    "try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:8000/api/health -TimeoutSec 2; $j = $r.Content | ConvertFrom-Json; if ($r.StatusCode -eq 200 -and $j.data.status -eq 'ok' -and $j.data.db.status -eq 'ok') { exit 0 } else { exit 1 } } catch { exit 1 }"
  if errorlevel 1 (
    echo The process on port 8000 is not a healthy backend with a working database. Close it, then run this script again.
    pause
    exit /b 1
  )
  echo Existing backend is healthy. Reusing it.
  set BACKEND_READY=1
  goto :skip_backend_start
)

set ORIGIN=http://localhost:5173,http://localhost:5174

echo Updating backend\.env FRONTEND_ORIGIN=%ORIGIN%
powershell -NoProfile -Command ^
  "$p='backend\.env';" ^
  "$c=Get-Content $p -Raw;" ^
  "if($c -match 'FRONTEND_ORIGIN='){ $c=$c -replace 'FRONTEND_ORIGIN=.*','FRONTEND_ORIGIN=%ORIGIN%' } else { $c += \"`r`nFRONTEND_ORIGIN=%ORIGIN%\" };" ^
  "Set-Content $p $c"

for /f "delims=" %%P in ('where php 2^>nul') do (
  if not defined PHP_EXE set "PHP_EXE=%%P"
)

if not defined PHP_EXE (
  echo php.exe was not found in PATH.
  pause
  exit /b 1
)

for %%P in ("!PHP_EXE!") do set "PHP_DIR=%%~dpP"
if "!PHP_DIR:~-1!"=="\" set "PHP_DIR=!PHP_DIR:~0,-1!"

set PHP_INI=backend\php-runtime.ini
echo Preparing runtime PHP ini at !PHP_INI!
(
  echo extension_dir=!PHP_DIR!\ext
  echo extension=pdo_mysql
  echo extension=pdo_sqlite
  echo extension=sqlite3
) > "!PHP_INI!"

set BACKEND_BOOTSTRAP="!PHP_EXE!" -c "php-runtime.ini" -S localhost:8000 router.php

echo Starting backend...
start "Backend API" cmd /k "cd /d ""%ROOT%\backend"" && !BACKEND_BOOTSTRAP!"

echo Waiting for backend on http://localhost:8000/api/health ...
set BACKEND_READY=
for /l %%I in (1,1,20) do (
  powershell -NoProfile -Command ^
    "try { $r = Invoke-WebRequest -UseBasicParsing http://localhost:8000/api/health -TimeoutSec 2; $j = $r.Content | ConvertFrom-Json; if ($r.StatusCode -eq 200 -and $j.data.status -eq 'ok' -and $j.data.db.status -eq 'ok') { exit 0 } else { exit 1 } } catch { exit 1 }"
  if not errorlevel 1 (
    set BACKEND_READY=1
    goto :backend_ready
  )
  timeout /t 1 /nobreak >nul
)

:skip_backend_start
:backend_ready
if not defined BACKEND_READY (
  echo Backend did not become ready in time. Check the "Backend API" window for errors.
  pause
  exit /b 1
)

echo Starting Medical_Product on 5173...
start "Medical Product" cmd /k "cd /d ""%ROOT%\Medical_Product"" && npm run dev -- --port 5173"

echo Starting Admin-Dashboard on 5174...
start "Admin Dashboard" cmd /k "cd /d ""%ROOT%\Admin-Dashboard"" && npm run dev -- --port 5174"

echo.
echo Open:
echo - Customer: http://localhost:5173
echo - Admin:    http://localhost:5174
echo - API:      http://localhost:8000
echo.
pause
