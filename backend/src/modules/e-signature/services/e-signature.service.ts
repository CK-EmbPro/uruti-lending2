import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ESignatureRequest, SignatureStatus } from '../entities/e-signature-request.entity';
import {
  CreateSignatureRequestDto,
  SignatureRequestResult,
  SignatureStatusResult,
} from '../dto/e-signature.dto';

@Injectable()
export class ESignatureService {
  private readonly logger = new Logger(ESignatureService.name);
  private readonly provider: string;

  constructor(
    @InjectRepository(ESignatureRequest)
    private readonly signatureRepository: Repository<ESignatureRequest>,
    private readonly configService: ConfigService,
  ) {
    this.provider = this.configService.get<string>('E_SIGNATURE_PROVIDER', 'INTERNAL');
  }

  /**
   * Create signature request
   */
  async createSignatureRequest(
    dto: CreateSignatureRequestDto,
    companyId: string,
  ): Promise<SignatureRequestResult> {
    this.logger.log(`Creating signature request for document ${dto.documentId}`);

    // Create signature request
    const signatureRequest = this.signatureRepository.create({
      documentId: dto.documentId,
      documentName: dto.documentName,
      entityType: dto.entityType,
      entityId: dto.entityId,
      signers: dto.signers.map((signer, index) => ({
        ...signer,
        order: signer.order || index + 1,
        status: 'PENDING',
      })),
      status: SignatureStatus.PENDING,
      message: dto.message,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : this.getDefaultExpiryDate(),
      requireAllSigners: dto.requireAllSigners !== false,
      completionPercentage: 0,
    });

    const saved = await this.signatureRepository.save(signatureRequest);

    // Generate signature URL
    const signatureUrl = this.generateSignatureUrl(saved.id);

    // Update with signature URL
    saved.signatureUrl = signatureUrl;
    await this.signatureRepository.save(saved);

    // Send signature requests to signers
    await this.sendSignatureRequests(saved);

    return {
      id: saved.id,
      status: saved.status,
      signatureUrl,
      signers: saved.signers.map((s) => ({
        name: s.name,
        email: s.email,
        role: s.role,
        status: s.status,
        signedAt: s.signedAt,
      })),
    };
  }

