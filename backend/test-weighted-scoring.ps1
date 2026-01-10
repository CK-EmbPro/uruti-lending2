# PowerShell test script for Weighted Credit Scoring Engine API
# Usage: .\test-weighted-scoring.ps1

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

Write-Host "🧪 Testing Weighted Credit Scoring Engine API" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "Base URL: $BASE_URL" -ForegroundColor Cyan
Write-Host "Endpoint: /credit-scoring-engine/calculate-weighted-score" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""

# Sample request data
$requestData = @{
    applicantId = "test-applicant-$(Get-Date -Format 'yyyyMMddHHmmss')"
    bankAccountData = @{
        transactions = @(
            @{
                date = "2024-01-15"
                amount = 5000
                category = "SALARY"
                description = "Monthly salary deposit"
            },
            @{
                date = "2024-01-10"
                amount = -800
                category = "GROCERIES"
                description = "Grocery store purchase"
            }
        )
    }
    utilityTelecomData = @{
        payments = @(
            @{
                date = "2024-01-05"
                amount = 100
                daysLate = 0
                utilityType = "ELECTRICITY"
            }
        )
        accounts = @(
            @{
                startDate = "2022-01-01"
                type = "ELECTRICITY"
            }
        )
    }
    rentPaymentData = @{
        payments = @(
            @{
                date = "2024-01-01"
                amount = 1200
                daysLate = 0
            }
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
} | ConvertTo-Json -Depth 10

Write-Host "📤 Sending request..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$BASE_URL/credit-scoring-engine/calculate-weighted-score" `
        -Method Post `
        -Headers $headers `
        -Body $requestData `
        -ErrorAction Stop

    Write-Host "✅ Success! Response received:" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Gray
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host "============================================================" -ForegroundColor Gray
    Write-Host ""

    # Display summary
    if ($response.finalScore) {
        Write-Host "📊 SCORING SUMMARY:" -ForegroundColor Cyan
        Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
        Write-Host "Final Score: $($response.finalScore) ($($response.riskTier) risk tier)" -ForegroundColor White
        Write-Host "Confidence: $([math]::Round($response.confidence * 100, 1))%" -ForegroundColor White
        Write-Host "Processing Time: $($response.processingTimeMs)ms" -ForegroundColor White
        Write-Host ""

        if ($response.scoreBreakdown) {
            Write-Host "📈 Score Breakdown:" -ForegroundColor Cyan
            Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
            if ($response.scoreBreakdown.traditional) {
                Write-Host "Traditional Bureau: $($response.scoreBreakdown.traditional.score) (30% weight)" -ForegroundColor White
            }
            if ($response.scoreBreakdown.alternative) {
                Write-Host "Alternative Financial: $($response.scoreBreakdown.alternative.score) (40% weight)" -ForegroundColor White
            }
            if ($response.scoreBreakdown.behavioral) {
                Write-Host "Behavioral & Digital: $($response.scoreBreakdown.behavioral.score) (30% weight)" -ForegroundColor White
            }
            Write-Host ""
        }

        if ($response.explanation) {
            Write-Host "💡 Explanation:" -ForegroundColor Cyan
            Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
            Write-Host $response.explanation -ForegroundColor White
            Write-Host ""
        }
    }

    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    exit 0

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
        Write-Host "Make sure the backend server is running on $BASE_URL" -ForegroundColor Yellow
    }
    
    Write-Host "============================================================" -ForegroundColor Gray
    exit 1
}

