import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanTransfer } from './entities/loan-transfer.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanTransferService } from './loan-transfer.service';
import { LoanTransferController } from './loan-transfer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanTransfer, Loan])],
  controllers: [LoanTransferController],
  providers: [LoanTransferService],
  exports: [LoanTransferService],
})
export class LoanTransferModule {}

