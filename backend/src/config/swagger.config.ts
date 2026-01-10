import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

/**
 * Swagger/OpenAPI Configuration
 * This configuration ensures all endpoints are properly documented
 */
export const swaggerConfig = new DocumentBuilder()
  .setTitle('Uruti Lending API')
  .setDescription(
    `
# Uruti Lending - Complete API Documentation

## Overview
This is the complete REST API for the Uruti Lending system, providing comprehensive loan management functionality.

## Features

### Core Loan Management
- Complete loan lifecycle (Draft → Sanctioned → Disbursed → Active → Closed)
- Loan application workflow with multi-step approvals
- Loan disbursement with partial disbursement support
- Multiple repayment types (17 types including waivers, settlements, prepayments)
- Automatic repayment schedule generation
- Loan closure with auto write-off

### Advanced Features
- **Co-Lending**: Loan Partner support with FLDG (First Loss Default Guarantee)
- **Security Management**: Security assignment, unpledge, release, price tracking, shortfall detection
- **NPA Classification**: Automatic and manual NPA marking with classification codes
- **Loan Restructure**: Complete restructure workflow with waiver and adjustment support
- **Moratorium Support**: EMI/Principal moratorium with interest treatment options
- **Line of Credit**: Limit management with date-based validation
- **Bulk Operations**: Bulk repayment processing
- **Reporting**: Portfolio, NPA, Collection, Disbursement, Overdue reports with CSV export
- **Accounting Integration**: Journal Entry and GL Entry creation
- **Workflow Engine**: Multi-step approval workflows with role-based actions
- **Document Management**: Loan application document upload and verification
- **Broken Period Interest**: Specialized BPI calculation
- **Security Deposit**: Advanced usage tracking with audit trail

## Authentication
All endpoints (except auth endpoints) require JWT Bearer token authentication.

## Rate Limiting
API rate limiting may be applied in production.

## Version
API Version: 1.0.0
    `.trim(),
  )
  .setVersion('1.0.0')
  .setContact('Uruti Lending Team', '', 'support@urutilending.com')
  .setLicense('Proprietary', '')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('auth', 'Authentication endpoints')
  .addTag('companies', 'Company management')
  .addTag('loan-products', 'Loan product configuration')
  .addTag('loan-applications', 'Loan application management')
  .addTag('loan-application-documents', 'Loan application document management')
  .addTag('document-types', 'Document type master')
  .addTag('loans', 'Loan management')
  .addTag('loan-disbursements', 'Loan disbursement operations')
  .addTag('loan-repayments', 'Loan repayment operations')
  .addTag('loan-demands', 'Loan demand management')
  .addTag('loan-interest-accruals', 'Interest accrual tracking')
  .addTag('loan-write-offs', 'Loan write-off operations')
  .addTag('loan-refunds', 'Loan refund operations')
  .addTag('loan-balance-adjustments', 'Loan balance adjustment operations')
  .addTag('loan-restructures', 'Loan restructure operations')
  .addTag('loan-securities', 'Loan security master')
  .addTag('loan-security-assignments', 'Security assignment and pledging')
  .addTag('loan-security-prices', 'Security price management')
  .addTag('loan-security-shortfalls', 'Security shortfall detection')
  .addTag('loan-security-deposit', 'Security deposit usage tracking')
  .addTag('loan-charges', 'Loan charge management')
  .addTag('loan-charge-postings', 'Charge posting tracking')
  .addTag('loan-transfers', 'Loan transfer operations')
  .addTag('loan-partners', 'Co-lending partner management')
  .addTag('accounting', 'Accounting and journal entries')
  .addTag('reporting', 'Financial reporting')
  .addTag('customers', 'Customer management')
  .addTag('workflows', 'Workflow engine management')
  .addTag('calculations', 'Financial calculations')
  .addServer('http://localhost:3000', 'Development server')
  .addServer('https://api.urutilending.com', 'Production server')
  .build();

export const swaggerOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) =>
    `${controllerKey}_${methodKey}`,
  deepScanRoutes: true,
};

