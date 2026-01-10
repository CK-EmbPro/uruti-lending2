import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RequestLoanClosureDto {
  @ApiPropertyOptional({ description: 'Posting date for closure (ISO 8601)', example: '2024-12-01' })
  @IsDateString()
  @IsOptional()
  postingDate?: string;

  @ApiPropertyOptional({ description: 'Auto close if all amounts are paid', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  autoClose?: boolean;
}




















