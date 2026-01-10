# Swagger/OpenAPI Documentation Guide

## Overview

The Uruti Lending Platform API includes comprehensive Swagger/OpenAPI documentation that allows developers to explore, test, and understand all available endpoints.

## Accessing Swagger Documentation

Once the application is running, access the Swagger UI at:

```
http://localhost:3000/api-docs
```

## Features

### 1. Interactive API Explorer
- Browse all available endpoints organized by tags
- View request/response schemas
- Test endpoints directly from the browser
- See example requests and responses

### 2. Authentication
- JWT Bearer token authentication is supported
- Click the "Authorize" button in Swagger UI
- Enter your JWT token to test protected endpoints
- Token persists across page refreshes

### 3. API Tags
Endpoints are organized into the following tags:
- **loans**: Loan management operations
- **loan-products**: Loan product configuration
- **loan-applications**: Loan application processing
- **loan-repayments**: Loan repayment operations
- **loan-disbursements**: Loan disbursement management
- **loan-demands**: Loan demand generation
- **loan-interest-accrual**: Interest accrual operations
- **loan-security**: Loan security/collateral management
- **calculations**: Financial calculations (EMI, interest, penalty)
- **auth**: Authentication and authorization
- **company**: Company management

## Using Swagger UI

### Testing Endpoints

1. **Select an endpoint** from the list
2. **Click "Try it out"** button
3. **Fill in parameters** (path, query, body)
4. **Click "Execute"** to send the request
5. **View response** with status code, headers, and body

### Request Examples

Swagger automatically generates example requests based on DTO definitions. You can:
- Modify example values
- See validation rules
- Understand required vs optional fields

### Response Documentation

Each endpoint documents:
- Success responses (200, 201, etc.)
- Error responses (400, 404, 500, etc.)
- Response schemas with data types

## API Documentation Structure

### Endpoint Documentation Includes:
- **Summary**: Brief description of what the endpoint does
- **Description**: Detailed explanation
- **Parameters**: Path, query, and body parameters with types
- **Responses**: All possible response codes and schemas
- **Security**: Authentication requirements

### DTO Documentation Includes:
- **Property descriptions**: What each field represents
- **Data types**: String, number, enum, date, etc.
- **Validation rules**: Required, optional, min/max values
- **Examples**: Sample values for each field

## Exporting API Specification

You can export the OpenAPI specification in JSON or YAML format:

```
http://localhost:3000/api-docs-json
```

This can be used with:
- Postman (import OpenAPI spec)
- API testing tools
- Code generation tools
- API gateway configuration

## Adding Documentation to New Endpoints

### Controller Example:
```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('your-tag')
@Controller('your-endpoint')
export class YourController {
  @Post()
  @ApiOperation({ summary: 'Brief description', description: 'Detailed description' })
  @ApiBody({ type: YourDto })
  @ApiResponse({ status: 201, description: 'Success message' })
  @ApiResponse({ status: 400, description: 'Error message' })
  create(@Body() dto: YourDto) {
    // implementation
  }
}
```

### DTO Example:
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class YourDto {
  @ApiProperty({ description: 'Field description', example: 'example-value' })
  @IsString()
  fieldName: string;

  @ApiPropertyOptional({ description: 'Optional field', example: 'optional-value' })
  @IsOptional()
  optionalField?: string;
}
```

## Best Practices

1. **Always document endpoints**: Add Swagger decorators to all controllers
2. **Provide examples**: Include example values in DTOs
3. **Document errors**: List all possible error responses
4. **Use meaningful descriptions**: Help developers understand the API
5. **Organize with tags**: Group related endpoints together
6. **Document authentication**: Specify which endpoints require authentication

## Troubleshooting

### Swagger UI not loading?
- Ensure the application is running
- Check that port 3000 is not blocked
- Verify `@nestjs/swagger` is installed

### Missing documentation?
- Add `@ApiTags()` to controllers
- Add `@ApiOperation()` to endpoints
- Add `@ApiProperty()` to DTO fields

### Authentication not working?
- Ensure JWT token is valid
- Check token format: `Bearer <token>`
- Verify authentication guard is configured

## Additional Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

