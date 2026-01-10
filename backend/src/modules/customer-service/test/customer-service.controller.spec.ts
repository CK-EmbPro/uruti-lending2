import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, CanActivate, Injectable } from '@nestjs/common';
import * as request from 'supertest';
import { CustomerServiceController } from '../customer-service.controller';
import { CustomerServiceService } from '../services/customer-service.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Mock guard that sets user on request
@Injectable()
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { 
      id: 'user-123', 
      name: 'Test User',
      email: 'test@example.com'
    };
    return true;
  }
}

describe('CustomerServiceController (e2e)', () => {
  let app: INestApplication;
  let service: CustomerServiceService;

  const mockCustomerService = {
    createPaymentExtension: jest.fn(),
    approvePaymentExtension: jest.fn(),
    denyPaymentExtension: jest.fn(),
    getLoanExtensions: jest.fn(),
    createDispute: jest.fn(),
    resolveDispute: jest.fn(),
    escalateDispute: jest.fn(),
    getLoanDisputes: jest.fn(),
    createAccountUpdate: jest.fn(),
    verifyAndProcessAccountUpdate: jest.fn(),
    getLoanAccountUpdates: jest.fn(),
    createFeeWaiver: jest.fn(),
    approveFeeWaiver: jest.fn(),
    denyFeeWaiver: jest.fn(),
    getLoanFeeWaivers: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CustomerServiceController],
      providers: [
        {
          provide: CustomerServiceService,
          useValue: mockCustomerService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new MockJwtAuthGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Set up user on all requests via middleware
    app.use((req: any, res: any, next: any) => {
      if (!req.user) {
        req.user = { 
          id: 'user-123', 
          name: 'Test User',
          email: 'test@example.com'
        };
      }
      next();
    });
    
    service = moduleFixture.get<CustomerServiceService>(CustomerServiceService);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /customer-service/payment-extensions', () => {
    it('should create payment extension request', async () => {
      const mockExtension = {
        id: 'extension-123',
        loanId: 'loan-123',
        extensionDays: 7,
        status: 'Pending',
      };

      mockCustomerService.createPaymentExtension.mockResolvedValue(mockExtension);

      return request(app.getHttpServer())
        .post('/customer-service/payment-extensions')
        .send({
          loanId: 'loan-123',
          originalDueDate: new Date().toISOString(),
          extensionDays: 7,
          extensionType: 'One-Time Courtesy',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.extensionDays).toBe(7);
          expect(res.body.status).toBe('Pending');
        });
    });
  });

  describe('POST /customer-service/payment-extensions/:id/approve', () => {
    it('should approve payment extension', async () => {
      const mockExtension = {
        id: 'extension-123',
        status: 'Approved',
        approved: true,
      };

      mockCustomerService.approvePaymentExtension.mockResolvedValue(mockExtension);

      return request(app.getHttpServer())
        .post('/customer-service/payment-extensions/extension-123/approve')
        .send({ remarks: 'Approved' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Approved');
          expect(res.body.approved).toBe(true);
        });
    });
  });

  describe('POST /customer-service/payment-extensions/:id/deny', () => {
    it('should deny payment extension', async () => {
      const mockExtension = {
        id: 'extension-123',
        status: 'Denied',
        approved: false,
        denialReason: 'Insufficient justification',
      };

      mockCustomerService.denyPaymentExtension.mockResolvedValue(mockExtension);

      return request(app.getHttpServer())
        .post('/customer-service/payment-extensions/extension-123/deny')
        .send({ denialReason: 'Insufficient justification' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Denied');
        });
    });
  });

  describe('GET /customer-service/loans/:loanId/payment-extensions', () => {
    it('should return extensions for loan', async () => {
      const mockExtensions = [
        {
          id: 'extension-1',
          loanId: 'loan-123',
          status: 'Approved',
        },
      ];

      mockCustomerService.getLoanExtensions.mockResolvedValue(mockExtensions);

      return request(app.getHttpServer())
        .get('/customer-service/loans/loan-123/payment-extensions')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
        });
    });
  });

  describe('POST /customer-service/disputes', () => {
    it('should create dispute', async () => {
      const mockDispute = {
        id: 'dispute-123',
        loanId: 'loan-123',
        disputeType: 'Payment Dispute',
        status: 'Open',
      };

      mockCustomerService.createDispute.mockResolvedValue(mockDispute);

      return request(app.getHttpServer())
        .post('/customer-service/disputes')
        .send({
          loanId: 'loan-123',
          disputeType: 'Payment Dispute',
          description: 'Payment was made but not recorded',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Open');
        });
    });
  });

  describe('POST /customer-service/disputes/:id/resolve', () => {
    it('should resolve dispute', async () => {
      const mockResolution = {
        id: 'resolution-123',
        disputeId: 'dispute-123',
        resolutionType: 'Resolved in Favor of Borrower',
      };

      mockCustomerService.resolveDispute.mockResolvedValue(mockResolution);

      return request(app.getHttpServer())
        .post('/customer-service/disputes/dispute-123/resolve')
        .send({
          resolutionType: 'Resolved in Favor of Borrower',
          resolutionDetails: 'Payment was found and credited',
          adjustmentAmount: 1000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.resolutionType).toBe('Resolved in Favor of Borrower');
        });
    });
  });

  describe('POST /customer-service/account-updates', () => {
    it('should create account update request', async () => {
      const mockUpdate = {
        id: 'update-123',
        loanId: 'loan-123',
        updateType: 'Address Change',
        identityVerified: false,
      };

      mockCustomerService.createAccountUpdate.mockResolvedValue(mockUpdate);

      return request(app.getHttpServer())
        .post('/customer-service/account-updates')
        .send({
          loanId: 'loan-123',
          updateType: 'Address Change',
          newAddress: '123 New Street',
          newCity: 'New City',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.updateType).toBe('Address Change');
        });
    });
  });

  describe('POST /customer-service/fee-waivers', () => {
    it('should create fee waiver request', async () => {
      const mockWaiver = {
        id: 'waiver-123',
        loanId: 'loan-123',
        feeAmount: 50,
        status: 'Pending',
      };

      mockCustomerService.createFeeWaiver.mockResolvedValue(mockWaiver);

      return request(app.getHttpServer())
        .post('/customer-service/fee-waivers')
        .send({
          loanId: 'loan-123',
          waiverType: 'One-Time Courtesy',
          feeType: 'Late Fee',
          feeAmount: 50,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Pending');
        });
    });
  });

  describe('POST /customer-service/fee-waivers/:id/approve', () => {
    it('should approve fee waiver', async () => {
      const mockWaiver = {
        id: 'waiver-123',
        status: 'Processed',
        approved: true,
      };

      mockCustomerService.approveFeeWaiver.mockResolvedValue(mockWaiver);

      return request(app.getHttpServer())
        .post('/customer-service/fee-waivers/waiver-123/approve')
        .send({ remarks: 'Approved' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Processed');
        });
    });
  });
});

