import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, CanActivate, Injectable } from '@nestjs/common';
import * as request from 'supertest';
import { CollectionsController } from '../collections.controller';
import { CollectionsService } from '../services/collections.service';
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

describe('CollectionsController (e2e)', () => {
  let app: INestApplication;
  let service: CollectionsService;

  const mockCollectionsService = {
    detectAndClassifyDelinquency: jest.fn(),
    getDelinquentLoans: jest.fn(),
    sendCollectionNotice: jest.fn(),
    createCollectionActivity: jest.fn(),
    createPaymentArrangement: jest.fn(),
    createSkipTrace: jest.fn(),
    createLegalAction: jest.fn(),
    createThirdPartyPlacement: jest.fn(),
    processChargeOff: jest.fn(),
    createPromiseToPay: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [
        {
          provide: CollectionsService,
          useValue: mockCollectionsService,
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
    
    service = moduleFixture.get<CollectionsService>(CollectionsService);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /collections/detect-delinquency', () => {
    it('should detect delinquency for loans', async () => {
      const mockRecords = [
        {
          id: 'delinquency-1',
          loanId: 'loan-123',
          daysPastDue: 5,
          collectionStage: 'Early',
        },
      ];

      mockCollectionsService.detectAndClassifyDelinquency.mockResolvedValue(mockRecords);

      return request(app.getHttpServer())
        .post('/collections/detect-delinquency')
        .send({ loanId: 'loan-123' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].daysPastDue).toBe(5);
        });
    });
  });

  describe('GET /collections/delinquent-loans', () => {
    it('should return list of delinquent loans', async () => {
      const mockLoans = [
        {
          id: 'loan-123',
          loanNumber: 'LOAN-001',
          daysPastDue: 5,
        },
      ];

      mockCollectionsService.getDelinquentLoans.mockResolvedValue(mockLoans);

      return request(app.getHttpServer())
        .get('/collections/delinquent-loans')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].daysPastDue).toBeGreaterThan(0);
        });
    });
  });

  describe('POST /collections/notices', () => {
    it('should send collection notice', async () => {
      const mockNotice = {
        id: 'notice-123',
        loanId: 'loan-123',
        noticeType: 'First Notice',
      };

      mockCollectionsService.sendCollectionNotice.mockResolvedValue(mockNotice);

      return request(app.getHttpServer())
        .post('/collections/notices')
        .send({
          loanId: 'loan-123',
          noticeType: 'First Notice',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });

  describe('POST /collections/activities', () => {
    it('should create collection activity', async () => {
      const mockActivity = {
        id: 'activity-123',
        loanId: 'loan-123',
        activityType: 'Call',
      };

      mockCollectionsService.createCollectionActivity.mockResolvedValue(mockActivity);

      return request(app.getHttpServer())
        .post('/collections/activities')
        .send({
          loanId: 'loan-123',
          activityType: 'Call',
          channel: 'Phone',
          activityDate: new Date().toISOString(),
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.activityType).toBe('Call');
        });
    });
  });

  describe('POST /collections/payment-arrangements', () => {
    it('should create payment arrangement', async () => {
      const mockArrangement = {
        id: 'arrangement-123',
        loanId: 'loan-123',
        status: 'Pending',
        totalAmount: 10000,
      };

      mockCollectionsService.createPaymentArrangement.mockResolvedValue(mockArrangement);

      return request(app.getHttpServer())
        .post('/collections/payment-arrangements')
        .send({
          loanId: 'loan-123',
          startDate: new Date().toISOString(),
          totalAmount: 10000,
          numberOfPayments: 6,
          paymentAmount: 1666.67,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Pending');
        });
    });
  });

  describe('POST /collections/skip-traces', () => {
    it('should create skip trace', async () => {
      const mockSkipTrace = {
        id: 'skip-trace-123',
        loanId: 'loan-123',
        reason: 'Unreachable',
      };

      mockCollectionsService.createSkipTrace.mockResolvedValue(mockSkipTrace);

      return request(app.getHttpServer())
        .post('/collections/skip-traces')
        .send({
          loanId: 'loan-123',
          reason: 'Unreachable',
          searchMethod: 'Database Search',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.reason).toBe('Unreachable');
        });
    });
  });

  describe('POST /collections/legal-actions', () => {
    it('should create legal action', async () => {
      const mockLegalAction = {
        id: 'legal-action-123',
        loanId: 'loan-123',
        actionType: 'Lawsuit',
        status: 'Pending Review',
      };

      mockCollectionsService.createLegalAction.mockResolvedValue(mockLegalAction);

      return request(app.getHttpServer())
        .post('/collections/legal-actions')
        .send({
          loanId: 'loan-123',
          actionType: 'Lawsuit',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.actionType).toBe('Lawsuit');
        });
    });
  });

  describe('POST /collections/third-party-placements', () => {
    it('should create third-party placement', async () => {
      const mockPlacement = {
        id: 'placement-123',
        loanId: 'loan-123',
        agencyId: 'agency-123',
        status: 'Placed',
      };

      mockCollectionsService.createThirdPartyPlacement.mockResolvedValue(mockPlacement);

      return request(app.getHttpServer())
        .post('/collections/third-party-placements')
        .send({
          loanId: 'loan-123',
          agencyId: 'agency-123',
          placementAmount: 10000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('Placed');
        });
    });
  });

  describe('POST /collections/charge-off', () => {
    it('should process charge-off', async () => {
      mockCollectionsService.processChargeOff.mockResolvedValue(undefined);

      return request(app.getHttpServer())
        .post('/collections/charge-off')
        .send({
          loanId: 'loan-123',
        })
        .expect(200);
    });
  });
});

