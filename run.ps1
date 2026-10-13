# Altrix Health Copilot Startup Script (PowerShell - TypeScript)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   ALTRIX HEALTH COPILOT - STARTING SERVICES (TS/NODE)   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Launch TypeScript backend
Write-Host "`n[1/2] Launching TypeScript backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; npm start"

# 2. Launch Vite frontend
Write-Host "`n[2/2] Launching Vite frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "Altrix Health Copilot is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000/api/health" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
