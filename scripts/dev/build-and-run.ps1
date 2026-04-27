# PowerShell script to build and run the project in Production Mode (Application Mode)
Write-Host "🚀 Starting Application Build Process..." -ForegroundColor Cyan

# 1. Clear previous build
if (Test-Path .next) {
    Remove-Item .next -Recursive -Force
}

# 2. Build the project
Write-Host "📦 Building optimized standalone package..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Check the error digest." -ForegroundColor Red
    process.exit(1)
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# 3. Run the standalone server
Write-Host "🌐 Starting Production Server at http://localhost:3000" -ForegroundColor Cyan
Write-Host "👉 You can now 'Install' the app from your browser's address bar." -ForegroundColor Gray

# Set environment variables for standalone
$env:PORT = "3000"
$env:HOSTNAME = "0.0.0.0"

node .next/standalone/server.js
