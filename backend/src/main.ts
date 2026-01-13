import { NestFactory } from "@nestjs/core";
import { ValidationPipe, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ["error", "warn", "log", "debug", "verbose"],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>("PORT") || 3000;
    const apiPrefix = configService.get<string>("API_PREFIX") || "api";

    // Global prefix
    app.setGlobalPrefix(apiPrefix);

    // CORS configuration with credentials support
    app.enableCors({
      origin: (process.env.CORS_ORIGIN || "http://localhost:3001")
        .split(",")
        .map((o) => o.trim()),
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true, // Allow cookies to be sent
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400, // 24 hours
    });

    // Cookie parser middleware - MUST come after CORS
    app.use(cookieParser());

    // Swagger/OpenAPI configuration
    const config = new DocumentBuilder()
      .setTitle("Uruti Lending Platform API")
      .setDescription(
        `
# Uruti Lending - Complete API Documentation

## Overview
Complete REST API for the Uruti Lending system with comprehensive loan management features.

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

## API Version
Version: 1.0.0
      `.trim()
      )
      .setVersion("1.0.0")
      .setContact("Uruti Lending Team", "", "support@urutilending.com")
      .setLicense("Proprietary", "")
      // Core Modules
      .addTag("auth", "Authentication and authorization endpoints")
      .addTag("companies", "Company management operations")
      .addTag("customers", "Customer management and duplicate checking")
      // Loan Product
      .addTag("loan-products", "Loan product configuration and charges")
      // Loan Application
      .addTag("loan-applications", "Loan application processing and workflow")
      .addTag(
        "loan-application-documents",
        "Loan application document upload and verification"
      )
      .addTag("document-types", "Document type master data")
      // Loan Management
      .addTag(
        "loans",
        "Loan management operations (CRUD, closure, NPA, transfer, FLDG)"
      )
      .addTag("loan-disbursements", "Loan disbursement management")
      .addTag(
        "loan-repayments",
        "Loan repayment operations (17 types, bulk repayment)"
      )
      .addTag("loan-demands", "Loan demand generation and tracking")
      .addTag("loan-interest-accruals", "Interest accrual tracking")
      // Loan Operations
      .addTag("loan-write-offs", "Loan write-off operations")
      .addTag("loan-refunds", "Loan refund operations")
      .addTag("loan-balance-adjustments", "Loan balance adjustment operations")
      .addTag("loan-restructures", "Loan restructure operations")
      .addTag("loan-transfers", "Loan transfer operations and history")
      // Security Management
      .addTag("loan-securities", "Loan security master data")
      .addTag(
        "loan-security-assignments",
        "Security assignment, pledging, and release"
      )
      .addTag("loan-security-prices", "Security price management and history")
      .addTag(
        "loan-security-shortfalls",
        "Security shortfall detection and resolution"
      )
      .addTag("loan-security-deposit", "Security deposit usage tracking")
      // Co-Lending
      .addTag(
        "loan-partners",
        "Co-lending partner management and FLDG configuration"
      )
      // Charges and Accounting
      .addTag("loan-charge-postings", "Loan charge posting tracking")
      .addTag("accounting", "Accounting and journal entry management")
      // Reporting
      .addTag(
        "reporting",
        "Financial reporting (Portfolio, NPA, Collection, Disbursement, Overdue)"
      )
      // Workflow
      .addTag("workflows", "Workflow engine management and actions")
      // Calculations
      .addTag("calculations", "Financial calculations (EMI, interest, penalty)")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth"
      )
      .addServer(`http://localhost:${port}/${apiPrefix}`, "Development server")
      .addServer("https://api.urutilending.com/api", "Production server")
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey}_${methodKey}`,
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
    });

    SwaggerModule.setup("api-docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
      customSiteTitle: "Uruti Lending API Documentation",
      customfavIcon: "/favicon.ico",
      customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { margin: 20px 0; }
    `,
      useGlobalPrefix: false,
    });

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          // Customize validation error messages
          const messages = errors.map((error) => {
            return Object.values(error.constraints || {}).join(", ");
          });
          return new HttpException(
            {
              statusCode: 400,
              message: "Validation failed",
              errors: messages,
            },
            400
          );
        },
      })
    );

    await app.listen(port);
    console.log(
      `🚀 Uruti Lending Platform API is running on: http://localhost:${port}/${apiPrefix}`
    );
    console.log(
      `📚 Swagger documentation available at: http://localhost:${port}/api-docs`
    );
    console.log(
      `📄 OpenAPI JSON spec available at: http://localhost:${port}/api-docs-json`
    );
  } catch (error) {
    console.error("❌ Failed to start the application:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error("❌ Unhandled error during bootstrap:", error);
  process.exit(1);
});
