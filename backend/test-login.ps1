# Test Login Endpoint Script
Write-Host "Testing Login Endpoint..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET -ErrorAction Stop
    Write-Host "   ✓ Health check passed" -ForegroundColor Green
    Write-Host "   Response: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This indicates a database connection issue!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   1. PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "   2. Database credentials in .env file" -ForegroundColor Yellow
    Write-Host "   3. Backend server is restarted" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Database Health Check
Write-Host "2. Testing Database Connection..." -ForegroundColor Yellow
try {
    $dbHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/health/database" -Method GET -ErrorAction Stop
    Write-Host "   ✓ Database connection successful" -ForegroundColor Green
    Write-Host "   Users table exists: $($dbHealth.usersTableExists)" -ForegroundColor Gray
    Write-Host "   User count: $($dbHealth.userCount)" -ForegroundColor Gray
    
    if ($dbHealth.userCount -eq 0) {
        Write-Host ""
        Write-Host "   ⚠ No users found. Seeding users..." -ForegroundColor Yellow
        try {
            $seedResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/seed" -Method POST -Headers @{"Content-Type"="application/json"} -ErrorAction Stop
            Write-Host "   ✓ Users seeded successfully" -ForegroundColor Green
        } catch {
            Write-Host "   ✗ Failed to seed users: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ✗ Database check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Login Test
Write-Host "3. Testing Login Endpoint..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@urutilending.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -ErrorAction Stop
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Roles: $($loginResponse.user.roles -join ', ')" -ForegroundColor Gray
    Write-Host "   Token: $($loginResponse.access_token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Login failed!" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    # Try to get error response
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
        
        # Try to parse as JSON
        try {
            $errorJson = $responseBody | ConvertFrom-Json
            Write-Host "   Error Details:" -ForegroundColor Yellow
            $errorJson | ConvertTo-Json -Depth 5 | Write-Host
        } catch {
            # Not JSON, just show raw response
        }
    } catch {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "All tests passed! ✓" -ForegroundColor Green

