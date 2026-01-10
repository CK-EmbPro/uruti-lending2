# Backend Architecture Documentation

## Overview
The Uruti Lending Platform backend is built using **NestJS** (Node.js framework) with **TypeORM** for database management, **PostgreSQL** as the primary database, and follows a modular architecture pattern.

## Technology Stack
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via TypeORM)
- **Authentication**: JWT (Passport)
- **API Documentation**: Swagger/OpenAPI
- **Queue Management**: Bull (Redis-based)
- **Scheduling**: @nestjs/schedule
- **Event System**: @nestjs/event-emitter
- **Caching**: Redis (via cache-manager)

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module (imports all feature modules)
│   ├── config/                     # Configuration files
│   │   ├── configuration.ts       # Environment-based configuration
│   │   └── swagger.config.ts       # Swagger/OpenAPI setup
│   ├── database/                  # Database configuration
│   │   ├── database.module.ts     # TypeORM module with all entities
│   │   ├── data-source.ts         # TypeORM data source for migrations
│   │   └── migrations/            # Database migration files
│   ├── common/                     # Shared utilities
│   │   ├── decorators/            # Custom decorators (roles, company-id)
│   │   ├── enums/                 # Shared enumerations
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards (JWT, roles, company)
│   │   ├── interceptors/          # Request/response interceptors
│   │   └── utils/                 # Utility functions
│   ├── modules/                   # Feature modules (100+ modules)
│   │   ├── auth/                  # Authentication & authorization
│   │   ├── loan/                  # Core loan management
│   │   ├── loan-application/      # Loan application processing
│   │   ├── loan-repayment/        # Repayment operations
│   │   ├── loan-disbursement/     # Disbursement management
│   │   ├── accounting/            # Accounting & journal entries
│   │   ├── workflow/              # Workflow engine
│   │   ├── ai/                     # AI/ML features
│   │   ├── analytics/             # Analytics & reporting
│   │   └── ...                    # 90+ additional feature modules
│   └── scripts/                   # Seed scripts (manual execution)
│       ├── seed-accounts.ts
│       ├── seed-loan-applications.ts
│       ├── seed-repayments.ts
│       └── ...
```

## Architecture Patterns

### 1. Modular Architecture
Each feature is organized as a self-contained module following NestJS module pattern:

```
module-name/
├── entities/              # TypeORM entities (database models)
├── dto/                   # Data Transfer Objects (request/response)
├── services/              # Business logic
├── controllers/           # HTTP endpoints
├── *.module.ts            # Module definition
└── *.service.ts           # Main service (if not in services/)
```

### 2. Module Structure Example
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [EntityController],
  providers: [EntityService],
  exports: [EntityService],  // For use in other modules
})
export class EntityModule {}
```

### 3. Service Layer Pattern
- **Services**: Contain business logic, database operations
- **Controllers**: Handle HTTP requests/responses, validation
- **DTOs**: Define request/response shapes with validation
- **Entities**: Database models with TypeORM decorators

### 4. Dependency Injection
NestJS uses dependency injection throughout:
- Services injected into controllers
- Repositories injected into services
- ConfigService for environment variables

## Key Modules

### Core Loan Management
- **loan/**: Loan CRUD, lifecycle management, NPA classification
- **loan-application/**: Application workflow, approval/rejection
- **loan-repayment/**: 17 repayment types, bulk operations
- **loan-disbursement/**: Disbursement tracking, partial disbursements
- **loan-product/**: Product configuration, charges, eligibility

### Financial Operations
- **accounting/**: Journal entries, GL entries, chart of accounts
- **loan-calculator/**: EMI, interest, penalty calculations
- **calculation/**: Financial calculation utilities

### Advanced Features
- **workflow/**: Multi-step approval workflows
- **ai/**: AI chatbot, document processing, product recommendations
- **analytics/**: Reporting, dashboards, portfolio analytics
- **collections/**: Collections management, NPA tracking
- **risk-management/**: Risk assessment, monitoring
- **compliance/**: Regulatory compliance, KYC/AML

### Integration & Infrastructure
- **auth/**: JWT authentication, user management
- **company/**: Multi-tenant company management
- **notification/**: Email, SMS, push notifications
- **integration/**: Third-party platform integrations
- **search/**: Global search, saved searches

## Database Architecture

### TypeORM Configuration
- **Location**: `src/database/database.module.ts`
- **Entities**: 100+ entities registered
- **Migrations**: TypeORM migrations in `database/migrations/`
- **Connection**: PostgreSQL via TypeORM

### Entity Pattern
```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  field: string;

  @ManyToOne(() => RelatedEntity)
  relation: RelatedEntity;
}
```

## API Architecture

### Global Configuration
- **Base Path**: `/api` (configurable via `API_PREFIX`)
- **Port**: 3000 (default, configurable)
- **CORS**: Enabled with configurable origins
- **Swagger**: Available at `/api-docs`

### Authentication
- **Strategy**: JWT Bearer tokens
- **Guard**: `JwtAuthGuard` (applied globally or per route)
- **Token Storage**: Client-side (localStorage in frontend)

### Request Flow
```
HTTP Request
  ↓
Global Validation Pipe (class-validator)
  ↓
Global Exception Filter
  ↓
Route Guard (JWT, Roles, Company)
  ↓
Controller (DTO validation)
  ↓
Service (Business logic)
  ↓
Repository (Database operations)
  ↓
Response
```

## Configuration Management

### Environment Variables
- **Location**: `.env` or `.env.local`
- **Loading**: `ConfigModule.forRoot()` in `app.module.ts`
- **Access**: Via `ConfigService` throughout application

### Key Configuration Files
- `src/config/configuration.ts`: Centralized config structure
- `src/config/swagger.config.ts`: Swagger documentation setup

## Error Handling

### Global Exception Filter
- **Location**: `src/common/filters/http-exception.filter.ts`
- **Purpose**: Standardize error responses
- **Format**: `{ statusCode, message, errors? }`

### Validation
- **Global Validation Pipe**: Enabled in `main.ts`
- **Library**: `class-validator` + `class-transformer`
- **Behavior**: Whitelist, forbid non-whitelisted, auto-transform

## Background Jobs & Scheduling

### Bull Queue
- **Purpose**: Async job processing
- **Storage**: Redis
- **Configuration**: In `app.module.ts`

### Scheduled Tasks
- **Module**: `@nestjs/schedule`
- **Usage**: `@Cron()` decorator in services
- **Examples**: Interest accrual, payment reminders

## Event System

### Event Emitter
- **Module**: `@nestjs/event-emitter`
- **Usage**: `@OnEvent()` decorator for listeners
- **Purpose**: Decoupled module communication

## Testing

### Test Structure
- **Unit Tests**: `*.spec.ts` files alongside source
- **E2E Tests**: `test/` directory
- **Framework**: Jest
- **Commands**: 
  - `npm test` - Unit tests
  - `npm run test:e2e` - E2E tests
  - `npm run test:cov` - Coverage

## Deployment

### Build Process
```bash
npm run build        # Compile TypeScript
npm run start:prod   # Run production build
```

### Environment Setup
- Database: PostgreSQL connection required
- Redis: Required for Bull queues
- Environment variables: Configured via `.env`

## Best Practices

1. **Module Organization**: One feature = one module
2. **Service Layer**: Business logic in services, not controllers
3. **DTO Validation**: Use class-validator for all inputs
4. **Error Handling**: Use NestJS exceptions (HttpException)
5. **Type Safety**: Leverage TypeScript throughout
6. **Dependency Injection**: Use constructor injection
7. **Repository Pattern**: TypeORM repositories for data access
