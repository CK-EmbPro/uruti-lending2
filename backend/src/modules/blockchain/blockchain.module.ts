import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './services/blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { BlockchainRecord } from './entities/blockchain-record.entity';
import { SmartContract } from './entities/smart-contract.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockchainRecord,
      SmartContract,
    ]),
      AuthModule,
],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}

