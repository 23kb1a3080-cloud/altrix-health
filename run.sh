#!/usr/bin/env bash
set -e

echo "========================================================"
echo "   ALTRIX HEALTH COPILOT - STARTING SERVICES (TS/NODE)   "
echo "========================================================"

# Launch backend in background
echo "[1/2] Launching TypeScript backend on http://localhost:8000 ..."
npm start &
BACKEND_PID=$!

# Launch frontend in background
echo "[2/2] Launching Vite frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Altrix Health Copilot is running!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000/api/health"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
