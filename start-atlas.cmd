@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================
REM  PSSM Buddha Sangha - Start Backend + Frontend against Atlas
REM  Same launcher UX as start.cmd, but MongoDB is cloud Atlas
REM  (does not start local Docker Mongo).
REM
REM  Requires repo-root .env with:
REM    MONGODB_URI=mongodb+srv://...
REM
REM  Double-click, or from repo root:
REM    start-atlas.cmd
REM ============================================================

cd /d "%~dp0"

set "FRONTEND_URL=http://127.0.0.1:5173"
set "BACKEND_URL=http://127.0.0.1:8080"
set "MONGO_DB=pssm_sangha"
set "MONGODB_URI="
set "PSSM_CORS_ORIGINS=http://localhost:5173"

echo.
echo  ========================================
echo   PSSM Buddha Sangha  (Atlas MongoDB)
echo   Starting backend + frontend...
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

if not exist ".env" (
  echo [ERROR] .env not found in repo root.
  echo         Add MONGODB_URI=mongodb+srv://... then run again.
  pause
  exit /b 1
)

REM --- Load MONGODB_URI (and optional CORS) from .env ---
echo [1/3] Loading Atlas URI from .env ...
for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
  if /I "%%A"=="MONGODB_URI" set "MONGODB_URI=%%B"
  if /I "%%A"=="PSSM_CORS_ORIGINS" set "PSSM_CORS_ORIGINS=%%B"
)

REM Trim surrounding quotes if present
if defined MONGODB_URI (
  if "!MONGODB_URI:~0,1!"=="""" set "MONGODB_URI=!MONGODB_URI:~1!"
  if "!MONGODB_URI:~-1!"=="""" set "MONGODB_URI=!MONGODB_URI:~0,-1!"
)

if not defined MONGODB_URI (
  echo [ERROR] MONGODB_URI missing in .env
  pause
  exit /b 1
)

echo !MONGODB_URI! | findstr /I /C:"mongodb+srv://" >nul
if errorlevel 1 (
  echo [WARN] MONGODB_URI does not look like mongodb+srv:// — continuing anyway.
) else (
  echo       Atlas URI loaded.
)

REM Local HTTP login needs Secure cookies off even if .env has COOKIE_SECURE=true for Render.
set "COOKIE_SECURE=false"
set "MONGODB_URI=!MONGODB_URI!"
set "PSSM_CORS_ORIGINS=!PSSM_CORS_ORIGINS!"

REM Skip local Docker Mongo — data lives on Atlas.
echo [2/3] Skipping local Docker Mongo  (using Atlas cloud).
echo       No first-time seed against Atlas from this launcher.
echo.

REM --- Backend (Spring Boot on port 8080) ---
echo [3/3] Starting backend  (%BACKEND_URL%) ...
where mvn >nul 2>&1
if errorlevel 1 (
  echo [ERROR] mvn not found on PATH. Install Maven or open a shell where mvn works.
  pause
  exit /b 1
)

REM Child window inherits MONGODB_URI / COOKIE_SECURE / PSSM_CORS_ORIGINS from this process.
start "PSSM Sangha Backend (Atlas)" cmd /k "cd /d ""%~dp0backend"" && echo Backend starting against Atlas... && echo MONGODB_URI is set from .env && mvn spring-boot:run"

timeout /t 2 /nobreak >nul

REM --- Frontend (Vite on port 5173) ---
echo       Starting frontend (%FRONTEND_URL%) ...
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
echo  Mongo    : Atlas cloud  (MONGODB_URI from .env)
echo  Backend  : %BACKEND_URL%   COOKIE_SECURE=false for local HTTP
echo  Frontend : %FRONTEND_URL%
echo  Login    : use accounts already on Atlas
echo.
echo  Tip: frontend\.env should have VITE_USE_MOCK=false
echo  Two new windows were opened. Close those windows to stop the servers.
echo  This launcher window can be closed safely.
echo.
pause
