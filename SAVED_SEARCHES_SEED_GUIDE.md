# Saved Searches Seed Guide

## Overview

This guide explains how to create saved searches for quick access to common loan scenarios and data views.

## What Are Saved Searches?

Saved searches are pre-configured search queries that users can quickly access without having to re-enter search criteria. They help improve productivity by providing instant access to frequently used filters and queries.

## Pre-configured Saved Searches

The seed script creates the following useful saved searches:

### Loan Searches
- **Active Loans** - All currently active loans (Default)
- **Overdue Loans** - Loans that are past due
- **High Value Loans** - Loans over $50,000
- **Loans This Month** - Loans created this month
- **Disbursed Loans** - All disbursed loans
- **Closed Loans** - All closed/completed loans

### Loan Application Searches
- **Pending Applications** - Applications pending review (Default)
- **Approved Applications** - Recently approved applications
- **Rejected Applications** - Applications that were rejected
- **Under Review Applications** - Applications currently under review
- **High Amount Applications** - Applications requesting $25,000 or more

### Loan Product Searches
- **All Products** - All available loan products (Default)
- **Personal Loans** - Personal loan products
- **Business Loans** - Business loan products
- **Micro Loans** - Micro lending products

### Repayment Searches
- **Recent Repayments** - Repayments from the last 30 days
- **Large Repayments** - Repayments over $5,000

### Disbursement Searches
- **Recent Disbursements** - Disbursements from the last 30 days
- **Large Disbursements** - Disbursements over $10,000

### Global Searches
- **All Recent Activity** - Recent activity across all entities

## Usage

### Option 1: Run Seed Script (Recommended)

**For default user (first admin user found):**
```bash
npm run seed:saved-searches
```

**For specific user:**
```bash
npm run seed:saved-searches <user-id>
```

### Option 2: Create via API

You can also create saved searches programmatically via the API:

```typescript
POST /api/search/saved-searches
{
  "name": "My Custom Search",
  "description": "Custom search description",
  "entityType": "Loan",
  "filters": {
    "status": "Active",
    "minAmount": 10000
  },
  "sortBy": {
    "createdAt": "DESC"
  },
  "limit": 50,
  "isDefault": false
}
```

## Using Saved Searches

### In the Frontend

1. **Search Page**: Navigate to `/search`
2. **Saved Searches Section**: View all saved searches at the top of the page
3. **Quick Access**: Click any saved search to instantly apply its filters
4. **Default Searches**: Default searches are marked with a star (⭐) and appear first

### In the API

```typescript
// Get all saved searches
GET /api/search/saved-searches

// Get saved searches for specific entity type
GET /api/search/saved-searches?type=Loan

// Use a saved search
POST /api/search/saved-searches/:id/use

// Execute search with saved search filters
GET /api/search?q=&type=Loan&filters={"status":"Active"}
```

## Creating Custom Saved Searches

### Via Frontend

1. Navigate to `/search`
2. Enter your search criteria
3. Click "Save" button
4. Enter a name and description
5. Optionally set as default

### Via API

```bash
POST /api/search/saved-searches
Content-Type: application/json

{
  "name": "High-Risk Loans",
  "description": "Loans with high risk indicators",
  "entityType": "Loan",
  "filters": {
    "status": "Overdue",
    "daysPastDue": { "$gte": 30 }
  },
  "sortBy": {
    "daysPastDue": "DESC"
  },
  "limit": 100,
  "isDefault": false
}
```

## Best Practices

1. **Use Descriptive Names**: Name searches clearly (e.g., "Overdue Loans This Month")
2. **Set Defaults Wisely**: Only set 1 default per entity type
3. **Limit Results**: Set appropriate limits (20-100) for performance
4. **Use Filters**: Combine multiple filters for precise results
5. **Sort Appropriately**: Sort by most relevant field (date, amount, etc.)

## Examples

### Example 1: Active Loans Over $25k
```json
{
  "name": "Active High-Value Loans",
  "entityType": "Loan",
  "filters": {
    "status": "Active",
    "minAmount": 25000
  },
  "sortBy": {
    "loanAmount": "DESC"
  }
}
```

### Example 2: Applications Needing Review
```json
{
  "name": "Urgent Reviews",
  "entityType": "LoanApplication",
  "filters": {
    "status": "Under Review",
    "createdAt": {
      "$gte": "2025-01-01T00:00:00Z"
    }
  },
  "sortBy": {
    "createdAt": "ASC"
  }
}
```

### Example 3: Recent Large Disbursements
```json
{
  "name": "Big Disbursements This Week",
  "entityType": "LoanDisbursement",
  "filters": {
    "minAmount": 50000,
    "startDate": "2025-01-01T00:00:00Z"
  },
  "sortBy": {
    "disbursedAmount": "DESC"
  }
}
```

## Troubleshooting

### No Users Found
If you get "No users found" error:
1. Create a user first via registration
2. Or provide a user ID: `npm run seed:saved-searches <user-id>`

### Duplicate Searches
The script skips searches that already exist (same name + entity type). To recreate:
1. Delete the existing saved search via API or UI
2. Run the seed script again

### Search Not Working
1. Check that filters match your data structure
2. Verify entity types are correct
3. Check date formats (ISO 8601)

## Summary

Saved searches provide quick access to common queries and improve productivity. The seed script creates 20+ useful pre-configured searches covering all major entity types and common scenarios.

