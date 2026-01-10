/**
 * Frontend Integration Tests for All 4 Features
 * 
 * Run with: npm test -- test-all-features.test.tsx
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentVerification } from '@/components/features/DocumentVerification';
import { InstantKYCAML } from '@/components/features/InstantKYCAML';
import { ZeroBranchOnboarding } from '@/components/features/ZeroBranchOnboarding';
import { FastDecisionProgress } from '@/components/features/FastDecisionProgress';

// Mock API calls
jest.mock('@/lib/api/ai', () => ({
  aiApi: {
    processDocument: jest.fn(),
  },
}));

jest.mock('@/lib/api/instant-kyc-aml', () => ({
  instantKYCAMLApi: {
    performInstantChecks: jest.fn(),
  },
}));

jest.mock('@/lib/api/onboarding', () => ({
  onboardingApi: {
    saveProgress: jest.fn(),
    resumeProgress: jest.fn(),
    getProgress: jest.fn(),
    performBiometricMatch: jest.fn(),
    captureSignature: jest.fn(),
  },
}));

jest.mock('@/lib/api/fast-decision', () => ({
  fastDecisionApi: {
    initiateFastDecision: jest.fn(),
    getProgress: jest.fn(),
    getResult: jest.fn(),
  },
}));

describe('All Features Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('AI Document Verification', () => {
    it('should render document verification component', () => {
      renderWithProviders(<DocumentVerification />);
      expect(screen.getByText(/AI Document Verification/i)).toBeInTheDocument();
    });

    it('should display document type selector', () => {
      renderWithProviders(<DocumentVerification />);
      expect(screen.getByLabelText(/Document Type/i)).toBeInTheDocument();
    });

    it('should display file upload area', () => {
      renderWithProviders(<DocumentVerification />);
      expect(screen.getByText(/Upload a file/i)).toBeInTheDocument();
    });
  });

  describe('Instant KYC/AML', () => {
    it('should render KYC/AML component', () => {
      renderWithProviders(<InstantKYCAML applicationId="test-app-001" />);
      expect(screen.getByText(/Instant KYC\/AML Checks/i)).toBeInTheDocument();
    });

    it('should display application ID', () => {
      renderWithProviders(<InstantKYCAML applicationId="test-app-001" />);
      expect(screen.getByText(/test-app-001/i)).toBeInTheDocument();
    });

    it('should display perform checks button', () => {
      renderWithProviders(<InstantKYCAML applicationId="test-app-001" />);
      expect(screen.getByText(/Perform Instant KYC\/AML Checks/i)).toBeInTheDocument();
    });
  });

  describe('Zero-Branch Onboarding', () => {
    it('should render onboarding component', () => {
      renderWithProviders(<ZeroBranchOnboarding applicationId="test-app-001" />);
      expect(screen.getByText(/Zero-Branch Onboarding/i)).toBeInTheDocument();
    });

    it('should display progress bar', () => {
      renderWithProviders(<ZeroBranchOnboarding applicationId="test-app-001" />);
      // Progress component should be rendered
      expect(screen.getByText(/Step/i)).toBeInTheDocument();
    });

    it('should display step indicators', () => {
      renderWithProviders(<ZeroBranchOnboarding applicationId="test-app-001" />);
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/ID Verification/i)).toBeInTheDocument();
    });
  });

  describe('Under 10 Minutes Decision', () => {
    it('should render fast decision progress component', () => {
      renderWithProviders(<FastDecisionProgress applicationId="test-app-001" />);
      expect(screen.getByText(/Fast Decision Progress/i)).toBeInTheDocument();
    });

    it('should display progress percentage', async () => {
      const mockProgress = {
        id: 'progress-1',
        applicationId: 'test-app-001',
        currentStep: 'KYC_AML',
        status: 'IN_PROGRESS',
        progressPercentage: 50,
        elapsedTime: 300000,
        estimatedTimeRemaining: 300000,
        steps: {},
        slaCompliant: true,
        slaViolations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { fastDecisionApi } = require('@/lib/api/fast-decision');
      fastDecisionApi.getProgress.mockResolvedValue(mockProgress);

      renderWithProviders(<FastDecisionProgress applicationId="test-app-001" />);

      await waitFor(() => {
        expect(screen.getByText(/50%/i)).toBeInTheDocument();
      });
    });

    it('should display SLA compliance status', async () => {
      const mockProgress = {
        id: 'progress-1',
        applicationId: 'test-app-001',
        currentStep: 'COMPLETED',
        status: 'COMPLETED',
        progressPercentage: 100,
        elapsedTime: 450000,
        estimatedTimeRemaining: 0,
        steps: {},
        slaCompliant: true,
        slaViolations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { fastDecisionApi } = require('@/lib/api/fast-decision');
      fastDecisionApi.getProgress.mockResolvedValue(mockProgress);

      renderWithProviders(<FastDecisionProgress applicationId="test-app-001" />);

      await waitFor(() => {
        expect(screen.getByText(/SLA Compliant/i)).toBeInTheDocument();
      });
    });
  });
});

