import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Company code', example: 'ACME' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Company email', example: 'contact@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Company address', example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Company phone', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}

