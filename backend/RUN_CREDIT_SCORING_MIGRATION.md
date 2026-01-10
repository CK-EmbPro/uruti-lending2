# Run Credit Scoring Migration

## Migration File Created

✅ **Migration file:** `src/database/migrations/1765800000000-AddCreditScoringToLoanApplication.ts`

This migration adds the following fields to the `loan_applications` table:

1. **`credit_score`** (int, nullable)
   - Stores the final weighted credit score (300-850)

2. **`scoring_details`** (jsonb, nullable)
   - Stores complete scoring breakdown and AI insights
   - Includes: scoreBreakdown, weights, explanation, confidence, riskTier

3. **`credit_score_calculated_at`** (timestamp, nullable)
   - Timestamp when credit score was last calculated

4. **Indexes**
   - Index on `credit_score` for faster queries
   - Index on `credit_score_calculated_at` for filtering

---

## Prerequisites

Before running the migration, ensure:

1. ✅ **PostgreSQL database is running**
2. ✅ **Database connection is configured** in `.env` file:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=lending_db
   ```
3. ✅ **Database exists** (create if needed):
   ```sql
   CREATE DATABASE lending_db;
   ```

---

## Running the Migration

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run migration:run
```

### Option 2: Using TypeORM CLI directly

```bash
cd backend
npx typeorm migration:run -d src/database/data-source.ts
```

### Option 3: Using ts-node

```bash
cd backend
ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts
```

---

## Expected Output

When the migration runs successfully, you should see:

```
query: SELECT * FROM "migrations" ORDER BY "id" DESC
query: SELECT * FROM "migrations" WHERE "id" = $1
query: ALTER TABLE "loan_applications" ADD "credit_score" int
query: ALTER TABLE "loan_applications" ADD "scoring_details" jsonb
query: ALTER TABLE "loan_applications" ADD "credit_score_calculated_at" timestamp
query: CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score" ON "loan_applications" ("credit_score")
query: CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score_calculated_at" ON "loan_applications" ("credit_score_calculated_at")
query: INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)
Migration AddCreditScoringToLoanApplication1765800000000 has been executed successfully.
```

---

## Verify Migration

After running the migration, verify the changes:

### Using psql:

```sql
-- Check if columns exist
\d loan_applications

-- Or query the columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'loan_applications'
AND column_name IN ('credit_score', 'scoring_details', 'credit_score_calculated_at');

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'loan_applications'
AND indexname LIKE '%credit_score%';
```

### Using TypeORM:

```typescript
// In your service
const application = await this.applicationRepository.findOne({ where: { id } });
console.log(application.creditScore); // Should work now
console.log(application.scoringDetails); // Should work now
```

---

## Reverting the Migration (if needed)

If you need to revert the migration:

```bash
cd backend
npm run migration:revert
```

Or:

```bash
npx typeorm migration:revert -d src/database/data-source.ts
```

---

## Troubleshooting

### Error: "Cannot connect to database"

**Solution:** Check your `.env` file and ensure:
- Database server is running
- Connection credentials are correct
- Database exists

### Error: "Table 'loan_applications' does not exist"

**Solution:** Run previous migrations first:
```bash
npm run migration:run
```

### Error: "Column already exists"

**Solution:** The migration checks for existing columns, but if you see this error:
1. Check if columns already exist: `\d loan_applications`
2. If they exist, the migration may have already run
3. Check migrations table: `SELECT * FROM migrations ORDER BY timestamp DESC;`

### Error: "Permission denied"

**Solution:** Ensure your database user has ALTER TABLE permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE lending_db TO postgres;
GRANT ALL PRIVILEGES ON TABLE loan_applications TO postgres;
```

---

## SQL Equivalent

If you prefer to run the migration manually using SQL:

```sql
-- Add columns
ALTER TABLE loan_applications
ADD COLUMN credit_score INT NULL,
ADD COLUMN scoring_details JSONB NULL,
ADD COLUMN credit_score_calculated_at TIMESTAMP NULL;

-- Add comments
COMMENT ON COLUMN loan_applications.credit_score IS 'Final weighted credit score (300-850)';
COMMENT ON COLUMN loan_applications.scoring_details IS 'Complete scoring breakdown and AI insights';
COMMENT ON COLUMN loan_applications.credit_score_calculated_at IS 'Timestamp when credit score was last calculated';

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score" 
ON loan_applications (credit_score);

CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score_calculated_at" 
ON loan_applications (credit_score_calculated_at);

-- Record migration (optional, if using TypeORM migrations table)
INSERT INTO migrations (timestamp, name) 
VALUES (1765800000000, 'AddCreditScoringToLoanApplication1765800000000');
```

---

## Next Steps

After the migration runs successfully:

1. ✅ **Test the integration** - Submit a loan application with scoring data
2. ✅ **Verify data storage** - Check that credit scores are being saved
3. ✅ **Test queries** - Query applications by credit score
4. ✅ **Monitor performance** - Check index usage

---

**Status**: ✅ **Migration file created and ready to run**

Run `npm run migration:run` from the backend directory to apply the migration!

