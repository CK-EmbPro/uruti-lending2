/**
 * Advanced Search Service
 * Enhanced search with PostgreSQL full-text search, better relevance scoring,
 * and advanced filtering capabilities
 */

import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { SearchDto, SearchResultDto, SearchResponseDto } from '../dto/search.dto';
import { SearchEntityType } from '../../../common/enums/search-entity-type.enum';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../../loan-product/entities/loan-product.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../../loan-disbursement/entities/loan-disbursement.entity';
import { SearchHistory } from '../entities/search-history.entity';

@Injectable()
export class AdvancedSearchService {
  private readonly logger = new Logger(AdvancedSearchService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanProduct)
    private readonly productRepository: Repository<LoanProduct>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanDisbursement)
    private readonly disbursementRepository: Repository<LoanDisbursement>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  /**
   * Perform advanced global search with full-text search capabilities
   */
  async advancedSearch(dto: SearchDto, userId?: string): Promise<SearchResponseDto> {
    const {
      q = '',
      type = SearchEntityType.ALL,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
      saveToHistory = true,
    } = dto;

    const results: SearchResultDto[] = [];
    let total = 0;

    // Determine which entities to search
    const entityTypes: SearchEntityType[] =
      type === SearchEntityType.ALL
        ? [
            SearchEntityType.LOAN,
            SearchEntityType.LOAN_APPLICATION,
            SearchEntityType.LOAN_PRODUCT,
            SearchEntityType.LOAN_REPAYMENT,
            SearchEntityType.LOAN_DISBURSEMENT,
          ]
        : [type];

    // Search each entity type in parallel for better performance
    const searchPromises = entityTypes.map((entityType) =>
      this.searchEntityTypeAdvanced(
        entityType,
        q,
        filters,
        sortBy,
        sortOrder,
      ),
    );

    const allResults = await Promise.all(searchPromises);
    results.push(...allResults.flat());

    // Sort all results by relevance score (if sortBy is relevance)
    if (sortBy === 'relevance') {
      results.sort((a, b) => b.score - a.score);
    } else {
      // Sort by specified field
      this.sortResults(results, sortBy, sortOrder);
    }

    // Apply pagination
    total = results.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Save to search history if requested
    if (saveToHistory && userId && q.trim().length > 0) {
      await this.saveSearchHistory(userId, type, q, filters, total);
    }

    this.logger.debug(`Advanced search completed: ${total} results for query "${q}"`);

    return {
      results: paginatedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query: q,
      entityType: type,
    };
  }

  /**
   * Advanced search for a specific entity type with full-text search
   */
  private async searchEntityTypeAdvanced(
    entityType: SearchEntityType,
    query: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const searchTerms = this.parseSearchQuery(query);
    const hasTextSearch = searchTerms.length > 0;

    switch (entityType) {
      case SearchEntityType.LOAN:
        return this.searchLoansAdvanced(searchTerms, filters, sortBy, sortOrder, hasTextSearch);
      case SearchEntityType.LOAN_APPLICATION:
        return this.searchLoanApplicationsAdvanced(searchTerms, filters, sortBy, sortOrder, hasTextSearch);
      case SearchEntityType.LOAN_PRODUCT:
        return this.searchLoanProductsAdvanced(searchTerms, filters, sortBy, sortOrder, hasTextSearch);
      case SearchEntityType.LOAN_REPAYMENT:
        return this.searchLoanRepaymentsAdvanced(searchTerms, filters, sortBy, sortOrder, hasTextSearch);
      case SearchEntityType.LOAN_DISBURSEMENT:
        return this.searchLoanDisbursementsAdvanced(searchTerms, filters, sortBy, sortOrder, hasTextSearch);
      default:
        return [];
    }
  }

  /**
   * Parse search query into terms and handle special operators
   */
  private parseSearchQuery(query: string): string[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Remove special characters but keep spaces
    const cleaned = query.trim().toLowerCase();
    
    // Split by spaces and filter empty strings
    const terms = cleaned.split(/\s+/).filter((t) => t.length > 0);
    
    return terms;
  }

  /**
   * Advanced loan search with full-text search
   */
  private async searchLoansAdvanced(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    hasTextSearch: boolean,
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.loanRepository.createQueryBuilder('loan');

    // Apply full-text search using PostgreSQL tsvector (if available) or LIKE
    if (hasTextSearch && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        return `(
          LOWER(loan.loanNumber) LIKE LOWER(:term${index}) OR
          LOWER(loan.applicantId) LIKE LOWER(:term${index}) OR
          LOWER(CAST(loan.loanAmount AS TEXT)) LIKE LOWER(:term${index}) OR
          LOWER(loan.status::TEXT) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(loan.remarks, '')) LIKE LOWER(:term${index})
        )`;
      });

      const params: Record<string, string> = {};
      searchTerms.forEach((term, index) => {
        params[`term${index}`] = `%${term}%`;
      });

      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, params);
    }

    // Apply advanced filters
    this.applyLoanFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, 'loan', sortBy, sortOrder, [
      'createdAt',
      'loanAmount',
      'postingDate',
      'loanNumber',
      'status',
    ]);

    const loans = await queryBuilder.getMany();

    // Calculate relevance scores and create results
    return loans.map((loan) => {
      const { score, highlights } = this.calculateRelevanceScore(loan, searchTerms, {
        loanNumber: loan.loanNumber,
        applicantId: loan.applicantId,
        status: loan.status,
        loanAmount: loan.loanAmount,
        // remarks field not available in Loan entity
      });

      return {
        entityType: SearchEntityType.LOAN,
        id: loan.id,
        title: `Loan ${loan.loanNumber || loan.id}`,
        description: this.buildLoanDescription(loan),
        score: Math.min(1, score),
        data: {
          loanNumber: loan.loanNumber,
          status: loan.status,
          loanAmount: loan.loanAmount,
          applicantId: loan.applicantId,
          postingDate: loan.postingDate,
          // currentBalance calculated as loanAmount - totalAmountPaid
          outstandingBalance: Number(loan.loanAmount) - Number(loan.totalAmountPaid || 0),
          companyId: loan.companyId,
        },
        highlights,
      };
    });
  }

  /**
   * Advanced loan application search
   */
  private async searchLoanApplicationsAdvanced(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    hasTextSearch: boolean,
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.applicationRepository.createQueryBuilder('application');

    if (hasTextSearch && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        return `(
          LOWER(application.applicationNumber) LIKE LOWER(:term${index}) OR
          LOWER(application.applicantId) LIKE LOWER(:term${index}) OR
          LOWER(CAST(application.requestedAmount AS TEXT)) LIKE LOWER(:term${index}) OR
          LOWER(application.status::TEXT) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(application.remarks, '')) LIKE LOWER(:term${index})
        )`;
      });

      const params: Record<string, string> = {};
      searchTerms.forEach((term, index) => {
        params[`term${index}`] = `%${term}%`;
      });

      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, params);
    }

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('application.status = :status', { status: filters.status });
    }
    if (filters.minAmount) {
      queryBuilder.andWhere('application.requestedAmount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }
    if (filters.maxAmount) {
      queryBuilder.andWhere('application.requestedAmount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('application.applicationDate >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('application.applicationDate <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }
    if (filters.companyId) {
      queryBuilder.andWhere('application.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }

    this.applySorting(queryBuilder, 'application', sortBy, sortOrder, [
      'createdAt',
      'requestedAmount',
      'applicationDate',
      'applicationNumber',
    ]);

    const applications = await queryBuilder.getMany();

    return applications.map((app) => {
      const { score, highlights } = this.calculateRelevanceScore(app, searchTerms, {
        applicationNumber: app.applicationNumber,
        applicantId: app.applicantId,
        status: app.status,
        requestedAmount: app.requestedAmount,
        remarks: app.remarks,
      });

      return {
        entityType: SearchEntityType.LOAN_APPLICATION,
        id: app.id,
        title: `Application ${app.applicationNumber || app.id}`,
        description: `Status: ${app.status}, Amount: $${app.requestedAmount}, Date: ${app.applicationDate}`,
        score: Math.min(1, score),
        data: {
          applicationNumber: app.applicationNumber,
          status: app.status,
          requestedAmount: app.requestedAmount,
          applicantId: app.applicantId,
          applicationDate: app.applicationDate,
          companyId: app.companyId,
        },
        highlights,
      };
    });
  }

  /**
   * Advanced loan product search
   */
  private async searchLoanProductsAdvanced(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    hasTextSearch: boolean,
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (hasTextSearch && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        return `(
          LOWER(product.productCode) LIKE LOWER(:term${index}) OR
          LOWER(product.productName) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(product.description, '')) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(product.loanCategory, '')) LIKE LOWER(:term${index})
        )`;
      });

      const params: Record<string, string> = {};
      searchTerms.forEach((term, index) => {
        params[`term${index}`] = `%${term}%`;
      });

      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, params);
    }

    if (filters.loanCategory) {
      queryBuilder.andWhere('product.loanCategory = :loanCategory', {
        loanCategory: filters.loanCategory,
      });
    }

    const products = await queryBuilder.getMany();

    return products.map((product) => {
      const { score, highlights } = this.calculateRelevanceScore(product, searchTerms, {
        productCode: product.productCode,
        productName: product.productName,
        description: product.productDescription || product.shortDescription || '',
        loanCategory: product.loanCategory,
      });

      return {
        entityType: SearchEntityType.LOAN_PRODUCT,
        id: product.id,
        title: product.productName,
        description: `${product.productCode} - ${product.loanCategory || 'N/A'}`,
        score: Math.min(1, score),
        data: {
          productCode: product.productCode,
          productName: product.productName,
          loanCategory: product.loanCategory,
          rateOfInterest: product.rateOfInterest,
        },
        highlights,
      };
    });
  }

  /**
   * Advanced repayment search
   */
  private async searchLoanRepaymentsAdvanced(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    hasTextSearch: boolean,
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.repaymentRepository.createQueryBuilder('repayment');

    if (hasTextSearch && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        return `(
          LOWER(CAST(repayment.amountPaid AS TEXT)) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(repayment.remarks, '')) LIKE LOWER(:term${index}) OR
          LOWER(repayment.repaymentNumber) LIKE LOWER(:term${index})
        )`;
      });

      const params: Record<string, string> = {};
      searchTerms.forEach((term, index) => {
        params[`term${index}`] = `%${term}%`;
      });

      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, params);
    }

    if (filters.loanId) {
      queryBuilder.andWhere('repayment.loanId = :loanId', { loanId: filters.loanId });
    }
    if (filters.minAmount) {
      queryBuilder.andWhere('repayment.amountPaid >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }
    if (filters.maxAmount) {
      queryBuilder.andWhere('repayment.amountPaid <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('repayment.postingDate >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('repayment.postingDate <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const repayments = await queryBuilder.getMany();

    return repayments.map((repayment) => {
      const { score, highlights } = this.calculateRelevanceScore(repayment, searchTerms, {
        amountPaid: repayment.amountPaid,
        postingDate: repayment.postingDate,
      });

      return {
        entityType: SearchEntityType.LOAN_REPAYMENT,
        id: repayment.id,
        title: `Repayment - $${repayment.amountPaid}`,
        description: `Posted: ${repayment.postingDate}, Loan: ${repayment.loanId}`,
        score: Math.min(1, score),
        data: {
          amountPaid: repayment.amountPaid,
          postingDate: repayment.postingDate,
          loanId: repayment.loanId,
          // repaymentNumber not available in LoanRepayment entity
        },
        highlights,
      };
    });
  }

  /**
   * Advanced disbursement search
   */
  private async searchLoanDisbursementsAdvanced(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    hasTextSearch: boolean,
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.disbursementRepository.createQueryBuilder('disbursement');

    if (hasTextSearch && searchTerms.length > 0) {
      const searchConditions = searchTerms.map((term, index) => {
        return `(
          LOWER(CAST(disbursement.disbursedAmount AS TEXT)) LIKE LOWER(:term${index}) OR
          LOWER(COALESCE(disbursement.remarks, '')) LIKE LOWER(:term${index}) OR
          LOWER(disbursement.disbursementNumber) LIKE LOWER(:term${index})
        )`;
      });

      const params: Record<string, string> = {};
      searchTerms.forEach((term, index) => {
        params[`term${index}`] = `%${term}%`;
      });

      queryBuilder.andWhere(`(${searchConditions.join(' AND ')})`, params);
    }

    if (filters.loanId) {
      queryBuilder.andWhere('disbursement.loanId = :loanId', { loanId: filters.loanId });
    }

    const disbursements = await queryBuilder.getMany();

    return disbursements.map((disbursement) => {
      const { score, highlights } = this.calculateRelevanceScore(disbursement, searchTerms, {
        disbursedAmount: disbursement.disbursedAmount,
        disbursementDate: disbursement.disbursementDate,
      });

      return {
        entityType: SearchEntityType.LOAN_DISBURSEMENT,
        id: disbursement.id,
        title: `Disbursement - $${disbursement.disbursedAmount}`,
        description: `Date: ${disbursement.disbursementDate}, Loan: ${disbursement.loanId}`,
        score: Math.min(1, score),
        data: {
          disbursedAmount: disbursement.disbursedAmount,
          disbursementDate: disbursement.disbursementDate,
          loanId: disbursement.loanId,
          // disbursementNumber not available in LoanDisbursement entity
        },
        highlights,
      };
    });
  }

  /**
   * Apply advanced filters to loan query builder
   */
  private applyLoanFilters(queryBuilder: any, filters: Record<string, any>): void {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.andWhere('loan.status IN (:...statuses)', { statuses: filters.status });
      } else {
        queryBuilder.andWhere('loan.status = :status', { status: filters.status });
      }
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('loan.loanAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      queryBuilder.andWhere('loan.loanAmount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.amountRange) {
      const [min, max] = filters.amountRange;
      queryBuilder.andWhere('loan.loanAmount BETWEEN :minAmount AND :maxAmount', {
        minAmount: min,
        maxAmount: max,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('loan.postingDate >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('loan.postingDate <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      queryBuilder.andWhere('loan.postingDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(start),
        endDate: new Date(end),
      });
    }

    if (filters.companyId) {
      queryBuilder.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    if (filters.applicantId) {
      queryBuilder.andWhere('loan.applicantId = :applicantId', { applicantId: filters.applicantId });
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: any,
    alias: string,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    allowedFields: string[],
  ): void {
    if (sortBy === 'relevance') {
      // Relevance sorting is done after fetching results
      queryBuilder.orderBy(`${alias}.createdAt`, 'DESC');
    } else if (sortBy && allowedFields.includes(sortBy)) {
      queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy(`${alias}.createdAt`, 'DESC');
    }
  }

  /**
   * Sort results array by specified field
   */
  private sortResults(
    results: SearchResultDto[],
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    if (sortBy === 'relevance') {
      return; // Already sorted by relevance
    }

    results.sort((a, b) => {
      let aValue: any = a.data[sortBy];
      let bValue: any = b.data[sortBy];

      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }

  /**
   * Calculate relevance score based on search terms
   */
  private calculateRelevanceScore(
    entity: any,
    searchTerms: string[],
    searchableFields: Record<string, any>,
  ): { score: number; highlights: string[] } {
    let score = 0.1; // Base score
    const highlights: string[] = [];

    if (searchTerms.length === 0) {
      return { score, highlights };
    }

    searchTerms.forEach((term) => {
      // Exact match gets highest score
      Object.entries(searchableFields).forEach(([field, value]) => {
        if (!value) return;

        const fieldValue = String(value).toLowerCase();
        const termLower = term.toLowerCase();

        if (fieldValue === termLower) {
          // Exact match
          score += 0.5;
          highlights.push(`${field}: ${value}`);
        } else if (fieldValue.startsWith(termLower)) {
          // Starts with
          score += 0.3;
          if (!highlights.some((h) => h.includes(field))) {
            highlights.push(`${field}: ${value}`);
          }
        } else if (fieldValue.includes(termLower)) {
          // Contains
          score += 0.2;
          if (!highlights.some((h) => h.includes(field))) {
            highlights.push(`${field}: ${value}`);
          }
        }
      });
    });

    return { score: Math.min(1, score), highlights };
  }

  /**
   * Build loan description for search results
   */
  private buildLoanDescription(loan: Loan): string {
    const parts: string[] = [];
    if (loan.status) parts.push(`Status: ${loan.status}`);
    if (loan.loanAmount) parts.push(`Amount: $${loan.loanAmount}`);
    if (loan.postingDate) parts.push(`Posted: ${new Date(loan.postingDate).toLocaleDateString()}`);
    const outstandingBalance = Number(loan.loanAmount) - Number(loan.totalAmountPaid || 0);
    if (outstandingBalance > 0) parts.push(`Balance: $${outstandingBalance}`);
    return parts.join(', ');
  }

  /**
   * Save search to history
   */
  private async saveSearchHistory(
    userId: string,
    entityType: SearchEntityType,
    query: string,
    filters: Record<string, any>,
    resultCount: number,
  ): Promise<void> {
    try {
      const history = this.searchHistoryRepository.create({
        userId,
        entityType,
        query,
        filters,
        resultCount,
      });

      await this.searchHistoryRepository.save(history);
    } catch (error) {
      this.logger.warn(`Failed to save search history: ${error.message}`);
    }
  }

  /**
   * Export search results to CSV format
   */
  async exportSearchResults(dto: SearchDto, userId?: string): Promise<string> {
    const searchResponse = await this.advancedSearch({ ...dto, limit: 10000 }, userId);

    // Convert results to CSV
    const headers = ['Entity Type', 'ID', 'Title', 'Description', 'Score'];
    const rows = searchResponse.results.map((result) => [
      result.entityType,
      result.id,
      result.title,
      result.description,
      result.score.toString(),
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];

    return csvLines.join('\n');
  }
}

