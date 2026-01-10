import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformWorkflowActionDto {
  @ApiProperty({ description: 'Action to perform', example: 'Initiate' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Comments', example: 'Application looks good' })
  @IsString()
  @IsOptional()
  comments?: string;
}

