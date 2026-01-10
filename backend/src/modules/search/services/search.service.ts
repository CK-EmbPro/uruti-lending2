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
import { SavedSearch } from '../entities/saved-search.entity';
import { SearchHistory } from '../entities/search-history.entity';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

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
    @InjectRepository(SavedSearch)
    private readonly savedSearchRepository: Repository<SavedSearch>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  /**
   * Perform global search across all entities
   */
  async search(dto: SearchDto, userId?: string): Promise<SearchResponseDto> {
    const {
      q = '',
      type = SearchEntityType.ALL,
      filters = {},
      sortBy = 'createdAt',
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
            SearchEntityType.CUSTOMER,
            SearchEntityType.LOAN_PRODUCT,
            SearchEntityType.LOAN_REPAYMENT,
            SearchEntityType.LOAN_DISBURSEMENT,
          ]
        : [type];

    // Search each entity type
    for (const entityType of entityTypes) {
      const entityResults = await this.searchEntityType(
        entityType,
        q,
        filters,
        sortBy,
        sortOrder,
      );
      results.push(...entityResults);
    }

    // Sort all results by relevance score
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    total = results.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Save to search history if requested
    if (saveToHistory && userId) {
      await this.saveSearchHistory(userId, type, q, filters, total);
    }

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
   * Search a specific entity type
   */
  private async searchEntityType(
    entityType: SearchEntityType,
    query: string,
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const results: SearchResultDto[] = [];
    const searchTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);

    switch (entityType) {
      case SearchEntityType.LOAN:
        results.push(...(await this.searchLoans(searchTerms, filters, sortBy, sortOrder)));
        break;
      case SearchEntityType.LOAN_APPLICATION:
        results.push(...(await this.searchLoanApplications(searchTerms, filters, sortBy, sortOrder)));
        break;
      case SearchEntityType.LOAN_PRODUCT:
        results.push(...(await this.searchLoanProducts(searchTerms, filters, sortBy, sortOrder)));
        break;
      case SearchEntityType.LOAN_REPAYMENT:
        results.push(...(await this.searchLoanRepayments(searchTerms, filters, sortBy, sortOrder)));
        break;
      case SearchEntityType.LOAN_DISBURSEMENT:
        results.push(...(await this.searchLoanDisbursements(searchTerms, filters, sortBy, sortOrder)));
        break;
      // Customer search would go here if Customer entity exists
    }

    return results;
  }

  /**
   * Search loans
   */
  private async searchLoans(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.loanRepository.createQueryBuilder('loan');

    // Apply text search
    if (searchTerms.length > 0) {
      const conditions = searchTerms.map((term) => {
        return `(
          LOWER(loan.loanNumber) LIKE LOWER(:term) OR
          LOWER(loan.applicantId) LIKE LOWER(:term) OR
          LOWER(CAST(loan.loanAmount AS TEXT)) LIKE LOWER(:term) OR
          LOWER(loan.status) LIKE LOWER(:term)
        )`;
      });

      queryBuilder.andWhere(`(${conditions.join(' AND ')})`, {
        term: `%${searchTerms[0]}%`,
      });
    }

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('loan.status = :status', { status: filters.status });
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('loan.loanAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      queryBuilder.andWhere('loan.loanAmount <= :maxAmount', { maxAmount: filters.maxAmount });
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

    if (filters.companyId) {
      queryBuilder.andWhere('loan.companyId = :companyId', { companyId: filters.companyId });
    }

    // Apply sorting
    if (sortBy && ['createdAt', 'loanAmount', 'postingDate', 'loanNumber'].includes(sortBy)) {
      queryBuilder.orderBy(`loan.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('loan.createdAt', 'DESC');
    }

    const loans = await queryBuilder.getMany();

    return loans.map((loan) => {
      const highlights: string[] = [];
      let score = 0.5; // Base score

      // Calculate relevance score
      searchTerms.forEach((term) => {
        if (loan.loanNumber?.toLowerCase().includes(term)) {
          score += 0.3;
          highlights.push(`Loan Number: ${loan.loanNumber}`);
        }
        if (loan.status?.toLowerCase().includes(term)) {
          score += 0.1;
        }
      });

      return {
        entityType: SearchEntityType.LOAN,
        id: loan.id,
        title: `Loan ${loan.loanNumber || loan.id}`,
        description: `Status: ${loan.status}, Amount: $${loan.loanAmount}, Posted: ${loan.postingDate}`,
        score: Math.min(1, score),
        data: {
          loanNumber: loan.loanNumber,
          status: loan.status,
          loanAmount: loan.loanAmount,
          applicantId: loan.applicantId,
          postingDate: loan.postingDate,
        },
        highlights,
      };
    });
  }

  /**
   * Search loan applications
   */
  private async searchLoanApplications(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.applicationRepository.createQueryBuilder('application');

    if (searchTerms.length > 0) {
      const conditions = searchTerms.map((term) => {
        return `(
          LOWER(application.applicationNumber) LIKE LOWER(:term) OR
          LOWER(application.applicantId) LIKE LOWER(:term) OR
          LOWER(CAST(application.requestedAmount AS TEXT)) LIKE LOWER(:term) OR
          LOWER(application.status) LIKE LOWER(:term)
        )`;
      });

      queryBuilder.andWhere(`(${conditions.join(' AND ')})`, {
        term: `%${searchTerms[0]}%`,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('application.status = :status', { status: filters.status });
    }

    if (sortBy && ['createdAt', 'requestedAmount', 'applicationDate'].includes(sortBy)) {
      queryBuilder.orderBy(`application.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('application.createdAt', 'DESC');
    }

    const applications = await queryBuilder.getMany();

    return applications.map((app) => {
      let score = 0.5;
      const highlights: string[] = [];

      searchTerms.forEach((term) => {
        if (app.applicationNumber?.toLowerCase().includes(term)) {
          score += 0.3;
          highlights.push(`Application Number: ${app.applicationNumber}`);
        }
        if (app.status?.toLowerCase().includes(term)) {
          score += 0.1;
        }
      });

      return {
        entityType: SearchEntityType.LOAN_APPLICATION,
        id: app.id,
        title: `Application ${app.applicationNumber || app.id}`,
        description: `Status: ${app.status}, Amount: $${app.requestedAmount}`,
        score: Math.min(1, score),
        data: {
          applicationNumber: app.applicationNumber,
          status: app.status,
          requestedAmount: app.requestedAmount,
          applicantId: app.applicantId,
        },
        highlights,
      };
    });
  }

  /**
   * Search loan products
   */
  private async searchLoanProducts(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (searchTerms.length > 0) {
      const conditions = searchTerms.map((term) => {
        return `(
          LOWER(product.productCode) LIKE LOWER(:term) OR
          LOWER(product.productName) LIKE LOWER(:term) OR
          LOWER(product.description) LIKE LOWER(:term) OR
          LOWER(product.loanCategory) LIKE LOWER(:term)
        )`;
      });

      queryBuilder.andWhere(`(${conditions.join(' AND ')})`, {
        term: `%${searchTerms[0]}%`,
      });
    }

    if (filters.loanCategory) {
      queryBuilder.andWhere('product.loanCategory = :loanCategory', {
        loanCategory: filters.loanCategory,
      });
    }

    const products = await queryBuilder.getMany();

    return products.map((product) => {
      let score = 0.5;
      const highlights: string[] = [];

      searchTerms.forEach((term) => {
        if (product.productName?.toLowerCase().includes(term)) {
          score += 0.4;
          highlights.push(`Product: ${product.productName}`);
        }
        if (product.productCode?.toLowerCase().includes(term)) {
          score += 0.2;
        }
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
        },
        highlights,
      };
    });
  }

  /**
   * Search loan repayments
   */
  private async searchLoanRepayments(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.repaymentRepository.createQueryBuilder('repayment');

    if (searchTerms.length > 0) {
      queryBuilder.andWhere(
        `LOWER(CAST(repayment.amountPaid AS TEXT)) LIKE LOWER(:term) OR
         LOWER(repayment.remarks) LIKE LOWER(:term)`,
        { term: `%${searchTerms[0]}%` },
      );
    }

    if (filters.loanId) {
      queryBuilder.andWhere('repayment.loanId = :loanId', { loanId: filters.loanId });
    }

    const repayments = await queryBuilder.getMany();

    return repayments.map((repayment) => {
      return {
        entityType: SearchEntityType.LOAN_REPAYMENT,
        id: repayment.id,
        title: `Repayment - $${repayment.amountPaid}`,
        description: `Posted: ${repayment.postingDate}`,
        score: 0.5,
        data: {
          amountPaid: repayment.amountPaid,
          postingDate: repayment.postingDate,
          loanId: repayment.loanId,
        },
        highlights: [],
      };
    });
  }

  /**
   * Search loan disbursements
   */
  private async searchLoanDisbursements(
    searchTerms: string[],
    filters: Record<string, any>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): Promise<SearchResultDto[]> {
    const queryBuilder = this.disbursementRepository.createQueryBuilder('disbursement');

    if (searchTerms.length > 0) {
      queryBuilder.andWhere(
        `LOWER(CAST(disbursement.disbursedAmount AS TEXT)) LIKE LOWER(:term) OR
         LOWER(disbursement.remarks) LIKE LOWER(:term)`,
        { term: `%${searchTerms[0]}%` },
      );
    }

    if (filters.loanId) {
      queryBuilder.andWhere('disbursement.loanId = :loanId', { loanId: filters.loanId });
    }

    const disbursements = await queryBuilder.getMany();

    return disbursements.map((disbursement) => {
      return {
        entityType: SearchEntityType.LOAN_DISBURSEMENT,
        id: disbursement.id,
        title: `Disbursement - $${disbursement.disbursedAmount}`,
        description: `Date: ${disbursement.disbursementDate}`,
        score: 0.5,
        data: {
          disbursedAmount: disbursement.disbursedAmount,
          disbursementDate: disbursement.disbursementDate,
          loanId: disbursement.loanId,
        },
        highlights: [],
      };
    });
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
    const history = this.searchHistoryRepository.create({
      userId,
      entityType,
      query,
      filters,
      resultCount,
    });

    await this.searchHistoryRepository.save(history);
  }

  /**
   * Get search suggestions (from history)
   */
  async getSearchSuggestions(userId: string, query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const history = await this.searchHistoryRepository.find({
      where: {
        userId,
        query: ILike(`%${query}%`),
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Extract unique queries
    const suggestions = new Set<string>();
    history.forEach((h) => {
      if (h.query) {
        suggestions.add(h.query);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get search history for user
   */
  async getSearchHistory(userId: string, limit: number = 20): Promise<SearchHistory[]> {
    return await this.searchHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

