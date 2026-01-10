# Database Seed Mechanism Documentation

## Overview
The Uruti Lending Platform uses **manual seed scripts** executed via npm commands. Seeds are **NOT** executed automatically on application boot. All seeds must be run manually when needed.

## Seed Execution Method

### ✅ Manual Execution (Current Implementation)
All seeds are executed **manually** via npm scripts. There is **NO automatic seeding on application startup**.

### ❌ No Automatic Seeding
- Seeds do **NOT** run on `npm start` or `npm run start:dev`
- Seeds do **NOT** run via `OnModuleInit` hooks
- Seeds do **NOT** run on database connection
- Seeds are **standalone scripts** that must be executed explicitly

## Available Seed Scripts

### 1. User Seeds
**Script**: `src/scripts/seed-users.ts`  
**Command**: `npm run seed:users [force]`

**Purpose**: Seeds default system users for testing and development

**Usage**:
```bash
# Normal seed (only if no users exist)
npm run seed:users

# Force seed (creates users even if some exist)
npm run seed:users force
```

**Service**: `UserSeedService` in `modules/auth/user-seed.service.ts`

**What it does**:
- Creates 5 default users with different roles:
  - **Admin**: `admin@urutilending.com` / `admin123` (admin, user)
  - **Loan Officer**: `loan.officer@urutilending.com` / `officer123` (loan_officer, user)
  - **Manager**: `manager@urutilending.com` / `manager123` (manager, loan_officer, user)
  - **Approver**: `approver@urutilending.com` / `approver123` (approver, user)
  - **Regular User**: `user@urutilending.com` / `user123` (user)
- Normal mode: Only seeds if no users exist in the database
- Force mode: Creates users even if some exist (skips existing emails)

**Note**: Also available via API endpoints:
- `POST /api/auth/seed` - Normal seed
- `POST /api/auth/seed/force` - Force seed

---

### 2. Account Seeds (Chart of Accounts)
**Script**: `src/scripts/seed-accounts.ts`  
**Command**: `npm run seed:accounts [companyId] [force]`

**Purpose**: Seeds the Chart of Accounts for a company

**Usage**:
```bash
# Seed for default company
npm run seed:accounts

# Seed for specific company
npm run seed:accounts <company-id>

# Force recreate (delete existing and recreate)
npm run seed:accounts <company-id> force
```

**Service**: `AccountSeedService` in `modules/accounting/services/account-seed.service.ts`

---

### 3. Loan Application Seeds
**Script**: `src/scripts/seed-loan-applications.ts`  
**Command**: `npm run seed:loan-applications`

**Purpose**: Creates sample loan applications and associated loans

**Usage**:
```bash
npm run seed:loan-applications
```

**Service**: `LoanApplicationSeedService` in `modules/loan-application/loan-application-seed.service.ts`

**What it does**:
- Creates sample loan applications with various statuses
- Creates loans for approved applications that don't have loans

---

### 4. Repayment Seeds
**Script**: `src/scripts/seed-repayments.ts`  
**Command**: `npm run seed:repayments`

**Purpose**: Creates sample repayment records

**Usage**:
```bash
npm run seed:repayments
```

**Service**: `LoanRepaymentSeedService` in `modules/loan-repayment/loan-repayment-seed.service.ts`

**What it does**:
- Creates sample repayments for existing loans
- Creates repayments for loans that don't have any repayments yet

---

### 5. Micro Lending Product Seeds
**Script**: `src/scripts/seed-micro-lending-products.ts`  
**Command**: `npm run seed:micro-lending`

**Purpose**: Seeds micro-lending loan products

**Usage**:
```bash
npm run seed:micro-lending
```

---

### 6. Saved Searches Seeds
**Script**: `src/scripts/seed-saved-searches.ts`  
**Command**: `npm run seed:saved-searches`

**Purpose**: Creates sample saved search configurations

**Usage**:
```bash
npm run seed:saved-searches
```

---

### 7. Customer Portal Seeds
**Script**: `src/scripts/seed-customer-portal.ts`  
**Command**: `npm run seed:customer-portal`

**Purpose**: Seeds customer portal users and test data

**Usage**:
```bash
npm run seed:customer-portal
```

---

### 8. ML Training Data Seeds
**Script**: `src/scripts/seed-ml-training-data.ts`  
**Command**: `npm run seed:ml-training-data`

**Purpose**: Generates machine learning training data for credit scoring

**Usage**:
```bash
npm run seed:ml-training-data
```

**Options**:
- Can generate synthetic loan application data
- Can train ML models
- Can export data to JSON files

---

## Seed Script Architecture

