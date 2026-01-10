import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LoanProductService } from '../modules/loan-product/loan-product.service';
import { CompanyService } from '../modules/company/company.service';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Seed Micro Lending Products
 * 
 * This script creates sample micro lending product configurations
 * for various use cases including weekly, bi-weekly, monthly,
 * group, business, and agricultural micro loans.
 */

interface MicroLendingProductConfig {
  productCode: string;
  productName: string;
  loanCategory: string;
  productType: string;
  rateOfInterest: number;
  penaltyInterestRate: number;
  minimumLoanAmount: number;
  maximumLoanAmount: number;
  minimumTerm: number;
  maximumTerm: number;
  repaymentScheduleType: string;
  cyclicDayOfTheMonth?: number;
  minDaysBwDisbursementFirstRepayment: number;
  averageProcessingTime: number;
  averageDisbursementTime: number;
  requiresCollateral: boolean;
  collateralRequirements?: string;
  minimumMonthlyIncome?: number;
  minimumCreditScore?: number;
  requiresCoApplicant: boolean;
  requiresGuarantor: boolean;
  employmentTypes?: string[];
  useCases: string[];
  productTagline: string;
  shortDescription: string;
  productHighlights: string[];
  keyFeatures: string[];
  benefits: string[];
  targetAudience: string;
  howItWorks: string;
  processingTimeDescription: string;
}

