import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePledgeDto {
  @ApiProperty({ description: 'Loan Security ID', example: 'security-uuid' })
  @IsString()
  loanSecurityId: string;

  @ApiProperty({ description: 'Quantity pledged', example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  qty: number;

  @ApiPropertyOptional({ description: 'Loan Security Price at time of pledge', example: 1000 })
  @IsNumber()
  @Min(0)
  loanSecurityPrice?: number;

  @ApiPropertyOptional({ description: 'Haircut percentage', example: 20, default: 0 })
  @IsNumber()
  @Min(0)
  haircut?: number;
}