### Script Pattern
All seed scripts follow this pattern:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../modules/.../seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    console.log('🌱 Starting seed...');
    await seedService.seed();
    console.log('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  }
}

bootstrap();
```

### Key Points
1. **Application Context**: Uses `NestFactory.createApplicationContext()` (not full HTTP app)
2. **Dependency Injection**: Gets seed service from DI container
3. **Error Handling**: Catches errors and exits with appropriate codes
4. **Logging**: Console logs for progress tracking

### Service Pattern
Seed services are injectable services:

```typescript
@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
  ) {}

  async seed(): Promise<void> {
    // Seed logic here
  }
}
```

## Seed Service Locations

### Module-Based Seeds
Seeds are located within their respective modules:

- **Accounts**: `modules/accounting/services/account-seed.service.ts`
- **Loan Applications**: `modules/loan-application/loan-application-seed.service.ts`
- **Repayments**: `modules/loan-repayment/loan-repayment-seed.service.ts`
- **ML Data**: `modules/credit-scoring-engine/services/ml-seed-data-generator.service.ts`

### Script Entry Points
All scripts are in `src/scripts/`:
- `seed-users.ts`
- `seed-accounts.ts`
- `seed-loan-applications.ts`
- `seed-repayments.ts`
- `seed-micro-lending-products.ts`
- `seed-saved-searches.ts`
- `seed-customer-portal.ts`
- `seed-ml-training-data.ts`

## NPM Scripts Configuration

All seed commands are defined in `package.json`:

```json
{
  "scripts": {
    "seed:users": "ts-node -r tsconfig-paths/register src/scripts/seed-users.ts",
    "seed:accounts": "ts-node -r tsconfig-paths/register src/scripts/seed-accounts.ts",
    "seed:loan-applications": "ts-node -r tsconfig-paths/register src/scripts/seed-loan-applications.ts",
    "seed:repayments": "ts-node -r tsconfig-paths/register src/scripts/seed-repayments.ts",
    "seed:micro-lending": "ts-node -r tsconfig-paths/register src/scripts/seed-micro-lending-products.ts",
    "seed:saved-searches": "ts-node -r tsconfig-paths/register src/scripts/seed-saved-searches.ts",
    "seed:customer-portal": "ts-node -r tsconfig-paths/register src/scripts/seed-customer-portal.ts",
    "seed:ml-training-data": "ts-node -r tsconfig-paths/register src/scripts/seed-ml-training-data.ts"
  }
}
```

## Execution Requirements

### Prerequisites
1. **Database**: PostgreSQL database must be running and accessible
2. **Environment**: `.env` file must be configured with database credentials
3. **Dependencies**: All npm packages must be installed (`npm install`)

### Execution Order (Recommended)
For a fresh database setup:

```bash
# 1. Run migrations first (if any)
npm run migration:run

# 2. Seed users (required for authentication)
npm run seed:users

# 3. Seed accounts (Chart of Accounts)
npm run seed:accounts

# 4. Seed loan applications
npm run seed:loan-applications

# 5. Seed repayments
npm run seed:repayments

# 6. Seed other data as needed
npm run seed:micro-lending
npm run seed:saved-searches
npm run seed:customer-portal
```

## Seed Data Characteristics

### Idempotency
- Most seeds check for existing data before creating
- Some seeds support `force` mode to recreate data
- Seeds should be safe to run multiple times

### Data Relationships
- Seeds respect foreign key relationships
- Seeds create related entities in correct order
- Example: Loan applications → Loans → Repayments

### Sample Data
- Seeds create realistic sample data
- Data is suitable for development/testing
- Production seeds should be reviewed before use

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `.env` database configuration
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Module Not Found**
   - Run `npm install` to install dependencies
   - Check TypeScript path mappings in `tsconfig.json`

3. **Foreign Key Violations**
   - Run seeds in correct order
   - Ensure prerequisite data exists (e.g., companies, users)

4. **Permission Errors**
   - Check database user permissions
   - Ensure user can create tables and insert data

## Best Practices

1. **Idempotency**: Seeds should be safe to run multiple times
2. **Error Handling**: Graceful error handling with clear messages
3. **Logging**: Clear console output for progress tracking
4. **Validation**: Validate data before insertion
5. **Relationships**: Maintain referential integrity
6. **Documentation**: Document seed purpose and usage

## Future Considerations

### Potential Enhancements
- **Automatic Seeding**: Option to seed on first boot (development only)
- **Seed Profiles**: Different seed sets for dev/staging/prod
- **Seed Rollback**: Ability to undo seed operations
- **Seed Validation**: Validate seed data completeness
- **Seed Dependencies**: Automatic dependency resolution

