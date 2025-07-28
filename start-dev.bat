@echo off
echo Starting development environment with pnpm monorepo...
echo.
echo This will start each package in separate terminal windows:
echo - Backend (Node.js/Express) on port 3000
echo - Frontend (Vue/Vite) on port 5173
echo.

echo Starting VS Code
@REM call code .
start "code" cmd /k "code ."

echo Starting Frontend development server...
start "Frontend Dev Server - Port 5173" cmd /k "cd packages/frontend && pnpm dev"

echo Starting Backend server...
start "Backend Dev Server" cmd /k "cd packages/backend && pnpm dev"
@REM cd packages/backend && pnpm dev

exit /b
