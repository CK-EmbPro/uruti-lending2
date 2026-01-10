# Testing Guide - Collections & Customer Service Modules

## Overview

This guide covers unit tests and integration tests for the Collections and Customer Service modules.

## Test Structure

### Unit Tests
- **Location**: `src/modules/{module}/test/{service}.spec.ts`
- **Purpose**: Test individual service methods in isolation
- **Mocking**: All dependencies are mocked

### Integration Tests
- **Location**: `src/modules/{module}/test/{module}.integration.spec.ts`
- **Purpose**: Test complete workflows with database
- **Database**: Uses test database connection

### Controller Tests (E2E)
- **Location**: `src/modules/{module}/test/{controller}.spec.ts`
- **Purpose**: Test API endpoints
- **Mocking**: Services are mocked, controllers are real

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Module Tests
```bash
# Collections tests
npm run test:collections

# Customer Service tests
npm run test:customer-service
```

### Run Integration Tests
```bash
npm run test:e2e
```

## Test Files Created

### Collections Module

1. **collections.service.spec.ts** - Unit tests for CollectionsService
   - ✅ Delinquency detection
   - ✅ Collection workflow creation
   - ✅ Notice sending
   - ✅ Activity creation
   - ✅ Payment arrangement
   - ✅ Skip tracing
   - ✅ Legal actions
   - ✅ Third-party placement
   - ✅ Charge-off processing

2. **collections.controller.spec.ts** - E2E tests for CollectionsController
   - ✅ All API endpoints
   - ✅ Request/response validation
   - ✅ Error handling

3. **collections.integration.spec.ts** - Integration tests
   - ✅ Complete workflow tests
   - ✅ Database interactions

4. **test-helpers.ts** - Test utilities and fixtures
   - Mock data factories
   - Helper functions

### Customer Service Module

1. **customer-service.service.spec.ts** - Unit tests for CustomerServiceService
   - ✅ Payment extension creation/approval/denial
   - ✅ Dispute creation/resolution
   - ✅ Account update creation/verification
   - ✅ Fee waiver creation/approval/denial
   - ✅ Query methods

2. **customer-service.controller.spec.ts** - E2E tests for CustomerServiceController
   - ✅ All API endpoints
   - ✅ Request/response validation
   - ✅ Error handling

3. **customer-service.integration.spec.ts** - Integration tests
   - ✅ Complete workflow tests
   - ✅ Database interactions

4. **test-helpers.ts** - Test utilities and fixtures
   - Mock data factories
   - Helper functions

## Test Coverage

### Collections Service Coverage
- ✅ `detectDelinquency` - Multiple scenarios (early, mid, late stages)
- ✅ `createCollectionWorkflow` - Workflow creation
- ✅ `sendCollectionNotice` - Notice sending
- ✅ `createCollectionActivity` - Activity recording
- ✅ `createPaymentArrangement` - Arrangement creation
- ✅ `createSkipTrace` - Skip trace creation
- ✅ `createLegalAction` - Legal action creation
- ✅ `createThirdPartyPlacement` - Placement creation
- ✅ `processChargeOff` - Charge-off processing
- ✅ `getDelinquentLoans` - Query methods

### Customer Service Coverage
- ✅ `createPaymentExtension` - Extension creation
- ✅ `approvePaymentExtension` - Extension approval with schedule update
- ✅ `denyPaymentExtension` - Extension denial
- ✅ `createDispute` - Dispute creation
- ✅ `resolveDispute` - Dispute resolution
- ✅ `createAccountUpdate` - Account update creation
- ✅ `verifyAndProcessAccountUpdate` - Update verification
- ✅ `createFeeWaiver` - Waiver creation
- ✅ `approveFeeWaiver` - Waiver approval
- ✅ `denyFeeWaiver` - Waiver denial
- ✅ Query methods (getLoanExtensions, getLoanDisputes, etc.)

## Test Patterns

### Mocking Repositories
```typescript
const mockRepositories = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
```

### Testing Service Methods
```typescript
it('should create payment extension', async () => {
  jest.spyOn(loanRepository, 'findOne').mockResolvedValue(mockLoan);
  jest.spyOn(extensionRepository, 'create').mockReturnValue(mockExtension);
  jest.spyOn(extensionRepository, 'save').mockResolvedValue(mockExtension);

  const result = await service.createPaymentExtension(dto, userId, userName);

  expect(result).toBeDefined();
  expect(extensionRepository.save).toHaveBeenCalled();
});
```

### Testing Controllers
```typescript
it('should create payment extension via API', async () => {
  mockService.createPaymentExtension.mockResolvedValue(mockExtension);

  return request(app.getHttpServer())
    .post('/customer-service/payment-extensions')
    .send(dto)
    .expect(201)
    .expect((res) => {
      expect(res.body.status).toBe('Pending');
    });
});
```

## Test Data Fixtures

### Collections Fixtures
- `createMockLoan` - Loan entity factory
- `createMockSchedule` - Repayment schedule factory
- `createMockDelinquencyRecord` - Delinquency record factory
- `createMockWorkflow` - Collection workflow factory
- `createOverdueSchedule` - Overdue schedule helper

### Customer Service Fixtures
- `createMockLoan` - Loan entity factory
- `createMockPaymentExtension` - Extension factory
- `createMockDispute` - Dispute factory
- `createMockAccountUpdate` - Account update factory
- `createMockFeeWaiver` - Fee waiver factory

## Best Practices

1. **Test Independence**: Each test should be independent
2. **Clear Test Names**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Dependencies**: Mock database, external services
5. **Test Edge Cases**: Test error conditions, boundary cases
6. **Test Business Logic**: Focus on business rules
7. **Fast Tests**: Unit tests should be fast (< 100ms)
8. **Coverage Goals**: Aim for 80%+ code coverage

## Running Specific Tests

### Run Single Test File
```bash
npm test collections.service.spec
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create payment extension"
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## Continuous Integration

Tests should run automatically in CI/CD pipeline:
- On every commit
- On pull requests
- Before deployment

## Coverage Reports

Generate coverage reports:
```bash
npm run test:cov
```

Coverage reports are generated in `coverage/` directory.

## Troubleshooting

### Tests Failing
1. Check database connection (for integration tests)
2. Verify mocks are set up correctly
3. Check test data matches entity structure
4. Ensure all dependencies are imported

### Slow Tests
1. Use mocks instead of real database for unit tests
2. Run tests in parallel
3. Use test database for integration tests

### Mock Issues
1. Ensure mocks return proper types
2. Reset mocks in `afterEach`
3. Use `jest.clearAllMocks()` to clean up

---

**Status**: ✅ Test files created and ready for execution

