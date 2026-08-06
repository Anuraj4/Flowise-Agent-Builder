# Flowise One-Click Launch Script (PowerShell)
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          Flowise AI Agent Launcher               " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Check if Docker is installed and running
try {
    $null = docker info 2>&1
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Start Flowise using Docker Compose
Write-Host "Starting Docker container..." -ForegroundColor Yellow
docker compose up -d

# Wait for Flowise server to respond on port 3000
$url = "http://localhost:3000"
$maxRetries = 30
$retryCount = 0
$isReady = $false

Write-Host "Waiting for Flowise to initialize..." -NoNewline -ForegroundColor Yellow

while ($retryCount -lt $maxRetries -and -not $isReady) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $isReady = $true
        }
    } catch {
        # Server still starting
    }
    
    if (-not $isReady) {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $retryCount++
    }
}

Write-Host ""

if ($isReady) {
    Write-Host "Flowise is UP and RUNNING!" -ForegroundColor Green
    Write-Host "Access URL: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Login Credentials:" -ForegroundColor Yellow
    Write-Host "   Username: admin@flowise.local" -ForegroundColor White
    Write-Host "   Password: FlowiseAdmin123!" -ForegroundColor White
    Write-Host "Opening Flowise in browser..." -ForegroundColor Green
    Start-Process $url
} else {
    Write-Host "Flowise container started, but endpoint check timed out." -ForegroundColor Red
    Write-Host "Check status with: docker compose logs -f" -ForegroundColor Yellow
}
