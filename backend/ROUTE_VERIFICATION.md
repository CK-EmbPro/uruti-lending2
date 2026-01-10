# Route Verification for Credit Assessment

## Issue
Error: `Cannot POST /api/credit-assessment/applications/{id}/adverse-action-notice`

## Solution

### 1. Restart Backend Server
The most common cause is that the backend server needs to be restarted to register the new routes:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
npm run start:dev
```

### 2. Verify Route Registration
The route should be registered at:
- **Controller**: `@Controller('credit-assessment')`
- **Route**: `@Post('applications/:applicationId/adverse-action-notice')`
- **Full Path**: `/api/credit-assessment/applications/:applicationId/adverse-action-notice`

### 3. Check Module Registration
Verify `CreditAssessmentModule` is imported in `app.module.ts`:
```typescript
imports: [
  // ... other modules
  CreditAssessmentModule,
]
```

### 4. Verify Database Entities
Ensure all entities are properly registered in TypeORM:
- `CreditDecision`
- `UnderwritingReview`
- `FraudAlert`
- `AdverseActionNotice`

### 5. Check Application Status
The adverse action notice can only be generated for applications with status:
- `ApplicationStatus.REJECTED`
- `'Rejected'`
- `'REJECTED'`

### 6. Test the Route
After restarting, test the route:
```bash
curl -X POST http://localhost:3000/api/credit-assessment/applications/{applicationId}/adverse-action-notice \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

## Expected Response
- **201 Created**: Notice generated successfully
- **404 Not Found**: Application not found or not rejected
- **500 Internal Server Error**: Server error (check logs)

## Troubleshooting
1. Check backend logs for compilation errors
2. Verify the module is loaded: Check Swagger UI at `/api/docs`
3. Ensure the application status is "Rejected" before generating notice
4. Check database connection and entity registration

