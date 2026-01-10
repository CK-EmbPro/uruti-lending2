/**
 * Uruti Lending API Client Service
 * 
 * This is a reference implementation for external platforms (like urutiX) to integrate
 * with the Uruti Lending Platform. This service demonstrates how to:
 * - Create loan applications
 * - Query application/loan status
 * - Post repayments
 * - Verify webhook signatures
 * 
 * External platforms should copy this implementation and adapt it to their needs.
 */

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import * as crypto from 'crypto';

// Response Types
export interface LoanApplicationResponse {
  id: string;
  externalReferenceId: string;
  status: string;
  loanApplicationId: string;
  createdAt: string;
}

export interface ApplicationStatusResponse {
  id: string;
  externalReferenceId: string;
  status: string;
  loanApplicationId: string;
  loanApplication?: {
    id: string;
    status: string;
    requestedAmount: number;
    approvedAmount?: number;
    approvedDate?: string;
    rejectionReason?: string;
  };
  loanId?: string;
  loan?: {
    id: string;
    loanNumber: string;
    status: string;
    loanAmount: number;
    disbursedAmount?: number;
    disbursedDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoanStatusResponse {
  loanId: string;
  loanNumber: string;
  status: string;
  loanAmount: number;
  currentBalance: number;
  disbursedAmount: number;
  disbursedDate: string;
  externalReferenceId: string;
}

export interface RepaymentResponse {
  id: string;
  externalReferenceId: string;
  status: string;
  amount: number;
  repaymentId?: string;
  createdAt: string;
}

// Request Types
export interface CreateLoanApplicationRequest {
  externalReferenceId: string;
  loanProductCode: string;
  companyId: string;
  requestedAmount: number;
  applicationType: 'Trip Financing' | 'Invoice Financing' | 'Order Financing' | 'Other';
  customer: {
    externalCustomerId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    kycStatus?: string;
    creditScore?: number;
    metadata?: Record<string, any>;
  };
  tripId?: string;
  cargoOwnerId?: string;
  transporterId?: string;
  tripRevenue?: number;
  advanceAmount?: number;
  tripStartDate?: string;
  tripEndDate?: string;
  expectedRevenueDate?: string;
  repaymentPeriods?: number;
  repaymentStartDate?: string;
  externalData?: Record<string, any>;
}

export interface PostRepaymentRequest {
  externalReferenceId: string;
  loanReference: string; // Can be loanNumber or externalReferenceId
  amount: number;
  paymentDate: string; // ISO date format: YYYY-MM-DD
  tripId?: string;
  revenueTransactionId?: string;
  totalTripRevenue?: number;
  repaymentPercentage?: number;
  processingNotes?: string;
  externalData?: Record<string, any>;
}

export interface UrutiLendingClientConfig {
  apiUrl: string;
  apiKey: string;
  webhookSecret: string;
  timeout?: number;
}

@Injectable()
export class UrutiLendingClientService {
  private readonly logger = new Logger(UrutiLendingClientService.name);
  private readonly client: AxiosInstance;
  private readonly webhookSecret: string;

  constructor(config: UrutiLendingClientConfig) {
    // Validate configuration
    if (!config.apiUrl) {
      throw new Error('API URL is required');
    }
    if (!config.apiKey) {
      throw new Error('API Key is required');
    }
    if (!config.webhookSecret) {
      throw new Error('Webhook Secret is required');
    }

    this.webhookSecret = config.webhookSecret;

    // Create axios client
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.timeout || 30000, // Default 30 seconds
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Sending request to ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Received response from ${response.config.url} - Status: ${response.status}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('Response error', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      },
    );
  }

  /**
   * Create a loan application
   */
  async createApplication(
    request: CreateLoanApplicationRequest,
  ): Promise<LoanApplicationResponse> {
    try {
      const response = await this.client.post<LoanApplicationResponse>(
        '/integration/applications',
        request,
      );

      this.logger.log(
        `Loan application created: ${response.data.externalReferenceId} -> ${response.data.loanApplicationId}`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          error.message;
        throw new Error(`Failed to create loan application: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get application status by external reference ID
   */
  async getApplicationStatus(
    externalReferenceId: string,
  ): Promise<ApplicationStatusResponse> {
    try {
      const response = await this.client.get<ApplicationStatusResponse>(
        `/integration/applications/${externalReferenceId}`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          error.message;
        throw new Error(`Failed to get application status: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get loan status by loan reference (loan number or external reference ID)
   */
  async getLoanStatus(loanReference: string): Promise<LoanStatusResponse> {
    try {
      const response = await this.client.get<LoanStatusResponse>(
        `/integration/loans/${loanReference}/status`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          error.message;
        throw new Error(`Failed to get loan status: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Post a repayment
   */
  async postRepayment(request: PostRepaymentRequest): Promise<RepaymentResponse> {
    try {
      const response = await this.client.post<RepaymentResponse>(
        '/integration/repayments',
        request,
      );

      this.logger.log(
        `Repayment posted: ${request.externalReferenceId} - Amount: ${request.amount}`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(', ') ||
          error.message;
        throw new Error(`Failed to post repayment: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Verify webhook signature
   * 
   * @param payload - The raw webhook payload (string)
   * @param signature - The signature from X-Webhook-Signature header
   * @returns true if signature is valid, false otherwise
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      const calculatedSignature = hmac.update(payload).digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature),
      );
    } catch (error) {
      this.logger.error('Webhook signature verification error', error);
      return false;
    }
  }

  /**
   * Create a factory function for easy instantiation
   * This is useful for external platforms to create the client
   */
  static create(config: UrutiLendingClientConfig): UrutiLendingClientService {
    return new UrutiLendingClientService(config);
  }
}

