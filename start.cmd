@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  PSSM Buddha Sangha - Start Mongo + Backend + Frontend
REM  Double-click this file, or run from the repo root:
REM    start.cmd
REM ============================================================

cd /d "%~dp0"

set "FRONTEND_URL=http://127.0.0.1:5173"
set "BACKEND_URL=http://127.0.0.1:8080"
set "MONGO_WAIT_SEC=60"

echo.
echo  ========================================
echo   PSSM Buddha Sangha
echo   Starting Mongo + backend + frontend...
echo  ========================================
echo.

if not exist "backend" (
  echo [ERROR] backend folder not found.
  pause
  exit /b 1
)

if not exist "frontend" (
  echo [ERROR] frontend folder not found.
  pause
  exit /b 1
)

REM --- MongoDB (needed when frontend/.env has VITE_USE_MOCK=false) ---
where docker >nul 2>&1
if errorlevel 1 goto skip_mongo

echo [1/3] Starting MongoDB  (docker compose up -d mongo) ...
docker compose up -d mongo
echo       Waiting for Mongo replica set rs0 (up to %MONGO_WAIT_SEC%s)...
set /a waited=0

:wait_mongo
docker compose exec -T mongo mongosh --quiet --eval "try { quit(rs.status().ok ? 0 : 1) } catch (e) { try { rs.initiate({_id:'rs0', members:[{_id:0, host:'localhost:27017'}]}); quit(1) } catch (e2) { quit(1) } }" >nul 2>&1
if not errorlevel 1 (
  echo       Mongo is ready.
  goto mongo_done
)
set /a waited+=3
if !waited! GEQ %MONGO_WAIT_SEC% (
  echo [WARN] Mongo not healthy after %MONGO_WAIT_SEC%s - starting backend anyway.
  goto mongo_done
)
timeout /t 3 /nobreak >nul
goto wait_mongo

:skip_mongo
echo [1/3] Docker not found - skipping MongoDB.
echo       If the API fails to start, run: docker compose up -d mongo
echo.

:mongo_done

REM --- Backend (Spring Boot on port 8080) ---
echo [2/3] Starting backend  (%BACKEND_URL%) ...
where mvn >nul 2>&1
if errorlevel 1 (
  echo [ERROR] mvn not found on PATH. Install Maven or open a shell where mvn works.
  pause
  exit /b 1
)
start "PSSM Sangha Backend" cmd /k "cd /d ""%~dp0backend"" && echo Backend starting... && mvn spring-boot:run"

timeout /t 2 /nobreak >nul

REM --- Frontend (Vite on port 5173) ---
echo [3/3] Starting frontend (%FRONTEND_URL%) ...
if not exist "frontend\node_modules" (
  echo [INFO] frontend\node_modules missing - running npm install first...
  start "PSSM Sangha Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm install && npm run dev"
) else (
  start "PSSM Sangha Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"
)

REM Open frontend in Google Chrome (fallback to default browser)
timeout /t 3 /nobreak >nul
set "CHROME_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME_EXE (
  echo [INFO] Opening frontend in Chrome...
  start "" "%CHROME_EXE%" "%FRONTEND_URL%"
) else (
  echo [WARN] Chrome not found in common paths. Opening default browser instead...
  start "" "%FRONTEND_URL%"
)

echo.
echo  Mongo    : localhost:27017  (replica set rs0)
echo  Backend  : %BACKEND_URL%
echo  Frontend : %FRONTEND_URL%
echo  Sample   : 9000000001 / PssmA0101
echo.
echo  Two new windows were opened. Close those windows to stop the servers.
echo  This launcher window can be closed safely.
echo.
pause
