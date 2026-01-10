# Frappe Docker Setup Script for PowerShell
# This script sets up Frappe with ERPNext and Lending app
# 
# NOTE: For best results, use the official frappe_docker repository:
# git clone https://github.com/frappe/frappe_docker.git
# See DOCKER_SETUP.md for detailed instructions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frappe Docker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "RECOMMENDED: Use the official frappe_docker repository for best results." -ForegroundColor Yellow
Write-Host "See DOCKER_SETUP.md for instructions." -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Continue with this setup? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit 0
}

# Start services
Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "Waiting for services to be ready (this may take a minute)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Setup Required" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please run the following commands manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Access the container:" -ForegroundColor Cyan
Write-Host "   docker-compose exec frappe bash" -ForegroundColor White
Write-Host ""
Write-Host "2. Inside the container, run:" -ForegroundColor Cyan
Write-Host "   bench init frappe-bench --frappe-branch version-15" -ForegroundColor White
Write-Host "   cd frappe-bench" -ForegroundColor White
Write-Host "   bench new-site lending.localhost --db-root-password admin --admin-password admin" -ForegroundColor White
Write-Host "   bench get-app erpnext https://github.com/frappe/erpnext" -ForegroundColor White
Write-Host "   bench --site lending.localhost install-app erpnext" -ForegroundColor White
Write-Host "   bench get-app lending https://github.com/frappe/lending" -ForegroundColor White
Write-Host "   bench --site lending.localhost install-app lending" -ForegroundColor White
Write-Host ""
Write-Host "3. Access Frappe at: http://localhost:8000" -ForegroundColor Green
Write-Host "   Username: Administrator" -ForegroundColor Green
Write-Host "   Password: admin" -ForegroundColor Green
Write-Host ""
Write-Host "For automated setup, use the official frappe_docker repository." -ForegroundColor Yellow
Write-Host "See DOCKER_SETUP.md for details." -ForegroundColor Yellow

