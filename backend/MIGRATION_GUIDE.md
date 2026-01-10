# Database Migration Guide

## Overview

This guide explains how to run database migrations for the Uruti Lending Platform.

## Migration Files

Two migration files have been created:

1. **1735000000000-CreateCollectionsTables.ts** - Creates all collections-related tables
2. **1735000000001-CreateCustomerServiceTables.ts** - Creates all customer service-related tables

## Prerequisites

1. PostgreSQL database must be running
2. Database connection configured in `.env` file
3. TypeORM CLI installed (included in package.json)

## Running Migrations

### 1. Generate Migration (if needed)

To generate a new migration based on entity changes:

```bash
npm run migration:generate -- -n MigrationName
```

### 2. Run Migrations

To apply all pending migrations:

```bash
npm run migration:run
```

Or using TypeORM CLI directly:

```bash
npx typeorm migration:run -d src/database/data-source.ts
```

### 3. Revert Last Migration

To revert the last migration:

```bash
npm run migration:revert
```

Or:

```bash
npx typeorm migration:revert -d src/database/data-source.ts
```

## Migration Details

### Collections Tables (1735000000000)

Creates the following tables:
- `delinquency_records` - Delinquency detection records
- `late_fees` - Late fee assessments
- `credit_bureau_updates` - Credit bureau update tracking
- `collection_workflows` - Automated collection workflows
- `collection_notices` - Collection notices sent to borrowers
- `collection_activities` - Manual collection activities
- `promise_to_pay` - Promise to pay records
- `payment_arrangements` - Payment arrangement agreements
- `arrangement_compliance` - Payment arrangement compliance tracking
- `skip_traces` - Skip tracing records
- `legal_actions` - Legal action records
- `lawsuits` - Lawsuit details
- `judgments` - Judgment records
- `collection_agencies` - Third-party collection agencies
- `third_party_placements` - Accounts placed with agencies

### Customer Service Tables (1735000000001)

Creates the following tables:
- `payment_extensions` - Payment extension requests
- `disputes` - Dispute records
- `dispute_resolutions` - Dispute resolution records
- `account_updates` - Account information update requests
- `fee_waivers` - Fee waiver requests

## Foreign Key Relationships

All tables include proper foreign key relationships:
- Most tables reference `loan` table with CASCADE delete
- Child tables reference parent tables appropriately
- Collection workflow tables reference each other

## Indexes

All tables include appropriate indexes for:
- Foreign key columns
- Date columns (for querying by date ranges)
- Status columns (for filtering)
- Search columns

## Rollback

To rollback all migrations:

```bash
npx typeorm migration:revert -d src/database/data-source.ts
```

Run this command multiple times to revert each migration in reverse order.

## Troubleshooting

### Migration Fails

1. Check database connection settings in `.env`
2. Ensure PostgreSQL is running
3. Check that `uuid_generate_v4()` extension is enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

### Migration Already Applied

If you see "migration already applied" errors:
1. Check the `migrations` table in your database
2. Manually remove entries if needed (use with caution)

### Foreign Key Errors

If foreign key creation fails:
1. Ensure parent tables exist
2. Check that referenced columns exist
3. Verify data types match

## Production Deployment

For production:

1. **Backup database first**
2. Run migrations during maintenance window
3. Test migrations on staging first
4. Monitor for errors
5. Have rollback plan ready

## Notes

- Migrations use UUID primary keys
- All timestamps use PostgreSQL `timestamp` type
- Decimal fields use precision 15, scale 2 for financial amounts
- Boolean fields default to `false`
- Date fields use PostgreSQL `date` type

