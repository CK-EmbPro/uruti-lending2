import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenBankingService } from './services/open-banking.service';
import { OpenBankingController } from './open-banking.controller';
import { BankConnection } from './entities/bank-connection.entity';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransaction } from './entities/bank-transaction.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankConnection,
      BankAccount,
      BankTransaction,
    ]),
      AuthModule,
],
  controllers: [OpenBankingController],
  providers: [OpenBankingService],
  exports: [OpenBankingService],
})
export class OpenBankingModule {}
