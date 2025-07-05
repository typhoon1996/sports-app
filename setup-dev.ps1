# Sports App Development Setup Script
# Run this script to set up your development environment

Write-Host "🚀 Setting up Sports App Development Environment..." -ForegroundColor Green

# Check if Docker is installed
try {
    docker --version
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Start Docker containers
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Blue
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm install

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
Set-Location ../frontend
npm install

# Go back to root directory
Set-Location ..

Write-Host "✅ Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "2. Start the frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "📊 Database connection:" -ForegroundColor Yellow
Write-Host "Host: localhost" -ForegroundColor White
Write-Host "Port: 5432" -ForegroundColor White
Write-Host "Database: sports_app" -ForegroundColor White
Write-Host "Username: postgres" -ForegroundColor White
Write-Host "Password: sports2025" -ForegroundColor White
