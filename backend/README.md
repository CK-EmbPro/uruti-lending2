# Uruti Lending Platform - NestJS Backend

## Overview

This is the NestJS backend implementation of the **Uruti Lending Platform** - a comprehensive loan management system built from scratch using modern technologies.

## Features

- **Loan Management**: Complete loan lifecycle management
- **Loan Products**: Configurable loan product templates
- **Loan Applications**: Application processing and approval workflow
- **Repayment Processing**: Automated repayment allocation and processing
- **Interest Accrual**: Daily/monthly interest accrual engine
- **Demand Generation**: Automated demand generation from schedules
- **Security Management**: Loan security/collateral tracking
- **Calculation Engine**: EMI, interest, penalty calculations
- **State Machine**: Loan status transition management
- **Scheduled Jobs**: Automated batch processing
- **REST API**: Comprehensive API endpoints

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Cache/Queue**: Redis
- **Validation**: class-validator, class-transformer
- **Calculations**: decimal.js for precise financial calculations

## Project Structure

```
src/
├── common/              # Shared utilities, enums, decorators
│   ├── enums/          # Enumerations (LoanStatus, ApplicantType, etc.)
│   ├── decorators/     # Custom decorators (Roles, etc.)
│   ├── guards/         # Auth guards
│   └── utils/          # Utility functions (DateUtils, NumberUtils)
├── config/             # Configuration files
├── database/            # Database configuration and migrations
├── modules/             # Feature modules
│   ├── loan/           # Loan management
│   ├── loan-product/   # Loan product management
│   ├── loan-application/ # Loan application processing
│   ├── loan-repayment/ # Repayment processing
│   ├── loan-disbursement/ # Disbursement management
│   ├── loan-demand/    # Demand generation
│   ├── loan-interest-accrual/ # Interest accrual
│   ├── loan-security/  # Security management
│   ├── calculation/    # Calculation engine
│   ├── scheduler/      # Scheduled jobs
│   ├── auth/           # Authentication
│   └── company/        # Company management
└── main.ts             # Application entry point
```

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Database Setup

### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait for database to be ready
docker-compose ps

# Note: If port 5432 is already in use, docker-compose.yml uses port 5433
# Update .env file: DB_PORT=5433
```

### Manual Setup

```bash
# Create database
psql -U postgres
CREATE DATABASE lending_db;
\q

# Run migrations (when available)
npm run migration:run
```

## Configuration

Update `.env` file with your settings:

```env
# Database
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=lending_db

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Currency
DEFAULT_CURRENCY=USD
CURRENCY_PRECISION=2

# Lending Settings
LOAN_ACCRUAL_FREQUENCY=Monthly
INTEREST_DAY_COUNT_CONVENTION=Actual/365
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## API Documentation (Swagger/OpenAPI)

The API includes comprehensive Swagger/OpenAPI documentation for interactive exploration and testing.

### Access Swagger UI

Once the application is running, visit:

```
http://localhost:3000/api-docs
```

### Features

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Request/Response Schemas**: View detailed data models
- **Authentication Support**: JWT Bearer token authentication
- **Export OpenAPI Spec**: Download JSON/YAML specification

### Documentation Includes

- All API endpoints with descriptions
- Request/response examples
- Validation rules and constraints
- Error response codes
- Authentication requirements

For detailed information, see [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md)

## API Endpoints

### Loans
- `POST /api/loans` - Create loan
- `GET /api/loans` - List all loans
- `GET /api/loans/:id` - Get loan by ID
- `GET /api/loans/number/:loanNumber` - Get loan by number
- `PATCH /api/loans/:id` - Update loan
- `POST /api/loans/:id/submit` - Submit loan
- `POST /api/loans/:id/cancel` - Cancel loan
- `DELETE /api/loans/:id` - Delete loan

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Key Modules

### Calculation Engine
- EMI calculation (reducing balance method)
- Interest calculation (multiple day count conventions)
- Penalty calculation
- Outstanding amount calculation

### State Machine
- Loan status transitions
- Validation of state changes
- Automatic status updates

### Scheduled Jobs
- Daily interest accrual
- Daily demand generation
- Security shortfall checks
- Loan classification updates

## Database Schema

The application uses TypeORM entities that map to PostgreSQL tables:
- `loans` - Main loan table
- `loan_products` - Loan product master
- `loan_repayment_schedules` - Repayment schedules
- `loan_disbursements` - Disbursement records
- `loan_repayments` - Repayment records
- `loan_demands` - Loan demands
- `loan_interest_accruals` - Interest accrual records

## Documentation

This implementation follows the comprehensive documentation created for the Uruti Lending Platform:
- LENDING_TECHNICAL_SPECIFICATION.md - System architecture and algorithms
- LENDING_IMPLEMENTATION_GUIDE.md - Code examples and patterns
- LENDING_DATA_MODEL.md - Entity definitions and relationships
- LENDING_BUSINESS_RULES.md - Business logic and validations
- LENDING_API_ENDPOINTS.md - API specifications

## License

MIT