const microLendingProducts: MicroLendingProductConfig[] = [
  // 1. Weekly Micro Loan - For very short-term needs
  {
    productCode: 'MICRO-WEEKLY-001',
    productName: 'Weekly Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 2.5, // 2.5% per month = ~30% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 50,
    maximumLoanAmount: 5000,
    minimumTerm: 1, // 1 month = 4 weeks
    maximumTerm: 6, // 6 months = 24 weeks
    repaymentScheduleType: 'Monthly as per cycle date',
    cyclicDayOfTheMonth: 7, // Every 7th, 14th, 21st, 28th
    minDaysBwDisbursementFirstRepayment: 7,
    averageProcessingTime: 2, // 2 hours
    averageDisbursementTime: 4, // 4 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 200,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Self-Employed', 'Daily Wage', 'Small Business', 'Informal Sector'],
    useCases: ['Emergency Expenses', 'Small Business Working Capital', 'Daily Needs', 'Medical Expenses'],
    productTagline: 'Quick cash when you need it most',
    shortDescription: 'Get approved in hours and receive funds the same day. Weekly repayments make it easy to manage.',
    productHighlights: [
      'Same-day approval',
      'Weekly flexible repayments',
      'No collateral required',
      'Quick disbursement'
    ],
    keyFeatures: [
      'Loan amounts from $50 to $5,000',
      'Weekly repayment schedule',
      'No credit history required',
      'Minimal documentation',
      'Mobile-friendly application'
    ],
    benefits: [
      'Access funds within hours',
      'Flexible weekly payments',
      'Build credit history',
      'No hidden charges'
    ],
    targetAudience: 'Individuals and small business owners who need quick access to small amounts of cash for short-term needs.',
    howItWorks: 'Step 1: Apply online or via mobile app\nStep 2: Get approved within 2 hours\nStep 3: Receive funds within 4 hours\nStep 4: Repay weekly on your chosen day',
    processingTimeDescription: 'Approval within 2 hours, funds disbursed within 4 hours'
  },

  // 2. Bi-Weekly Micro Loan - For medium-term needs
  {
    productCode: 'MICRO-BIWEEKLY-001',
    productName: 'Bi-Weekly Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 2.0, // 2% per month = ~24% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 100,
    maximumLoanAmount: 10000,
    minimumTerm: 1, // 1 month = 2 bi-weekly periods
    maximumTerm: 12, // 12 months = 24 bi-weekly periods
    repaymentScheduleType: 'Monthly as per cycle date',
    cyclicDayOfTheMonth: 14, // Every 14th and 28th
    minDaysBwDisbursementFirstRepayment: 14,
    averageProcessingTime: 4, // 4 hours
    averageDisbursementTime: 8, // 8 hours (same day)
    requiresCollateral: false,
    minimumMonthlyIncome: 300,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Self-Employed', 'Salaried', 'Small Business', 'Freelancer'],
    useCases: ['Business Expansion', 'Inventory Purchase', 'Equipment Financing', 'Education Expenses'],
    productTagline: 'Flexible financing for your growing needs',
    shortDescription: 'Bi-weekly repayments that align with your income cycle. Perfect for small businesses and individuals.',
    productHighlights: [
      'Same-day approval',
      'Bi-weekly repayments',
      'Higher loan amounts',
      'Flexible terms'
    ],
    keyFeatures: [
      'Loan amounts from $100 to $10,000',
      'Bi-weekly repayment schedule',
      'Flexible 1-12 month terms',
      'Quick approval process',
      'No collateral needed'
    ],
    benefits: [
      'Align repayments with income',
      'Build business credit',
      'Access larger amounts',
      'Flexible repayment terms'
    ],
    targetAudience: 'Small business owners and individuals with regular income who need medium-term financing.',
    howItWorks: 'Step 1: Complete simple application\nStep 2: Get approved within 4 hours\nStep 3: Receive funds the same day\nStep 4: Repay bi-weekly on 14th and 28th',
    processingTimeDescription: 'Approval within 4 hours, funds disbursed the same day'
  },

  // 3. Monthly Micro Loan - Traditional micro finance
  {
    productCode: 'MICRO-MONTHLY-001',
    productName: 'Monthly Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 1.8, // 1.8% per month = ~21.6% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 200,
    maximumLoanAmount: 20000,
    minimumTerm: 3, // 3 months
    maximumTerm: 24, // 24 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 24, // 24 hours
    averageDisbursementTime: 48, // 48 hours (2 days)
    requiresCollateral: false,
    minimumMonthlyIncome: 500,
    minimumCreditScore: 500,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Salaried', 'Self-Employed', 'Small Business', 'Professional'],
    useCases: ['Business Expansion', 'Equipment Purchase', 'Home Improvement', 'Debt Consolidation'],
    productTagline: 'Affordable monthly payments for your goals',
    shortDescription: 'Traditional micro finance with monthly repayments. Perfect for larger purchases and business needs.',
    productHighlights: [
      'Lower interest rates',
      'Monthly repayments',
      'Higher loan amounts',
      'Longer repayment terms'
    ],
    keyFeatures: [
      'Loan amounts from $200 to $20,000',
      'Monthly repayment schedule',
      'Flexible 3-24 month terms',
      'Competitive interest rates',
      'No prepayment penalties'
    ],
    benefits: [
      'Affordable monthly payments',
      'Build credit history',
      'Access larger amounts',
      'Flexible terms up to 24 months'
    ],
    targetAudience: 'Small business owners and individuals who need larger amounts with affordable monthly payments.',
    howItWorks: 'Step 1: Apply with basic documents\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Repay monthly on your chosen date',
    processingTimeDescription: 'Approval within 24 hours, funds disbursed within 48 hours'
  },

  // 4. Group Micro Loan - Joint liability
  {
    productCode: 'MICRO-GROUP-001',
    productName: 'Group Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 1.5, // 1.5% per month = ~18% APR (lower for group)
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 500,
    maximumLoanAmount: 50000, // Total for group
    minimumTerm: 6, // 6 months
    maximumTerm: 24, // 24 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 48, // 48 hours (group verification)
    averageDisbursementTime: 72, // 72 hours (3 days)
    requiresCollateral: false,
    minimumMonthlyIncome: 300,
    requiresCoApplicant: true, // Group lending
    requiresGuarantor: false,
    employmentTypes: ['Self-Employed', 'Small Business', 'Group Business', 'Cooperative'],
    useCases: ['Group Business', 'Joint Liability', 'Community Projects', 'Cooperative Financing'],
    productTagline: 'Stronger together - group financing with lower rates',
    shortDescription: 'Group micro loans with joint liability. Lower rates and higher amounts for groups of 3-10 members.',
    productHighlights: [
      'Lower interest rates',
      'Higher loan amounts',
      'Joint liability',
      'Group support'
    ],
    keyFeatures: [
      'Group of 3-10 members',
      'Joint liability structure',
      'Loan amounts from $500 to $50,000',
      'Lower interest rates',
      'Group repayment tracking'
    ],
    benefits: [
      'Access larger amounts',
      'Lower interest rates',
      'Group accountability',
      'Build group credit'
    ],
    targetAudience: 'Groups of 3-10 individuals or businesses who want to access larger loans with joint liability.',
    howItWorks: 'Step 1: Form a group of 3-10 members\nStep 2: Apply together with group details\nStep 3: Get approved within 48 hours\nStep 4: Receive funds within 72 hours\nStep 5: Repay monthly with group accountability',
    processingTimeDescription: 'Group verification within 48 hours, funds disbursed within 72 hours'
  },

  // 5. Business Micro Loan - For small businesses
  {
    productCode: 'MICRO-BUSINESS-001',
    productName: 'Small Business Micro Loan',
    loanCategory: 'Business',
    productType: 'Unsecured',
    rateOfInterest: 2.2, // 2.2% per month = ~26.4% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 500,
    maximumLoanAmount: 25000,
    minimumTerm: 3, // 3 months
    maximumTerm: 18, // 18 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 12, // 12 hours
    averageDisbursementTime: 24, // 24 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 1000,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Small Business', 'Self-Employed', 'Sole Proprietor', 'Partnership'],
    useCases: ['Working Capital', 'Inventory Purchase', 'Equipment Financing', 'Business Expansion'],
    productTagline: 'Fuel your business growth with quick capital',
    shortDescription: 'Quick business loans for working capital, inventory, and equipment. Designed for small businesses.',
    productHighlights: [
      'Business-focused',
      'Quick approval',
      'Flexible terms',
      'No collateral'
    ],
    keyFeatures: [
      'Loan amounts from $500 to $25,000',
      'Business use only',
      'Flexible 3-18 month terms',
      'Quick approval process',
      'Working capital support'
    ],
    benefits: [
      'Access working capital quickly',
      'Grow your business',
      'Build business credit',
      'Flexible repayment'
    ],
    targetAudience: 'Small business owners, sole proprietors, and partnerships who need quick access to working capital.',
    howItWorks: 'Step 1: Apply with business documents\nStep 2: Get approved within 12 hours\nStep 3: Receive funds within 24 hours\nStep 4: Use for business needs\nStep 5: Repay monthly',
    processingTimeDescription: 'Business verification within 12 hours, funds disbursed within 24 hours'
  },

  // 6. Agricultural Micro Loan - For farmers
  {
    productCode: 'MICRO-AGRICULTURE-001',
    productName: 'Agricultural Micro Loan',
    loanCategory: 'Agriculture',
    productType: 'Unsecured',
    rateOfInterest: 1.2, // 1.2% per month = ~14.4% APR (subsidized)
    penaltyInterestRate: 0.3,
    minimumLoanAmount: 200,
    maximumLoanAmount: 15000,
    minimumTerm: 3, // 3 months
    maximumTerm: 12, // 12 months (seasonal)
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 60, // Grace period for crop cycle
    averageProcessingTime: 24, // 24 hours
    averageDisbursementTime: 48, // 48 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 300,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Farmer', 'Agricultural Worker', 'Livestock Owner', 'Fisherman'],
    useCases: ['Crop Financing', 'Livestock Purchase', 'Equipment Financing', 'Seasonal Needs'],
    productTagline: 'Grow your farm with affordable financing',
    shortDescription: 'Agricultural micro loans with seasonal repayment schedules. Designed for farmers and agricultural workers.',
    productHighlights: [
      'Lower interest rates',
      'Seasonal repayment',
      'Agricultural focus',
      'Flexible grace periods'
    ],
    keyFeatures: [
      'Loan amounts from $200 to $15,000',
      'Seasonal repayment options',
      'Flexible 3-12 month terms',
      'Lower interest rates',
      'Crop cycle aligned repayments'
    ],
    benefits: [
      'Affordable rates for farmers',
      'Seasonal repayment flexibility',
      'Support agricultural growth',
      'Grace periods for crop cycles'
    ],
    targetAudience: 'Farmers, agricultural workers, livestock owners, and fishermen who need financing for agricultural activities.',
    howItWorks: 'Step 1: Apply with agricultural documents\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Use for agricultural needs\nStep 5: Repay after harvest/season',
    processingTimeDescription: 'Agricultural verification within 24 hours, funds disbursed within 48 hours with seasonal repayment options'
  },

  // 7. Payday Micro Loan - Very short term
  {
    productCode: 'MICRO-PAYDAY-001',
    productName: 'Payday Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 3.0, // 3% per month = ~36% APR
    penaltyInterestRate: 1.0,
    minimumLoanAmount: 100,
    maximumLoanAmount: 2000,
    minimumTerm: 1, // 1 month
    maximumTerm: 3, // 3 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 1, // 1 hour
    averageDisbursementTime: 2, // 2 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 300,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Salaried', 'Daily Wage', 'Contract Worker'],
    useCases: ['Emergency Expenses', 'Bill Payments', 'Short-term Cash Flow', 'Unexpected Expenses'],
    productTagline: 'Bridge the gap until payday',
    shortDescription: 'Ultra-quick payday loans. Get approved in 1 hour and receive funds in 2 hours.',
    productHighlights: [
      'Ultra-fast approval',
      'Same-day disbursement',
      'No credit check',
      'Simple application'
    ],
    keyFeatures: [
      'Loan amounts from $100 to $2,000',
      'Approval within 1 hour',
      'Funds within 2 hours',
      'Simple application',
      'Short-term (1-3 months)'
    ],
    benefits: [
      'Get cash the same day',
      'No lengthy approval',
      'Simple process',
      'Quick access'
    ],
    targetAudience: 'Salaried individuals and wage earners who need quick cash before their next payday.',
    howItWorks: 'Step 1: Apply online (5 minutes)\nStep 2: Get approved within 1 hour\nStep 3: Receive funds within 2 hours\nStep 4: Repay on your next payday',
    processingTimeDescription: 'Ultra-fast approval within 1 hour, funds disbursed within 2 hours'
  },

  // 8. Emergency Micro Loan - For urgent needs
  {
    productCode: 'MICRO-EMERGENCY-001',
    productName: 'Emergency Micro Loan',
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 2.8, // 2.8% per month = ~33.6% APR
    penaltyInterestRate: 0.8,
    minimumLoanAmount: 50,
    maximumLoanAmount: 5000,
    minimumTerm: 1, // 1 month
    maximumTerm: 6, // 6 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 3, // 3 hours
    averageDisbursementTime: 6, // 6 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 200,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Any'],
    useCases: ['Medical Emergency', 'Family Emergency', 'Urgent Repairs', 'Critical Expenses'],
    productTagline: 'When emergencies strike, we respond fast',
    shortDescription: 'Emergency micro loans for urgent situations. Quick approval and disbursement when you need it most.',
    productHighlights: [
      'Fast approval',
      'Same-day funds',
      'No questions asked',
      'Flexible repayment'
    ],
    keyFeatures: [
      'Loan amounts from $50 to $5,000',
      'Approval within 3 hours',
      'Funds within 6 hours',
      'Flexible 1-6 month terms',
      'Minimal requirements'
    ],
    benefits: [
      'Quick access in emergencies',
      'No lengthy process',
      'Flexible repayment',
      'Available 24/7'
    ],
    targetAudience: 'Anyone facing an emergency situation who needs quick access to funds.',
    howItWorks: 'Step 1: Apply via phone or online\nStep 2: Get approved within 3 hours\nStep 3: Receive funds within 6 hours\nStep 4: Repay monthly',
    processingTimeDescription: 'Emergency approval within 3 hours, funds disbursed within 6 hours'
  },

  // 9. Student Micro Loan - For education
  {
    productCode: 'MICRO-STUDENT-001',
    productName: 'Student Micro Loan',
    loanCategory: 'Education',
    productType: 'Unsecured',
    rateOfInterest: 1.0, // 1% per month = ~12% APR (subsidized)
    penaltyInterestRate: 0.2,
    minimumLoanAmount: 100,
    maximumLoanAmount: 10000,
    minimumTerm: 6, // 6 months
    maximumTerm: 36, // 36 months (3 years)
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 90, // Grace period after graduation
    averageProcessingTime: 48, // 48 hours
    averageDisbursementTime: 72, // 72 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 0, // Students may not have income
    requiresCoApplicant: true, // Parent/guardian as co-applicant
    requiresGuarantor: true,
    employmentTypes: ['Student'],
    useCases: ['Tuition Fees', 'Books and Supplies', 'Living Expenses', 'Educational Equipment'],
    productTagline: 'Invest in your future with affordable education financing',
    shortDescription: 'Student micro loans with low interest rates and flexible repayment. Start repaying after graduation.',
    productHighlights: [
      'Low interest rates',
      'Grace period after graduation',
      'Flexible repayment',
      'No income required'
    ],
    keyFeatures: [
      'Loan amounts from $100 to $10,000',
      'Low interest rates (1% per month)',
      'Grace period after graduation',
      'Flexible 6-36 month terms',
      'Parent/guardian co-signer'
    ],
    benefits: [
      'Affordable education financing',
      'Start repaying after graduation',
      'Build credit early',
      'Low interest rates'
    ],
    targetAudience: 'Students who need financing for education expenses with flexible repayment after graduation.',
    howItWorks: 'Step 1: Apply with student and parent/guardian\nStep 2: Get approved within 48 hours\nStep 3: Receive funds within 72 hours\nStep 4: Use for education\nStep 5: Start repaying 90 days after graduation',
    processingTimeDescription: 'Student verification within 48 hours, funds disbursed within 72 hours, grace period after graduation'
  },

  // 10. Women's Micro Loan - Gender-focused product
  {
    productCode: 'MICRO-WOMEN-001',
    productName: "Women's Micro Loan",
    loanCategory: 'Micro Finance',
    productType: 'Unsecured',
    rateOfInterest: 1.5, // 1.5% per month = ~18% APR (lower for women)
    penaltyInterestRate: 0.3,
    minimumLoanAmount: 100,
    maximumLoanAmount: 15000,
    minimumTerm: 3, // 3 months
    maximumTerm: 24, // 24 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 24, // 24 hours
    averageDisbursementTime: 48, // 48 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 200,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Self-Employed', 'Small Business', 'Home-Based Business', 'Any'],
    useCases: ['Women Entrepreneurship', 'Home-Based Business', 'Skill Development', 'Business Expansion'],
    productTagline: 'Empowering women entrepreneurs with affordable financing',
    shortDescription: 'Special micro loans for women with lower interest rates and flexible terms. Designed to support women entrepreneurs.',
    productHighlights: [
      'Lower interest rates',
      'Women-focused',
      'Flexible terms',
      'Business support'
    ],
    keyFeatures: [
      'Loan amounts from $100 to $15,000',
      'Lower interest rates (1.5% per month)',
      'Flexible 3-24 month terms',
      'Business training support',
      'No collateral required'
    ],
    benefits: [
      'Affordable rates for women',
      'Support women entrepreneurship',
      'Build business credit',
      'Access to business training'
    ],
    targetAudience: 'Women entrepreneurs, home-based business owners, and women seeking to start or expand businesses.',
    howItWorks: 'Step 1: Apply with business plan\nStep 2: Get approved within 24 hours\nStep 3: Receive funds within 48 hours\nStep 4: Access business training\nStep 5: Repay monthly',
    processingTimeDescription: 'Approval within 24 hours, funds disbursed within 48 hours, includes business training support'
  },

  // 11. Trip Financing - For transporters and logistics
  {
    productCode: 'MICRO-TRIP-001',
    productName: 'Trip Financing',
    loanCategory: 'Logistics',
    productType: 'Unsecured',
    rateOfInterest: 2.0, // 2% per month = ~24% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 200,
    maximumLoanAmount: 50000,
    minimumTerm: 1, // 1 month
    maximumTerm: 6, // 6 months (typical trip duration)
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 4, // 4 hours
    averageDisbursementTime: 8, // 8 hours (same day)
    requiresCollateral: false,
    minimumMonthlyIncome: 500,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Transporter', 'Logistics', 'Freight Forwarder', 'Truck Owner', 'Fleet Operator'],
    useCases: ['Trip Advance', 'Fuel for Trip', 'Driver Wages', 'Route Expenses', 'Cargo Handling'],
    productTagline: 'Finance your trips, repay from revenue',
    shortDescription: 'Quick financing for transporters to cover trip expenses. Repay automatically from trip revenue.',
    productHighlights: [
      'Same-day approval',
      'Automatic repayment from revenue',
      'Trip-specific financing',
      'No collateral required'
    ],
    keyFeatures: [
      'Loan amounts from $200 to $50,000',
      'Trip-based financing',
      'Automatic repayment from trip revenue',
      'Quick approval process',
      'Flexible 1-6 month terms'
    ],
    benefits: [
      'Access funds before trip starts',
      'Repay from trip revenue',
      'No upfront cash needed',
      'Build credit history'
    ],
    targetAudience: 'Transporters, truck owners, fleet operators, and logistics companies who need advance financing for trips.',
    howItWorks: 'Step 1: Apply with trip details\nStep 2: Get approved within 4 hours\nStep 3: Receive funds the same day\nStep 4: Use for trip expenses\nStep 5: Repay automatically from trip revenue',
    processingTimeDescription: 'Approval within 4 hours, funds disbursed the same day, automatic repayment from trip revenue'
  },

  // 12. Fuel Credit - For fuel purchases
  {
    productCode: 'MICRO-FUEL-001',
    productName: 'Fuel Credit',
    loanCategory: 'Transportation',
    productType: 'Unsecured',
    rateOfInterest: 1.8, // 1.8% per month = ~21.6% APR
    penaltyInterestRate: 0.5,
    minimumLoanAmount: 100,
    maximumLoanAmount: 20000,
    minimumTerm: 1, // 1 month
    maximumTerm: 12, // 12 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 2, // 2 hours
    averageDisbursementTime: 4, // 4 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 300,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Transporter', 'Truck Owner', 'Fleet Operator', 'Taxi Driver', 'Bus Operator'],
    useCases: ['Fuel Purchase', 'Gas Station Credit', 'Bulk Fuel Buying', 'Fleet Fuel Management'],
    productTagline: 'Fuel your business, pay later',
    shortDescription: 'Credit facility specifically for fuel purchases. Quick approval and flexible repayment.',
    productHighlights: [
      'Quick approval',
      'Fuel-specific credit',
      'Flexible repayment',
      'No collateral'
    ],
    keyFeatures: [
      'Loan amounts from $100 to $20,000',
      'Fuel purchase financing',
      'Quick 2-hour approval',
      'Flexible 1-12 month terms',
      'Monthly repayment schedule'
    ],
    benefits: [
      'Buy fuel without upfront cash',
      'Manage cash flow better',
      'Build credit history',
      'Flexible repayment terms'
    ],
    targetAudience: 'Transporters, truck owners, fleet operators, and vehicle owners who need credit for fuel purchases.',
    howItWorks: 'Step 1: Apply with vehicle/fleet details\nStep 2: Get approved within 2 hours\nStep 3: Receive credit within 4 hours\nStep 4: Use for fuel purchases\nStep 5: Repay monthly',
    processingTimeDescription: 'Approval within 2 hours, credit available within 4 hours, monthly repayment'
  },

  // 13. Invoice Financing - For invoice-based lending
  {
    productCode: 'MICRO-INVOICE-001',
    productName: 'Invoice Financing',
    loanCategory: 'Business',
    productType: 'Unsecured',
    rateOfInterest: 1.5, // 1.5% per month = ~18% APR
    penaltyInterestRate: 0.3,
    minimumLoanAmount: 500,
    maximumLoanAmount: 100000,
    minimumTerm: 1, // 1 month
    maximumTerm: 6, // 6 months (typical invoice payment period)
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 12, // 12 hours
    averageDisbursementTime: 24, // 24 hours
    requiresCollateral: false,
    minimumMonthlyIncome: 1000,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Small Business', 'SME', 'Wholesaler', 'Distributor', 'Manufacturer'],
    useCases: ['Invoice Discounting', 'Accounts Receivable Financing', 'Working Capital', 'Cash Flow Management'],
    productTagline: 'Get paid now, repay when your customer pays',
    shortDescription: 'Finance your invoices and get immediate cash. Repay when your customer pays the invoice.',
    productHighlights: [
      'Invoice-based financing',
      'Quick access to cash',
      'Lower interest rates',
      'Flexible terms'
    ],
    keyFeatures: [
      'Loan amounts from $500 to $100,000',
      'Invoice-based financing',
      'Up to 80% of invoice value',
      'Flexible 1-6 month terms',
      'Repay when customer pays'
    ],
    benefits: [
      'Get cash immediately',
      'Don\'t wait for customer payment',
      'Improve cash flow',
      'Lower interest rates'
    ],
    targetAudience: 'Small businesses, SMEs, wholesalers, and manufacturers who need to finance their outstanding invoices.',
    howItWorks: 'Step 1: Submit invoice details\nStep 2: Get approved within 12 hours\nStep 3: Receive up to 80% of invoice value\nStep 4: Use for business needs\nStep 5: Repay when customer pays invoice',
    processingTimeDescription: 'Invoice verification within 12 hours, funds disbursed within 24 hours, repay when customer pays'
  },

  // 14. Warehouse Receipt Financing - For commodity-based lending
  {
    productCode: 'MICRO-WAREHOUSE-001',
    productName: 'Warehouse Receipt Financing',
    loanCategory: 'Agriculture',
    productType: 'Secured',
    rateOfInterest: 1.2, // 1.2% per month = ~14.4% APR (lower for secured)
    penaltyInterestRate: 0.3,
    minimumLoanAmount: 1000,
    maximumLoanAmount: 200000,
    minimumTerm: 3, // 3 months
    maximumTerm: 12, // 12 months
    repaymentScheduleType: 'Monthly as per repayment start date',
    minDaysBwDisbursementFirstRepayment: 30,
    averageProcessingTime: 48, // 48 hours (warehouse verification)
    averageDisbursementTime: 72, // 72 hours (3 days)
    requiresCollateral: true,
    collateralRequirements: 'Warehouse receipt for stored commodities (grains, cotton, coffee, etc.)',
    minimumMonthlyIncome: 500,
    requiresCoApplicant: false,
    requiresGuarantor: false,
    employmentTypes: ['Farmer', 'Commodity Trader', 'Agricultural Producer', 'Grain Merchant', 'Coffee Grower'],
    useCases: ['Commodity Storage Financing', 'Grain Financing', 'Cotton Financing', 'Coffee Financing', 'Seasonal Storage'],
    productTagline: 'Unlock value from your stored commodities',
    shortDescription: 'Finance against warehouse receipts for stored commodities. Lower rates with commodity as collateral.',
    productHighlights: [
      'Commodity-backed financing',
      'Lower interest rates',
      'Seasonal storage support',
      'Flexible repayment'
    ],
    keyFeatures: [
      'Loan amounts from $1,000 to $200,000',
      'Commodity-backed (warehouse receipt)',
      'Up to 70% of commodity value',
      'Flexible 3-12 month terms',
      'Lower interest rates'
    ],
    benefits: [
      'Access cash without selling commodities',
      'Wait for better prices',
      'Lower interest rates',
      'Seasonal storage support'
    ],
    targetAudience: 'Farmers, commodity traders, agricultural producers, and grain merchants who store commodities in warehouses.',
    howItWorks: 'Step 1: Store commodities in approved warehouse\nStep 2: Get warehouse receipt\nStep 3: Apply with receipt\nStep 4: Get approved within 48 hours\nStep 5: Receive up to 70% of commodity value\nStep 6: Repay monthly or when commodity is sold',
    processingTimeDescription: 'Warehouse verification within 48 hours, funds disbursed within 72 hours, commodity as collateral'
  },
];

