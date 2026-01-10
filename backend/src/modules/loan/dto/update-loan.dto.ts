import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLoanDto } from './create-loan.dto';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @ApiPropertyOptional({ description: 'Loan status', enum: LoanStatus, example: LoanStatus.SANCTIONED })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;
}

