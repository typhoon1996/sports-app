#!/usr/bin/env pwsh
# Sports App - Enhanced Development Startup Script
# Version: 2.0
# This script provides a comprehensive development environment setup

param(
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Setup,
    [switch]$Stop,
    [switch]$Status,
    [switch]$Help
)

# Color scheme for better visibility
$Colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'Cyan'
    Primary = 'Blue'
    Secondary = 'Magenta'
}

function Show-Header {
    Clear-Host
    Write-Host "╔══════════════════════════════════════╗" -ForegroundColor $Colors.Primary
    Write-Host "║        🏀 SPORTS APP LAUNCHER 🏀     ║" -ForegroundColor $Colors.Primary
    Write-Host "║            Development v2.0          ║" -ForegroundColor $Colors.Primary
    Write-Host "╚══════════════════════════════════════╝" -ForegroundColor $Colors.Primary
    Write-Host ""
}

function Show-Help {
    Show-Header
    Write-Host "Available Commands:" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-Host "  ./start-dev.ps1                  Start development environment" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Setup           Initial project setup" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Status          Check service status" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Logs            Show Docker logs" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Clean           Clean and restart everything" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Stop            Stop all services" -ForegroundColor White
    Write-Host "  ./start-dev.ps1 -Help            Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Services:" -ForegroundColor $Colors.Info
    Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor $Colors.Success
    Write-Host "  Backend:     http://localhost:3001" -ForegroundColor $Colors.Success
    Write-Host "  Database:    localhost:5432" -ForegroundColor $Colors.Success
    Write-Host "  Redis:       localhost:6379" -ForegroundColor $Colors.Success
    Write-Host ""
    exit
}

function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor $Colors.Info
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor $Colors.Success
    } catch {
        Write-Host "  ❌ Node.js not found. Please install Node.js 18+" -ForegroundColor $Colors.Error
        exit 1
    }
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Host "  ✅ Docker: $dockerVersion" -ForegroundColor $Colors.Success
    } catch {
        Write-Host "  ❌ Docker not found. Please install Docker Desktop" -ForegroundColor $Colors.Error
        Write-Host "     Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor $Colors.Warning
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "  ✅ npm: $npmVersion" -ForegroundColor $Colors.Success
    } catch {
        Write-Host "  ❌ npm not found" -ForegroundColor $Colors.Error
        exit 1
    }
    
    Write-Host ""
}

function Test-DockerServices {
    Write-Host "🐳 Checking Docker services..." -ForegroundColor $Colors.Info
    
    $dbStatus = docker ps --filter "name=sports-db" --format "{{.Status}}" 2>$null
    $redisStatus = docker ps --filter "name=sports-redis" --format "{{.Status}}" 2>$null
    
    if ($dbStatus -and $dbStatus.StartsWith("Up")) {
        Write-Host "  ✅ PostgreSQL: Running" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ⏳ PostgreSQL: Not running" -ForegroundColor $Colors.Warning
        return $false
    }
    
    if ($redisStatus -and $redisStatus.StartsWith("Up")) {
        Write-Host "  ✅ Redis: Running" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ⏳ Redis: Not running" -ForegroundColor $Colors.Warning
        return $false
    }
    
    return $true
}

function Start-DockerServices {
    Write-Host "🚀 Starting Docker services..." -ForegroundColor $Colors.Primary
    
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Docker services started successfully" -ForegroundColor $Colors.Success
        Write-Host "  ⏳ Waiting for services to be ready..." -ForegroundColor $Colors.Info
        Start-Sleep -Seconds 8
    } else {
        Write-Host "  ❌ Failed to start Docker services" -ForegroundColor $Colors.Error
        exit 1
    }
}

function Test-Dependencies {
    Write-Host "📦 Checking dependencies..." -ForegroundColor $Colors.Info
    
    # Check backend dependencies
    if (Test-Path "backend/node_modules") {
        Write-Host "  ✅ Backend dependencies installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ⏳ Installing backend dependencies..." -ForegroundColor $Colors.Warning
        Push-Location backend
        npm install
        Pop-Location
    }
    
    # Check frontend dependencies
    if (Test-Path "frontend/node_modules") {
        Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ⏳ Installing frontend dependencies..." -ForegroundColor $Colors.Warning
        Push-Location frontend
        npm install
        Pop-Location
    }
    
    # Check root dependencies
    if (Test-Path "node_modules") {
        Write-Host "  ✅ Root dependencies installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ⏳ Installing root dependencies..." -ForegroundColor $Colors.Warning
        npm install
    }
}

