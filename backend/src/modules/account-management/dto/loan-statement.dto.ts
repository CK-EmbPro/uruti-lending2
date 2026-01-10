import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatementType, DeliveryMethod } from '../entities/loan-statement.entity';

export class CreateStatementDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiPropertyOptional({ description: 'Statement type', enum: StatementType, default: StatementType.ON_DEMAND })
  @IsEnum(StatementType)
  @IsOptional()
  statementType?: StatementType;

  @ApiPropertyOptional({ description: 'Statement date', example: '2024-03-31' })
  @IsDateString()
  @IsOptional()
  statementDate?: string;

  @ApiPropertyOptional({ description: 'Delivery method', enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  @IsOptional()
  deliveryMethod?: DeliveryMethod;
}














