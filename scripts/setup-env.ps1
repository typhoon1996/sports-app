#!/usr/bin/env pwsh
# Environment Setup Script for Sports App
# This script helps configure environment variables and initial setup

param(
    [switch]$Force,
    [switch]$Help
)

$Colors = @{
    Success = 'Green'
    Warning = 'Yellow'
    Error = 'Red'
    Info = 'Cyan'
    Primary = 'Blue'
}

function Show-Help {
    Write-Host "Environment Setup Script" -ForegroundColor $Colors.Primary
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  ./scripts/setup-env.ps1         Setup environment files"
    Write-Host "  ./scripts/setup-env.ps1 -Force  Overwrite existing files"
    Write-Host "  ./scripts/setup-env.ps1 -Help   Show this help"
    Write-Host ""
    exit
}

function Create-BackendEnv {
    $envPath = "backend/.env"
    $examplePath = "backend/.env.example"
    
    if ((Test-Path $envPath) -and !$Force) {
        Write-Host "  ℹ️  Backend .env already exists. Use -Force to overwrite" -ForegroundColor $Colors.Info
        return
    }
    
    if (!(Test-Path $examplePath)) {
        Write-Host "  ❌ Backend .env.example not found" -ForegroundColor $Colors.Error
        return
    }
    
    Copy-Item $examplePath $envPath
    Write-Host "  ✅ Created backend/.env from .env.example" -ForegroundColor $Colors.Success
    
    # Generate a random JWT secret
    $jwtSecret = -join ((1..64) | ForEach-Object { Get-Random -InputObject ([char[]]"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") })
    
    # Update the .env file with generated values
    $envContent = Get-Content $envPath
    $envContent = $envContent -replace "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production", "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace "NODE_ENV=development", "NODE_ENV=development"
    
    Set-Content -Path $envPath -Value $envContent
    Write-Host "  🔐 Generated secure JWT secret" -ForegroundColor $Colors.Success
}

function Create-DirectoryStructure {
    $directories = @(
        "backend/logs",
        "backend/uploads",
        "backend/dist",
        "frontend/.next",
        "frontend/out",
        "docs",
        "scripts",
        "tests"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  📁 Created directory: $dir" -ForegroundColor $Colors.Info
        }
    }
}

function Create-GitIgnoreEntries {
    $backendGitignore = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Dependency directories
.npm
.yarn-integrity

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# Logs
logs/
*.log

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Uploads
uploads/
temp/

# Database
*.sqlite
*.db
"@

    $frontendGitignore = @"
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
"@

    if (!(Test-Path "backend/.gitignore")) {
        Set-Content -Path "backend/.gitignore" -Value $backendGitignore
        Write-Host "  📄 Created backend/.gitignore" -ForegroundColor $Colors.Info
    }
    
    if (!(Test-Path "frontend/.gitignore")) {
        Set-Content -Path "frontend/.gitignore" -Value $frontendGitignore
        Write-Host "  📄 Updated frontend/.gitignore" -ForegroundColor $Colors.Info
    }
}

function Show-Summary {
    Write-Host ""
    Write-Host "🎉 Environment setup complete!" -ForegroundColor $Colors.Success
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor $Colors.Info
    Write-Host "1. Review and update backend/.env with your API keys" -ForegroundColor White
    Write-Host "2. Configure Google Maps API key if needed" -ForegroundColor White
    Write-Host "3. Set up Firebase credentials if using push notifications" -ForegroundColor White
    Write-Host "4. Run './start-dev.ps1' to start development" -ForegroundColor White
    Write-Host ""
    Write-Host "Important files to configure:" -ForegroundColor $Colors.Warning
    Write-Host "  backend/.env - API keys and database config" -ForegroundColor White
    Write-Host ""
}

# Main execution
if ($Help) { Show-Help }

Write-Host "🔧 Setting up Sports App environment..." -ForegroundColor $Colors.Primary
Write-Host ""

Create-DirectoryStructure
Create-BackendEnv
Create-GitIgnoreEntries
Show-Summary
