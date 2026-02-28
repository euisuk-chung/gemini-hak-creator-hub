@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────
:: NVC Chat Talk — Frontend & Backend 실행 스크립트
:: Usage: scripts\run.bat
:: ─────────────────────────────────────────────

set BACKEND_PORT=8000
set FRONTEND_PORT=3000
set ROOT_DIR=%~dp0..

echo [INFO]  기존 포트 점유 프로세스 확인 중...

:: ── 포트 8000 Kill ──
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr "LISTENING" ^| findstr ":%BACKEND_PORT% "') do (
    if %%a NEQ 0 (
        echo [WARN]  포트 %BACKEND_PORT% 점유 프로세스 종료 ^(PID: %%a^)
        taskkill /F /PID %%a >nul 2>&1
    )
)

:: ── 포트 3000 Kill ──
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr "LISTENING" ^| findstr ":%FRONTEND_PORT% "') do (
    if %%a NEQ 0 (
        echo [WARN]  포트 %FRONTEND_PORT% 점유 프로세스 종료 ^(PID: %%a^)
        taskkill /F /PID %%a >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul

:: ── Backend 실행 ──
echo [INFO]  Backend 시작 (포트 %BACKEND_PORT%)...
cd /d "%ROOT_DIR%"
start "NVC-Backend" cmd /c "uv run uvicorn backend.main:app --reload --port %BACKEND_PORT%"

:: ── Frontend 실행 ──
echo [INFO]  Frontend 시작 (포트 %FRONTEND_PORT%)...
cd /d "%ROOT_DIR%\frontend"
start "NVC-Frontend" cmd /c "npm run dev"

cd /d "%ROOT_DIR%"

echo.
echo [INFO]  =========================================
echo [INFO]    Backend  -^> http://localhost:%BACKEND_PORT%
echo [INFO]    Frontend -^> http://localhost:%FRONTEND_PORT%
echo [INFO]    종료: 각 터미널 창을 닫으세요
echo [INFO]  =========================================
echo.
