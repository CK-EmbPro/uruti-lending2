import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsObject, Min, Max } from 'class-validator';

export enum QRCodeErrorCorrectionLevel {
  L = 'L', // ~7% error correction
  M = 'M', // ~15% error correction
  Q = 'Q', // ~25% error correction
  H = 'H', // ~30% error correction
}

export enum QRCodeType {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  SVG = 'svg',
}

export class GenerateQRCodeDto {
  @ApiProperty({
    description: 'Data to encode in QR code',
    example: 'https://example.com',
  })
  @IsString()
  data: string;

  @ApiPropertyOptional({
    description: 'Error correction level',
    enum: QRCodeErrorCorrectionLevel,
    default: QRCodeErrorCorrectionLevel.M,
  })
  @IsOptional()
  @IsEnum(QRCodeErrorCorrectionLevel)
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;

  @ApiPropertyOptional({
    description: 'Output type',
    enum: QRCodeType,
    default: QRCodeType.PNG,
  })
  @IsOptional()
  @IsEnum(QRCodeType)
  type?: QRCodeType;

  @ApiPropertyOptional({
    description: 'Quality (0-1, for JPEG/WebP)',
    default: 0.92,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  quality?: number;

  @ApiPropertyOptional({
    description: 'Margin (modules)',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  margin?: number;

  @ApiPropertyOptional({
    description: 'QR code width (pixels)',
    default: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(2000)
  width?: number;

  @ApiPropertyOptional({
    description: 'Color options',
    example: { dark: '#000000', light: '#FFFFFF' },
  })
  @IsOptional()
  @IsObject()
  color?: {
    dark?: string;
    light?: string;
  };
}

export class GeneratePaymentQRCodeDto {
  @ApiProperty({ description: 'Payment amount', example: 1000.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment reference', example: 'PAY-12345' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({ description: 'Merchant name', example: 'Uruti Lending' })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiPropertyOptional({
    description: 'QR code options',
    type: GenerateQRCodeDto,
  })
  @IsOptional()
  @IsObject()
  options?: Omit<GenerateQRCodeDto, 'data'>;
}

export class GenerateLoanDocumentQRCodeDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-123' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Document ID', example: 'doc-456' })
  @IsString()
  documentId: string;

  @ApiPropertyOptional({ description: 'Base URL for document link' })
  @IsOptional()
  @IsString()
  baseUrl?: string;
}

export class QRCodeResponse {
  @ApiProperty({
    description: 'QR code as data URL (base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  dataUrl: string;

  @ApiProperty({
    description: 'QR code size in bytes',
    example: 1024,
  })
  size: number;
}

