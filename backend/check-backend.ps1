# Backend Health Check Script
Write-Host "=== Backend Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend is listening
Write-Host "1. Checking if backend is listening on port 3001..." -ForegroundColor Yellow
$listening = netstat -ano | findstr ":3001.*LISTENING"
if ($listening) {
    Write-Host "   Backend is listening on port 3001" -ForegroundColor Green
    $pid = ($listening -split '\s+')[-1]
    Write-Host "   Process ID: $pid" -ForegroundColor Gray
} else {
    Write-Host "   Backend is NOT listening on port 3001" -ForegroundColor Red
    Write-Host "   Please start the backend: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test direct connection
Write-Host "2. Testing direct connection to backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   Backend responded successfully" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Message -like "*timed out*") {
        Write-Host "   Backend is hanging/timing out" -ForegroundColor Red
        Write-Host "   This usually means a database connection issue!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Check:" -ForegroundColor Yellow
        Write-Host "   1. Is PostgreSQL running?" -ForegroundColor Yellow
        Write-Host "   2. Are database credentials correct in .env file?" -ForegroundColor Yellow
        Write-Host "   3. Check backend console logs for errors" -ForegroundColor Yellow
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Check for .env file
Write-Host "3. Checking for .env file..." -ForegroundColor Yellow
if (Test-Path ".\.env") {
    Write-Host "   .env file exists" -ForegroundColor Green
    $envContent = Get-Content ".\.env" | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
    $hasDbPassword = $envContent | Where-Object { $_ -match 'DB_PASSWORD' }
    if ($hasDbPassword) {
        Write-Host "   DB_PASSWORD is set" -ForegroundColor Green
    } else {
        Write-Host "   DB_PASSWORD not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   .env file NOT found" -ForegroundColor Red
    Write-Host "   Create .env with database credentials" -ForegroundColor Yellow
}

Write-Host ""

# Check PostgreSQL service
Write-Host "4. Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($pgService) {
    $running = $pgService | Where-Object { $_.Status -eq 'Running' }
    if ($running) {
        Write-Host "   PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "   PostgreSQL service is NOT running" -ForegroundColor Red
    }
} else {
    Write-Host "   PostgreSQL service not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host "1. Check backend console logs for database connection errors" -ForegroundColor White
Write-Host "2. Verify database credentials in .env file" -ForegroundColor White
Write-Host "3. Ensure PostgreSQL is running and accessible" -ForegroundColor White
Write-Host "4. Restart backend after fixing .env file" -ForegroundColor White
