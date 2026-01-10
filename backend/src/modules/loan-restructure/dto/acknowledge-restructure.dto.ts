import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { AcknowledgmentMethod } from '../entities/restructure-acknowledgment.entity';

export class AcknowledgeRestructureDto {
  @ApiProperty({
    description: 'Acknowledgment method',
    enum: AcknowledgmentMethod,
    example: AcknowledgmentMethod.ELECTRONIC_CONSENT,
  })
  @IsEnum(AcknowledgmentMethod)
  acknowledgmentMethod: AcknowledgmentMethod;

  @ApiProperty({
    description: 'Acknowledgment text that was shown to borrower',
    example: 'I acknowledge that the loan terms will change...',
  })
  @IsString()
  acknowledgmentText: string;

  @ApiPropertyOptional({
    description: 'IP address of borrower (for digital acknowledgment)',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User agent of borrower (for digital acknowledgment)',
    example: 'Mozilla/5.0...',
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Digital signature data or document path',
    example: 'data:image/png;base64,...',
  })
  @IsString()
  @IsOptional()
  signatureData?: string;

  @ApiPropertyOptional({
    description: 'Confirmation that terms were read',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  termsRead?: boolean;

  @ApiPropertyOptional({
    description: 'Confirmation that impact was understood',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  impactUnderstood?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Borrower confirmed understanding via phone call',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

