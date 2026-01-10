# Loan Repayment Endpoint Improvements

## Summary

Enhanced the GET `/loan-repayments` endpoint with pagination, filtering, and sorting capabilities, similar to the loan applications endpoint. This improves performance and scalability, especially for dashboards that only need recent repayments.

## Changes Made

### Backend

1. **Created Query DTO** (`backend/src/modules/loan-repayment/dto/query-loan-repayments.dto.ts`)
   - Added filtering: `loanId`, `repaymentType`, `fromDate`, `toDate`, `minAmount`, `maxAmount`, `search`
   - Added sorting: `sortBy`, `sortOrder`
   - Added pagination: `page`, `limit`
   - Created `PaginatedLoanRepaymentsResponse` DTO

2. **Updated Service** (`backend/src/modules/loan-repayment/loan-repayment.service.ts`)
   - Modified `findAll()` to accept filters object
   - Implemented pagination with metadata (total, page, limit, totalPages, hasNext, hasPrevious)
   - Added support for all filter types
   - Added sorting with allowed fields validation

3. **Updated Controller** (`backend/src/modules/loan-repayment/loan-repayment.controller.ts`)
   - Changed to use `QueryLoanRepaymentsDto` instead of individual query parameters
   - Updated Swagger documentation
   - Returns `PaginatedLoanRepaymentsResponse`

### Frontend

1. **Updated API Client** (`frontend/lib/api/repayments.ts`)
   - Added `LoanRepaymentFilters` interface
   - Added `PaginatedLoanRepaymentsResponse` interface
   - Updated `getAll()` to accept filters and return paginated response
   - Enhanced logging for debugging

2. **Updated Hook** (`frontend/lib/hooks/useRepayment.ts`)
   - Updated `useRepayments()` to accept filters parameter
   - Returns typed `PaginatedLoanRepaymentsResponse`
   - Includes filters in query key for proper caching

3. **Optimized Dashboard** (`frontend/app/(dashboard)/dashboard/page.tsx`)
   - Now fetches only last 30 days of repayments
   - Limits to 20 most recent repayments
   - Sorted by posting date (newest first)
   - Handles paginated response correctly

4. **Updated Other Pages**
   - `loans/[id]/page.tsx`: Updated to use paginated response with loanId filter
   - `repayments/page.tsx`: Updated to use paginated response

## API Usage Examples

### Get All Repayments (Paginated)
```bash
GET /api/loan-repayments?page=1&limit=20
```

### Get Recent Repayments (Last 30 Days)
```bash
GET /api/loan-repayments?fromDate=2024-01-01&limit=20&sortBy=postingDate&sortOrder=DESC
```

### Filter by Loan
```bash
GET /api/loan-repayments?loanId=uuid&page=1&limit=10
```

### Filter by Amount Range
```bash
GET /api/loan-repayments?minAmount=1000&maxAmount=10000
```

### Search Repayments
```bash
GET /api/loan-repayments?search=REF-2024
```

## Response Format

```json
{
  "data": [
    {
      "id": "uuid",
      "loanId": "loan-uuid",
      "postingDate": "2024-01-15",
      "amountPaid": 5000,
      "repaymentType": "Normal Repayment",
      ...
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasNext": true,
  "hasPrevious": false
}
```

## Dashboard Optimization

The dashboard now:
- Fetches only last 30 days of repayments
- Limits to 20 most recent items
- Reduces API payload size
- Improves page load performance

## Benefits

1. **Performance**: Pagination reduces data transfer and improves response times
2. **Scalability**: Can handle large numbers of repayments efficiently
3. **Flexibility**: Rich filtering and sorting options
4. **User Experience**: Dashboard loads faster with optimized queries
5. **Consistency**: Matches the pattern used in loan applications endpoint

## Backward Compatibility

The endpoint maintains backward compatibility:
- If no filters are provided, returns default pagination (page 1, limit 20)
- Old code using `loanId` parameter still works (now passed as filter)
- Frontend gracefully handles both old and new response formats during transition

## Testing

Test the endpoint using:
- Swagger UI: `http://localhost:3000/api-docs`
- Browser console: Check debug logs for repayment API calls
- Network tab: Verify request parameters and response format

