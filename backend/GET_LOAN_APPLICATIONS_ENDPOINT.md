# GET /loan-applications Endpoint Documentation

## Overview

The GET `/loan-applications` endpoint retrieves a paginated and filtered list of loan applications for the authenticated user's company.

## Endpoint Details

- **URL**: `/api/loan-applications`
- **Method**: `GET`
- **Authentication**: Required (JWT Bearer Token)
- **Response Format**: JSON (Paginated)

## Response Structure

```typescript
{
  data: LoanApplication[],        // Array of loan applications
  total: number,                   // Total number of applications (before pagination)
  page: number,                    // Current page number
  limit: number,                   // Number of items per page
  totalPages: number,              // Total number of pages
  hasNext: boolean,                // Whether there is a next page
  hasPrevious: boolean             // Whether there is a previous page
}
```

## Query Parameters

All parameters are optional:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by application status | `Submitted`, `Approved`, `Rejected` |
| `applicantType` | string | Filter by applicant type | `Customer`, `Company` |
| `applicantId` | string | Filter by applicant ID | `customer-uuid` |
| `loanProductId` | string | Filter by loan product ID | `product-uuid` |
| `minAmount` | number | Minimum requested amount | `10000` |
| `maxAmount` | number | Maximum requested amount | `100000` |
| `fromDate` | string | Filter by application date from (ISO 8601) | `2024-01-01` |
| `toDate` | string | Filter by application date to (ISO 8601) | `2024-12-31` |
| `search` | string | Search in application number, applicant ID, remarks | `APP-2024` |
| `sortBy` | string | Sort field | `createdAt`, `applicationDate`, `requestedAmount`, `status`, `applicationNumber` |
| `sortOrder` | string | Sort order | `ASC`, `DESC` (default: `DESC`) |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Results per page (default: 20, max: 100) | `10` |

## Example Requests

### 1. Get All Applications (Default Pagination)

```bash
curl -X GET "http://localhost:3000/api/loan-applications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "applicationNumber": "APP-2024-001",
      "status": "Submitted",
      "requestedAmount": 50000,
      "applicantType": "Customer",
      "createdAt": "2024-01-15T10:30:00Z",
      ...
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2,
  "hasNext": true,
  "hasPrevious": false
}
```

### 2. Filter by Status

```bash
curl -X GET "http://localhost:3000/api/loan-applications?status=Submitted" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Filter by Date Range

```bash
curl -X GET "http://localhost:3000/api/loan-applications?fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Filter by Amount Range

```bash
curl -X GET "http://localhost:3000/api/loan-applications?minAmount=10000&maxAmount=100000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Search Applications

```bash
curl -X GET "http://localhost:3000/api/loan-applications?search=APP-2024" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Pagination

```bash
curl -X GET "http://localhost:3000/api/loan-applications?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Sorting

```bash
curl -X GET "http://localhost:3000/api/loan-applications?sortBy=requestedAmount&sortOrder=DESC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Combined Filters

```bash
curl -X GET "http://localhost:3000/api/loan-applications?status=Approved&minAmount=50000&sortBy=createdAt&sortOrder=DESC&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Usage

### Using the API Client

```typescript
import { loanApplicationsApi } from '@/lib/api/loan-applications';

// Get all applications (default pagination)
const response = await loanApplicationsApi.getAll();
console.log(response.data); // Array of applications
console.log(response.total); // Total count
console.log(response.hasNext); // Has next page

// With filters
const filtered = await loanApplicationsApi.getAll({
  status: 'Submitted',
  minAmount: 10000,
  maxAmount: 100000,
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'DESC'
});
```

### Using React Hook

```typescript
import { useLoanApplications } from '@/lib/hooks/useLoanApplication';

function MyComponent() {
  const { data, isLoading, error } = useLoanApplications({
    status: 'Submitted',
    page: 1,
    limit: 20
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Total: {data?.total}</p>
      <p>Page: {data?.page} of {data?.totalPages}</p>
      {data?.data.map(app => (
        <div key={app.id}>{app.applicationNumber}</div>
      ))}
    </div>
  );
}
```

## Status Values

The `status` parameter accepts these values (from `ApplicationStatus` enum):

- `Draft`
- `Submitted`
- `Under Review`
- `Approved`
- `Rejected`
- `Cancelled`

## Multi-Tenancy

- The endpoint automatically filters by the authenticated user's `companyId`
- Users can only see applications belonging to their company
- The `companyId` is extracted from the JWT token

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Company ID is required"
}
```

## Notes

- Default pagination: `page=1`, `limit=20`
- Maximum `limit`: 100
- Default sorting: `createdAt DESC`
- All date filters use ISO 8601 format (YYYY-MM-DD)
- Search is case-insensitive and searches in:
  - Application number
  - Applicant ID
  - Remarks field

## Testing with Swagger

1. Navigate to `http://localhost:3000/api-docs`
2. Find the `loan-applications` tag
3. Click on `GET /loan-applications`
4. Click "Try it out"
5. Add query parameters as needed
6. Click "Execute"

## Backend Implementation

- **Controller**: `LoanApplicationController.findAll()`
- **Service**: `LoanApplicationService.findAll()`
- **DTO**: `QueryLoanApplicationsDto`
- **Response DTO**: `PaginatedLoanApplicationsResponse`

