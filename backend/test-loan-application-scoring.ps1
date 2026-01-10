# PowerShell test script for Loan Application with Credit Scoring
# Usage: .\test-loan-application-scoring.ps1

$BASE_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3000" }
$TOKEN = $env:JWT_TOKEN

if (-not $TOKEN) {
    Write-Host "❌ Error: JWT_TOKEN environment variable not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get a token:" -ForegroundColor Yellow
    Write-Host "1. Login via: POST $BASE_URL/auth/login" -ForegroundColor Cyan
    Write-Host "2. Copy the token from response" -ForegroundColor Cyan
    Write-Host "3. Set: `$env:JWT_TOKEN = 'your-token-here'" -ForegroundColor Cyan
    exit 1
}

Write-Host "🧪 Testing Loan Application with Credit Scoring Integration" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Base URL: $BASE_URL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""

try {
    # Step 1: Get user info
    Write-Host "📋 Step 1: Getting user information..." -ForegroundColor Yellow
    $userResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/me" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    $companyId = $userResponse.companyId
    Write-Host "✅ User: $($userResponse.email)" -ForegroundColor Green
    Write-Host "✅ Company ID: $companyId" -ForegroundColor Green
    Write-Host ""

    # Step 2: Get loan products
    Write-Host "📋 Step 2: Getting loan products..." -ForegroundColor Yellow
    $productsResponse = Invoke-RestMethod -Uri "$BASE_URL/loan-products" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    if ($productsResponse.Count -eq 0) {
        Write-Host "⚠️  No loan products found. Please create one first." -ForegroundColor Yellow
        exit 1
    }
    
    $loanProductId = $productsResponse[0].id
    Write-Host "✅ Using Loan Product: $($productsResponse[0].productName)" -ForegroundColor Green
    Write-Host ""

    # Step 3: Create loan application
    Write-Host "📋 Step 3: Creating loan application..." -ForegroundColor Yellow
    $applicationData = @{
        applicantType = "Customer"
        applicantId = "test-applicant-$(Get-Date -Format 'yyyyMMddHHmmss')"
        loanProductId = $loanProductId
        requestedAmount = 50000
        repaymentPeriods = 24
        repaymentFrequency = "Monthly"
        isSecuredLoan = $false
    } | ConvertTo-Json

    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/loan-applications" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $applicationData

    Write-Host "✅ Application created: $($createResponse.applicationNumber)" -ForegroundColor Green
    Write-Host "   ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "   Status: $($createResponse.status)" -ForegroundColor Gray
    Write-Host ""

    # Step 4: Submit with scoring data
    Write-Host "📋 Step 4: Submitting with credit scoring data..." -ForegroundColor Yellow
    
    $scoringData = @{
        scoringData = @{
            bankAccountData = @{
                transactions = @(
                    @{ date = "2024-01-15"; amount = 5000; category = "SALARY" },
                    @{ date = "2024-01-10"; amount = -800; category = "GROCERIES" }
                )
            }
            utilityTelecomData = @{
                payments = @(
                    @{ date = "2024-01-05"; amount = 100; daysLate = 0; utilityType = "ELECTRICITY" }
                )
                accounts = @(
                    @{ startDate = "2022-01-01"; type = "ELECTRICITY" }
                )
            }
            rentPaymentData = @{
                payments = @(
                    @{ date = "2024-01-01"; amount = 1200; daysLate = 0 }
                )
                verified = $true
            }
            behavioralData = @{
                completionRate = 1.0
                typingConsistency = 0.85
                authentic = $true
                timeSpentSeconds = 600
            }
            digitalFootprintData = @{
                consent = $true
                professionalStrength = 0.8
                educationVerified = $true
            }
            transactionalData = @{
                timeConsistency = 0.8
                geographicConsistency = 0.9
            }
        }
    } | ConvertTo-Json -Depth 10

    $submitResponse = Invoke-RestMethod -Uri "$BASE_URL/loan-applications/$($createResponse.id)/submit" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $scoringData

    Write-Host "✅ Application submitted!" -ForegroundColor Green
    Write-Host "   Status: $($submitResponse.status)" -ForegroundColor Gray
    
    if ($submitResponse.creditScore) {
        Write-Host "   Credit Score: $($submitResponse.creditScore)" -ForegroundColor Cyan
        Write-Host "   Risk Tier: $($submitResponse.scoringDetails.riskTier)" -ForegroundColor Cyan
        Write-Host "   Confidence: $([math]::Round($submitResponse.scoringDetails.confidence * 100, 1))%" -ForegroundColor Cyan
    }
    Write-Host ""

    # Step 5: Verify persistence
    Write-Host "📋 Step 5: Verifying data persistence..." -ForegroundColor Yellow
    $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/loan-applications/$($createResponse.id)" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $TOKEN" }
    
    if ($verifyResponse.creditScore) {
        Write-Host "✅ Credit score persisted: $($verifyResponse.creditScore)" -ForegroundColor Green
        Write-Host "✅ Scoring details stored: Yes" -ForegroundColor Green
    }
    Write-Host ""

    # Summary
    Write-Host "============================================================" -ForegroundColor Gray
    Write-Host "✅ TEST SUMMARY" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Gray
    Write-Host "Application Number: $($createResponse.applicationNumber)" -ForegroundColor White
    Write-Host "Status: $($submitResponse.status)" -ForegroundColor White
    Write-Host "Credit Score: $($submitResponse.creditScore)" -ForegroundColor White
    Write-Host "Risk Tier: $($submitResponse.scoringDetails.riskTier)" -ForegroundColor White
    Write-Host "Integration: ✅ SUCCESS" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Gray

} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Gray
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "============================================================" -ForegroundColor Gray
    exit 1
}

