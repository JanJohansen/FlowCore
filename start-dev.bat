@echo off
echo Starting development environment with pnpm monorepo...
echo.
echo This will start each package in separate terminal windows:
echo - Backend (Node.js/Express) on port 3000
echo - Frontend (Vue/Vite) on port 5173
echo - Common package in watch mode
echo.
echo Starting Common package (watch mode)...
start "Common Package - Watch Mode" cmd /k "cd packages/common && pnpm watch"

echo Starting Backend server...
start "Backend Server - Port 3000" cmd /k "cd packages/backend && pnpm dev"

echo Starting Frontend development server...
start "Frontend Dev Server - Port 5173" cmd /k "cd packages/frontend && pnpm dev"

cmd code .