async function seedMicroLendingProducts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const loanProductService = app.get(LoanProductService);
  const companyService = app.get(CompanyService);
  const logger = new Logger('SeedMicroLendingProducts');

  try {
    logger.log('🌱 Starting micro lending products seed...');

    // Get or create default company
    let company;
    try {
      company = await companyService.findByCode('URUTI');
    } catch {
      // Create default company if it doesn't exist
        company = await companyService.create({
          name: 'Uruti Lending Company',
          code: 'URUTI',
          email: 'info@urutilending.com',
          address: '123 Financial Street, Business District',
          phone: '+1-555-0123',
        });
      logger.log(`Created default company: ${company.name}`);
    }

    const companyId = company.id;
    logger.log(`Using company: ${company.name} (${companyId})`);

    // Default accounting accounts (using seeded account codes)
    const defaultAccounts = {
      disbursementAccount: 'BANK-DISBURSEMENT',
      paymentAccount: 'BANK-PAYMENT',
      loanAccount: 'LOAN-ACCOUNT',
      interestIncomeAccount: 'INTEREST-INCOME',
      penaltyIncomeAccount: 'PENALTY-INCOME',
      interestAccruedAccount: 'INTEREST-ACCRUED',
      interestReceivableAccount: 'INTEREST-RECEIVABLE',
      penaltyAccruedAccount: 'PENALTY-ACCRUED',
      penaltyReceivableAccount: 'PENALTY-RECEIVABLE',
      securityDepositAccount: 'SECURITY-DEPOSIT',
      customerRefundAccount: 'CUSTOMER-REFUND',
      writeOffAccount: 'WRITE-OFF-EXPENSE',
      writeOffRecoveryAccount: 'WRITE-OFF-RECOVERY',
      interestWaiverAccount: 'INTEREST-WAIVER',
      penaltyWaiverAccount: 'PENALTY-WAIVER',
    };

    let createdCount = 0;
    let skippedCount = 0;

    for (const productConfig of microLendingProducts) {
      try {
        // Check if product already exists
        const existing = await loanProductService.findByProductCode(productConfig.productCode);
        if (existing) {
          logger.log(`⏭️  Product ${productConfig.productCode} already exists. Skipping.`);
          skippedCount++;
          continue;
        }
      } catch {
        // Product doesn't exist, proceed to create
      }

      try {
        const product = await loanProductService.create({
          productCode: productConfig.productCode,
          productName: productConfig.productName,
          companyId,
          rateOfInterest: productConfig.rateOfInterest,
          penaltyInterestRate: productConfig.penaltyInterestRate,
          maximumLoanAmount: productConfig.maximumLoanAmount,
          minimumLoanAmount: productConfig.minimumLoanAmount,
          minimumTerm: productConfig.minimumTerm,
          maximumTerm: productConfig.maximumTerm,
          isTermLoan: true,
          repaymentScheduleType: productConfig.repaymentScheduleType as any,
          cyclicDayOfTheMonth: productConfig.cyclicDayOfTheMonth,
          minDaysBwDisbursementFirstRepayment: productConfig.minDaysBwDisbursementFirstRepayment,
          daysPastDueThresholdForNpa: 90,
          gracePeriodInDays: 0,
          requiresCollateral: productConfig.requiresCollateral,
          minimumMonthlyIncome: productConfig.minimumMonthlyIncome,
          minimumCreditScore: productConfig.minimumCreditScore,
          requiresCoApplicant: productConfig.requiresCoApplicant,
          requiresGuarantor: productConfig.requiresGuarantor,
          employmentTypes: productConfig.employmentTypes,
          useCases: productConfig.useCases,
          loanCategory: productConfig.loanCategory,
          productType: productConfig.productType,
          productTagline: productConfig.productTagline,
          shortDescription: productConfig.shortDescription,
          productHighlights: productConfig.productHighlights,
          keyFeatures: productConfig.keyFeatures,
          benefits: productConfig.benefits,
          targetAudience: productConfig.targetAudience,
          howItWorks: productConfig.howItWorks,
          averageProcessingTime: productConfig.averageProcessingTime,
          averageDisbursementTime: productConfig.averageDisbursementTime,
          processingTimeDescription: productConfig.processingTimeDescription,
          // Accounting accounts
          ...defaultAccounts,
        });

        logger.log(`✅ Created: ${product.productCode} - ${product.productName}`);
        createdCount++;
      } catch (error) {
        logger.error(`❌ Failed to create ${productConfig.productCode}: ${error.message}`);
      }
    }

    logger.log(`\n📊 Summary:`);
    logger.log(`   ✅ Created: ${createdCount} products`);
    logger.log(`   ⏭️  Skipped: ${skippedCount} products (already exist)`);
    logger.log(`   📦 Total: ${microLendingProducts.length} products`);
    logger.log(`\n✅ Micro lending products seed completed successfully!`);

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error seeding micro lending products: ${error.message}`, error.stack);
    process.exit(1);
  }
}

seedMicroLendingProducts();

