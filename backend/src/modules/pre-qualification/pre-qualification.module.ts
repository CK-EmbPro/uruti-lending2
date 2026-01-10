import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreQualificationService } from './pre-qualification.service';
import { PreQualificationController } from './pre-qualification.controller';
import { PreQualification } from './entities/pre-qualification.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PreQualification, LoanProduct]),
  ],
  controllers: [PreQualificationController],
  providers: [PreQualificationService],
  exports: [PreQualificationService],
})
export class PreQualificationModule {}

