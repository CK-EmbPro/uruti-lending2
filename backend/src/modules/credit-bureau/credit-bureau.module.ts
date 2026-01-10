import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditBureauService } from './services/credit-bureau.service';
import { CreditBureauController } from './credit-bureau.controller';
import { CreditReport } from './entities/credit-report.entity';
import { CreditMonitoring } from './entities/credit-monitoring.entity';
import { CreditAlert } from './entities/credit-alert.entity';
// Customer entity doesn't exist - removed

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditReport,
      CreditMonitoring,
      CreditAlert,
      // Customer entity removed
    ]),
  ],
  controllers: [CreditBureauController],
  providers: [CreditBureauService],
  exports: [CreditBureauService],
})
export class CreditBureauModule {}