function Start-Development {
    Write-Host "🎯 Starting development servers..." -ForegroundColor $Colors.Primary
    Write-Host ""
    
    # Use the optimized npm script from root
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Starting concurrently...' -ForegroundColor Green; npm run dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "🎉 Development environment is starting!" -ForegroundColor $Colors.Success
    Write-Host ""
    Write-Host "📱 Application URLs:" -ForegroundColor $Colors.Info
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor $Colors.Success
    Write-Host "   Backend:   http://localhost:3001" -ForegroundColor $Colors.Success
    Write-Host "   API:       http://localhost:3001/api" -ForegroundColor $Colors.Success
    Write-Host "   Health:    http://localhost:3001/health" -ForegroundColor $Colors.Success
    Write-Host ""
    Write-Host "🗄️  Database Info:" -ForegroundColor $Colors.Info
    Write-Host "   Host:      localhost:5432" -ForegroundColor White
    Write-Host "   Database:  sports_app" -ForegroundColor White
    Write-Host "   Username:  postgres" -ForegroundColor White
    Write-Host "   Password:  sports2025" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Management:" -ForegroundColor $Colors.Info
    Write-Host "   Stop:      ./start-dev.ps1 -Stop" -ForegroundColor White
    Write-Host "   Logs:      ./start-dev.ps1 -Logs" -ForegroundColor White
    Write-Host "   Status:    ./start-dev.ps1 -Status" -ForegroundColor White
    Write-Host ""
}

function Show-Status {
    Show-Header
    Test-Prerequisites
    $dockerRunning = Test-DockerServices
    
    Write-Host "📊 Service Status:" -ForegroundColor $Colors.Info
    
    # Check if development servers are running
    $frontendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*dev*" }
    $backendProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*ts-node-dev*" }
    
    if ($frontendProcess) {
        Write-Host "  ✅ Frontend: Running (PID: $($frontendProcess.Id))" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ❌ Frontend: Not running" -ForegroundColor $Colors.Error
    }
    
    if ($backendProcess) {
        Write-Host "  ✅ Backend: Running (PID: $($backendProcess.Id))" -ForegroundColor $Colors.Success
    } else {
        Write-Host "  ❌ Backend: Not running" -ForegroundColor $Colors.Error
    }
    
    Write-Host ""
}

function Show-Logs {
    Show-Header
    Write-Host "📋 Docker Container Logs:" -ForegroundColor $Colors.Info
    Write-Host ""
    docker-compose logs -f --tail=50
}

function Stop-Services {
    Show-Header
    Write-Host "🛑 Stopping all services..." -ForegroundColor $Colors.Warning
    
    # Stop Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "  🔄 Stopping Node.js processes..." -ForegroundColor $Colors.Info
        $nodeProcesses | Stop-Process -Force
        Write-Host "  ✅ Node.js processes stopped" -ForegroundColor $Colors.Success
    }
    
    # Stop Docker services
    Write-Host "  🔄 Stopping Docker services..." -ForegroundColor $Colors.Info
    docker-compose down
    Write-Host "  ✅ Docker services stopped" -ForegroundColor $Colors.Success
    
    Write-Host ""
    Write-Host "🎯 All services have been stopped" -ForegroundColor $Colors.Success
}

function Reset-Environment {
    Show-Header
    Write-Host "🧹 Cleaning development environment..." -ForegroundColor $Colors.Warning
    
    # Stop services first
    Stop-Services
    
    # Clean npm caches and builds
    Write-Host "  🔄 Cleaning build artifacts..." -ForegroundColor $Colors.Info
    npm run clean 2>$null
    
    # Reset Docker volumes
    Write-Host "  🔄 Resetting Docker volumes..." -ForegroundColor $Colors.Info
    docker volume prune -f
    
    Write-Host "  ✅ Environment cleaned" -ForegroundColor $Colors.Success
    Write-Host ""
    
    # Restart everything
    Start-Main
}

function Initialize-Project {
    Show-Header
    Write-Host "🎯 Setting up Sports App development environment..." -ForegroundColor $Colors.Primary
    Write-Host ""
    
    Test-Prerequisites
    Test-Dependencies
    
    # Create .env files if they don't exist
    if (!(Test-Path "backend/.env")) {
        Write-Host "  📝 Creating backend .env file..." -ForegroundColor $Colors.Info
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Host "  ✅ Backend .env created from .env.example" -ForegroundColor $Colors.Success
        Write-Host "  ⚠️  Please review and update backend/.env with your settings" -ForegroundColor $Colors.Warning
    }
    
    Start-DockerServices
    
    Write-Host "🎉 Setup complete!" -ForegroundColor $Colors.Success
    Write-Host "   Run './start-dev.ps1' to start development" -ForegroundColor $Colors.Info
    Write-Host ""
}

function Start-Main {
    Show-Header
    Test-Prerequisites
    
    # Check if Docker services are running
    $dockerRunning = Test-DockerServices
    if (!$dockerRunning) {
        Start-DockerServices
    }
    
    Test-Dependencies
    Start-Development
}

# Main execution logic
if ($Help) { Show-Help }
elseif ($Setup) { Initialize-Project }
elseif ($Status) { Show-Status }
elseif ($Logs) { Show-Logs }
elseif ($Stop) { Stop-Services }
elseif ($Clean) { Reset-Environment }
else { Start-Main }
