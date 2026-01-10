import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThan, LessThan } from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { AdvancedSearchDto, SearchResult, SavedSearch, SearchEntityType } from '../dto/advanced-search.dto';

@Injectable()
export class AdvancedSearchService {
  private readonly logger = new Logger(AdvancedSearchService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Perform advanced search
   */
  async search(
    dto: AdvancedSearchDto,
    companyId: string,
  ): Promise<SearchResult> {
    this.logger.log(`Performing advanced search: ${dto.query}`);

    const entityTypes = dto.entityTypes || [SearchEntityType.ALL];
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const allResults: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      relevanceScore: number;
      metadata: Record<string, any>;
    }> = [];

    // Search loans
    if (entityTypes.includes(SearchEntityType.ALL) || entityTypes.includes(SearchEntityType.LOAN)) {
      const loans = await this.searchLoans(dto, companyId);
      allResults.push(...loans);
    }

    // Search applications
    if (entityTypes.includes(SearchEntityType.ALL) || entityTypes.includes(SearchEntityType.LOAN_APPLICATION)) {
      const applications = await this.searchApplications(dto, companyId);
      allResults.push(...applications);
    }

    // Sort by relevance
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply additional sorting if specified
    if (dto.sortBy) {
      allResults.sort((a, b) => {
        const aValue = a.metadata[dto.sortBy!];
        const bValue = b.metadata[dto.sortBy!];
        const order = dto.sortOrder === 'asc' ? 1 : -1;
        if (aValue < bValue) return -1 * order;
        if (aValue > bValue) return 1 * order;
        return 0;
      });
    }

    const total = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + limit);

    // Generate suggestions
    const suggestions = this.generateSuggestions(dto.query);

    return {
      results: paginatedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      suggestions,
    };
  }

  /**
   * Save search
   */
  async saveSearch(
    dto: AdvancedSearchDto,
    companyId: string,
    userId: string,
  ): Promise<SavedSearch> {
    if (!dto.searchName) {
      throw new Error('Search name is required to save search');
    }

    // In production, would save to database
    const searchId = `search-${Date.now()}`;
    const result = await this.search(dto, companyId);

    return {
      id: searchId,
      name: dto.searchName,
      query: dto.query,
      entityTypes: dto.entityTypes?.map((t) => t.toString()) || [],
      filters: dto.filters || {},
      resultCount: result.total,
      createdAt: new Date().toISOString(),
    };
  }

  // Private helper methods

  private async searchLoans(
    dto: AdvancedSearchDto,
    companyId: string,
  ): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    relevanceScore: number;
    metadata: Record<string, any>;
  }>> {
    const where: any = { companyId };
    const query = dto.query.toLowerCase();

    // Build search conditions
    if (query.includes('loan number') || query.match(/loan\s*#?\s*(\w+)/i)) {
      const match = query.match(/loan\s*#?\s*(\w+)/i);
      if (match) {
        where.loanNumber = Like(`%${match[1]}%`);
      }
    }

    if (query.match(/\d+/)) {
      const amount = parseInt(query.match(/\d+/)![0]);
      if (amount > 1000) {
        // Likely a loan amount
        where.loanAmount = Between(amount * 0.9, amount * 1.1);
      }
    }

    const loans = await this.loanRepository.find({
      where,
      take: 50,
    });

    return loans.map((loan) => {
      const relevanceScore = this.calculateRelevance(loan, dto.query);
      return {
        id: loan.id,
        type: 'Loan',
        title: `Loan ${loan.loanNumber}`,
        description: `Amount: ${loan.loanAmount}, Status: ${loan.status}, Customer: ${loan.applicantId}`,
        relevanceScore,
        metadata: {
          loanNumber: loan.loanNumber,
          loanAmount: loan.loanAmount,
          status: loan.status,
          applicantId: loan.applicantId,
          createdAt: loan.createdAt,
        },
      };
    });
  }

  private async searchApplications(
    dto: AdvancedSearchDto,
    companyId: string,
  ): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    relevanceScore: number;
    metadata: Record<string, any>;
  }>> {
    const where: any = { companyId };
    const query = dto.query.toLowerCase();

    if (query.includes('application') || query.match(/app\s*#?\s*(\w+)/i)) {
      const match = query.match(/app\s*#?\s*(\w+)/i);
      if (match) {
        where.applicationNumber = Like(`%${match[1]}%`);
      }
    }

    if (query.match(/\d+/)) {
      const amount = parseInt(query.match(/\d+/)![0]);
      if (amount > 1000) {
        where.requestedAmount = Between(amount * 0.9, amount * 1.1);
      }
    }

    const applications = await this.applicationRepository.find({
      where,
      take: 50,
    });

    return applications.map((app) => {
      const relevanceScore = this.calculateRelevance(app, dto.query);
      return {
        id: app.id,
        type: 'Loan Application',
        title: `Application ${app.applicationNumber}`,
        description: `Amount: ${app.requestedAmount}, Status: ${app.status}, Customer: ${app.applicantId}`,
        relevanceScore,
        metadata: {
          applicationNumber: app.applicationNumber,
          requestedAmount: app.requestedAmount,
          status: app.status,
          applicantId: app.applicantId,
          createdAt: app.createdAt,
        },
      };
    });
  }

  private calculateRelevance(entity: any, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();

    // Check if query matches key fields
    if (entity.loanNumber && entity.loanNumber.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }
    if (entity.applicationNumber && entity.applicationNumber.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }
    if (entity.applicantId && entity.applicantId.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }
    if (entity.status && entity.status.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    // Amount matching
    if (query.match(/\d+/)) {
      const queryAmount = parseInt(query.match(/\d+/)![0]);
      if (entity.loanAmount && Math.abs(entity.loanAmount - queryAmount) < queryAmount * 0.1) {
        score += 40;
      }
      if (entity.requestedAmount && Math.abs(entity.requestedAmount - queryAmount) < queryAmount * 0.1) {
        score += 40;
      }
    }

    return Math.min(100, score);
  }

  private generateSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('loan')) {
      suggestions.push('loan status', 'loan balance', 'loan number');
    }
    if (lowerQuery.includes('application')) {
      suggestions.push('application status', 'application number', 'pending applications');
    }
    if (lowerQuery.includes('payment')) {
      suggestions.push('payment due', 'payment history', 'make payment');
    }

    return suggestions.slice(0, 5);
  }
}

