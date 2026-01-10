import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './services/administration.service';
import { PermissionSeedService } from './services/permission-seed.service';
import { UserAccount } from './entities/user-account.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { ProductConfiguration } from './entities/product-configuration.entity';
import { BusinessRule } from './entities/business-rule.entity';
import { FeeSchedule } from './entities/fee-schedule.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserAccount,
      Role,
      Permission,
      UserActivityLog,
      ProductConfiguration,
      BusinessRule,
      FeeSchedule,
      Loan,
      LoanProduct,
    ]),
  ],
  controllers: [AdministrationController],
  providers: [AdministrationService, PermissionSeedService],
  exports: [AdministrationService, PermissionSeedService],
})
export class AdministrationModule {}

