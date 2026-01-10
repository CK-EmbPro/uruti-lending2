import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { AdvancedSearchService } from './services/advanced-search.service';
import { SavedSearchService } from './services/saved-search.service';
import { SavedSearch } from './entities/saved-search.entity';
import { SearchHistory } from './entities/search-history.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedSearch,
      SearchHistory,
      Loan,
      LoanApplication,
      LoanProduct,
      LoanRepayment,
      LoanDisbursement,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService, AdvancedSearchService, SavedSearchService],
  exports: [SearchService, AdvancedSearchService, SavedSearchService],
})
export class SearchModule {}

