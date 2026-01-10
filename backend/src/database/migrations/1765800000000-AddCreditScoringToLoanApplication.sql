-- Migration: Add Credit Scoring Fields to Loan Applications
-- Timestamp: 1765800000000
-- Description: Adds credit_score, scoring_details, and credit_score_calculated_at columns to loan_applications table

-- Add credit_score column
ALTER TABLE loan_applications
ADD COLUMN IF NOT EXISTS credit_score INT NULL;

COMMENT ON COLUMN loan_applications.credit_score IS 'Final weighted credit score (300-850)';

-- Add scoring_details column (JSONB for PostgreSQL)
ALTER TABLE loan_applications
ADD COLUMN IF NOT EXISTS scoring_details JSONB NULL;

COMMENT ON COLUMN loan_applications.scoring_details IS 'Complete scoring breakdown and AI insights including scoreBreakdown, weights, explanation, confidence, riskTier';

-- Add credit_score_calculated_at column
ALTER TABLE loan_applications
ADD COLUMN IF NOT EXISTS credit_score_calculated_at TIMESTAMP NULL;

COMMENT ON COLUMN loan_applications.credit_score_calculated_at IS 'Timestamp when credit score was last calculated';

-- Create index on credit_score for faster queries
CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score" 
ON loan_applications (credit_score);

-- Create index on credit_score_calculated_at for filtering
CREATE INDEX IF NOT EXISTS "IDX_loan_applications_credit_score_calculated_at" 
ON loan_applications (credit_score_calculated_at);

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully';
    RAISE NOTICE 'Added columns: credit_score, scoring_details, credit_score_calculated_at';
    RAISE NOTICE 'Created indexes on credit_score and credit_score_calculated_at';
END $$;

