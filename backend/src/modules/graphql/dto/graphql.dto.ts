import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class GraphQLQueryDto {
  @ApiProperty({ description: 'GraphQL query', example: '{ loans { id amount status } }' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Operation name', example: 'GetLoans' })
  @IsOptional()
  @IsString()
  operationName?: string;

  @ApiPropertyOptional({ description: 'Variables', type: Object })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class GraphQLSubscriptionDto {
  @ApiProperty({ description: 'Subscription query', example: 'subscription { loanUpdated { id status } }' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Variables', type: Object })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

