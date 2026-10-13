@echo off
echo ========================================================
echo   ALTRIX HEALTH COPILOT - STARTING SERVICES (TYPESCRIPT)
echo ========================================================

echo [1/2] Launching TypeScript API Server on http://localhost:8000 ...
start "Altrix Backend (TypeScript)" cmd /k "npm start"

echo [2/2] Launching Vite Frontend on http://localhost:5173 ...
cd frontend
start "Altrix Frontend (Vite)" cmd /k "npm run dev"

echo ========================================================
echo Altrix Health Copilot is live!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000/api/health
echo ========================================================
