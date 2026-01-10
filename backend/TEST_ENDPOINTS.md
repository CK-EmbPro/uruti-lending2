# Testing Reporting & Analytics Endpoints

## Prerequisites

1. **Restart the backend server** to load new routes:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run start:dev
   ```

2. **Verify server is running**:
   - Check: http://localhost:3000/api-docs
   - Look for new endpoints under "reports" tag

## Endpoints to Test

### 1. Portfolio Performance Dashboard (UC-036)

**GET** `/api/reports/portfolio-performance`

**Query Parameters**:
- `fromDate` (optional): ISO date string (e.g., "2024-01-01")
- `toDate` (optional): ISO date string (e.g., "2024-12-31")
- `companyId` (optional): UUID
- `loanProductId` (optional): UUID
- `segmentType` (optional): "PRODUCT" | "STATUS" | "DELINQUENCY_STAGE" | "GEOGRAPHY"
- `includeTrends` (optional): boolean

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/reports/portfolio-performance?fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "summary": {
    "totalLoans": 100,
    "totalDisbursed": 1000000,
    "totalOutstanding": 750000,
    "totalDelinquentLoans": 5,
    "totalDelinquentAmount": 50000,
    "delinquencyRate": 5.0,
    "totalInterestEarned": 100000,
    "totalFeesEarned": 10000,
    "netProfitMargin": 11.0
  },
  "byProduct": [...],
  "byStatus": {...},
  "byDelinquencyStage": [...],
  "trends": [...]
}
```

### 2. Generate Regulatory Report (UC-037)

**POST** `/api/reports/regulatory-reports`

**Request Body**:
```json
{
  "reportType": "HMDA",
  "reportDate": "2024-12-31",
  "periodStartDate": "2024-01-01",
  "periodEndDate": "2024-12-31",
  "companyId": "optional-uuid"
}
```

**Report Types**: `HMDA`, `CRA`, `CALL_REPORT`, `STRESS_TEST`

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/reports/regulatory-reports" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "HMDA",
    "reportDate": "2024-12-31"
  }'
```

**Review Report**:
```bash
POST /api/reports/regulatory-reports/{id}/review
{
  "remarks": "Reviewed and approved",
  "reviewed": true
}
```

**Submit Report**:
```bash
POST /api/reports/regulatory-reports/{id}/submit
{
  "regulatorName": "FDIC",
  "submissionReference": "REF-2024-001",
  "remarks": "Submitted to regulator"
}
```

### 3. Generate Roll Rate Analysis (UC-038)

**POST** `/api/reports/roll-rate-analysis`

**Request Body**:
```json
{
  "analysisType": "ROLL_RATE",
  "analysisDate": "2024-12-31",
  "periodStartDate": "2024-01-01",
  "periodEndDate": "2024-12-31",
  "companyId": "optional-uuid",
  "loanProductId": "optional-uuid",
  "includeForecast": true,
  "includeVintage": false,
  "includeCohort": false
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/reports/roll-rate-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisDate": "2024-12-31",
    "includeForecast": true
  }'
```

**Expected Response**:
```json
{
  "id": "uuid",
  "analysisType": "ROLL_RATE",
  "rollRateMatrix": {...},
  "currentTo30Days": 2.5,
  "days30To60Days": 5.0,
  "forecastedLosses": 10000,
  "lossRate": 1.5,
  ...
}
```

### 4. Generate Fair Lending Analysis (UC-039)

**POST** `/api/reports/fair-lending-analysis`

**Request Body**:
```json
{
  "analysisType": "APPROVAL_RATE",
  "analysisDate": "2024-12-31",
  "periodStartDate": "2024-01-01",
  "periodEndDate": "2024-12-31",
  "companyId": "optional-uuid",
  "loanProductId": "optional-uuid"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:3000/api/reports/fair-lending-analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "analysisDate": "2024-12-31",
    "analysisType": "APPROVAL_RATE"
  }'
```

**Review Analysis**:
```bash
POST /api/reports/fair-lending-analysis/{id}/review
{
  "remarks": "Analysis reviewed",
  "reviewed": true,
  "correctiveActionRequired": false,
  "correctiveActionPlan": "No action needed"
}
```

## Testing with Swagger UI

1. Navigate to: http://localhost:3000/api-docs
2. Find the "reports" tag
3. Look for:
   - `GET /api/reports/portfolio-performance`
   - `POST /api/reports/regulatory-reports`
   - `POST /api/reports/roll-rate-analysis`
   - `POST /api/reports/fair-lending-analysis`
4. Click "Try it out" to test each endpoint

## Testing with PowerShell

```powershell
# Portfolio Performance
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/portfolio-performance?fromDate=2024-01-01&toDate=2024-12-31" -Method GET
$response | ConvertTo-Json -Depth 5

# Regulatory Report
$body = @{
    reportType = "HMDA"
    reportDate = "2024-12-31"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/regulatory-reports" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 5

# Roll Rate Analysis
$body = @{
    analysisDate = "2024-12-31"
    includeForecast = $true
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/roll-rate-analysis" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 5

# Fair Lending Analysis
$body = @{
    analysisDate = "2024-12-31"
    analysisType = "APPROVAL_RATE"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/reports/fair-lending-analysis" -Method POST -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 5
```

## Expected Issues

1. **404 Not Found**: Server needs to be restarted to load new routes
2. **401 Unauthorized**: Endpoints may require JWT authentication (check if `@UseGuards(JwtAuthGuard)` is applied)
3. **500 Internal Server Error**: Check server logs for details

## Verification Checklist

- [ ] Server restarted after adding new endpoints
- [ ] Endpoints visible in Swagger UI
- [ ] Portfolio Performance returns data
- [ ] Regulatory Report generation works
- [ ] Roll Rate Analysis generates results
- [ ] Fair Lending Analysis completes successfully
- [ ] Database tables created (check with migration status)