  /**
   * Get signature request status
   */
  async getSignatureStatus(
    requestId: string,
    companyId: string,
  ): Promise<SignatureStatusResult> {
    const request = await this.signatureRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Signature request ${requestId} not found`);
    }

    // Check if expired
    if (request.expiryDate && new Date() > request.expiryDate && request.status === SignatureStatus.PENDING) {
      request.status = SignatureStatus.EXPIRED;
      await this.signatureRepository.save(request);
    }

    // Calculate completion percentage
    const completedSigners = request.signers.filter((s) => s.status === 'COMPLETED').length;
    const completionPercentage = request.signers.length > 0
      ? Math.round((completedSigners / request.signers.length) * 100)
      : 0;

    // Update status if all signers completed
    if (completionPercentage === 100 && request.status !== SignatureStatus.COMPLETED) {
      request.status = SignatureStatus.COMPLETED;
      request.completedAt = new Date();
      request.completionPercentage = 100;
      await this.signatureRepository.save(request);

      // Generate signed document
      await this.generateSignedDocument(request);
    } else {
      request.completionPercentage = completionPercentage;
      if (completionPercentage > 0 && request.status === SignatureStatus.PENDING) {
        request.status = SignatureStatus.IN_PROGRESS;
      }
      await this.signatureRepository.save(request);
    }

    return {
      id: request.id,
      status: request.status,
      completionPercentage: request.completionPercentage,
      signers: request.signers.map((s) => ({
        name: s.name,
        email: s.email,
        role: s.role,
        status: s.status,
        signedAt: s.signedAt,
        ipAddress: s.ipAddress,
      })),
      signedDocumentUrl: request.signedDocumentUrl,
      completedAt: request.completedAt?.toISOString(),
    };
  }

  /**
   * Sign document
   */
  async signDocument(
    requestId: string,
    signerEmail: string,
    signatureData: {
      signature?: string; // Base64 signature image
      initials?: string; // Base64 initials image
      ipAddress?: string;
      userAgent?: string;
    },
    companyId: string,
  ): Promise<SignatureStatusResult> {
    const request = await this.signatureRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Signature request ${requestId} not found`);
    }

    // Find signer
    const signer = request.signers.find((s) => s.email === signerEmail);
    if (!signer) {
      throw new Error(`Signer ${signerEmail} not found in this request`);
    }

    if (signer.status === 'COMPLETED') {
      throw new Error('Document already signed by this signer');
    }

    // Update signer status
    signer.status = 'COMPLETED';
    signer.signedAt = new Date().toISOString();
    signer.ipAddress = signatureData.ipAddress;

    // Update request
    const completedSigners = request.signers.filter((s) => s.status === 'COMPLETED').length;
    const completionPercentage = Math.round((completedSigners / request.signers.length) * 100);
    request.completionPercentage = completionPercentage;

    if (completionPercentage === 100) {
      request.status = SignatureStatus.COMPLETED;
      request.completedAt = new Date();
      await this.generateSignedDocument(request);
    } else if (completionPercentage > 0) {
      request.status = SignatureStatus.IN_PROGRESS;
    }

    await this.signatureRepository.save(request);

    return this.getSignatureStatus(requestId, companyId);
  }

  /**
   * Cancel signature request
   */
  async cancelSignatureRequest(
    requestId: string,
    companyId: string,
  ): Promise<void> {
    const request = await this.signatureRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Signature request ${requestId} not found`);
    }

    if (request.status === SignatureStatus.COMPLETED) {
      throw new Error('Cannot cancel completed signature request');
    }

    request.status = SignatureStatus.CANCELLED;
    await this.signatureRepository.save(request);
  }

  /**
   * Resend signature request
   */
  async resendSignatureRequest(
    requestId: string,
    signerEmail: string,
    companyId: string,
  ): Promise<void> {
    const request = await this.signatureRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Signature request ${requestId} not found`);
    }

    const signer = request.signers.find((s) => s.email === signerEmail);
    if (!signer) {
      throw new Error(`Signer ${signerEmail} not found`);
    }

    // Resend email to signer
    await this.sendSignatureRequestToSigner(request, signer);
  }

  // Private helper methods

  private getDefaultExpiryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date;
  }

  private generateSignatureUrl(requestId: string): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'https://app.example.com');
    return `${baseUrl}/sign/${requestId}`;
  }

  private async sendSignatureRequests(request: ESignatureRequest): Promise<void> {
    // Sort signers by order
    const sortedSigners = [...request.signers].sort((a, b) => a.order - b.order);

    // Send to first signer (or all if parallel signing)
    if (request.requireAllSigners) {
      // Sequential signing - send to first signer only
      await this.sendSignatureRequestToSigner(request, sortedSigners[0]);
    } else {
      // Parallel signing - send to all signers
      for (const signer of sortedSigners) {
        await this.sendSignatureRequestToSigner(request, signer);
      }
    }
  }

  private async sendSignatureRequestToSigner(
    request: ESignatureRequest,
    signer: any,
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Sending signature request to ${signer.email} for document ${request.documentName}`);

    // Example email content
    const emailContent = {
      to: signer.email,
      subject: `Please sign: ${request.documentName}`,
      body: `
        Hello ${signer.name},
        
        You have been requested to sign the document: ${request.documentName}
        
        ${request.message || 'Please review and sign the document.'}
        
        Click here to sign: ${request.signatureUrl}
        
        This request will expire on ${request.expiryDate?.toISOString().split('T')[0]}.
      `,
    };

    // TODO: Integrate with actual email service
    // await this.emailService.send(emailContent);
  }

  private async generateSignedDocument(request: ESignatureRequest): Promise<void> {
    // In production, integrate with document generation service
    // This would merge signatures into the original document
    this.logger.log(`Generating signed document for request ${request.id}`);

    // Generate signed document URL
    const signedDocumentUrl = `${this.configService.get<string>('DOCUMENT_STORAGE_URL', 'https://docs.example.com')}/signed/${request.id}.pdf`;
    request.signedDocumentUrl = signedDocumentUrl;
    await this.signatureRepository.save(request);
  }
}

