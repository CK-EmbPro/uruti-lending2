import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsObject, IsArray } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es)',
    example: 'customer@example.com',
  })
  @IsEmail({}, { each: true })
  to: string | string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Payment Reminder',
  })
  @IsString()
  subject: string;

  @ApiPropertyOptional({
    description: 'Plain text content',
    example: 'This is a payment reminder.',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'HTML content',
    example: '<h1>Payment Reminder</h1><p>Your payment is due.</p>',
  })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    description: 'Template name (without .hbs extension)',
    example: 'payment-reminder',
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'Template context/variables',
    example: { customerName: 'John Doe', amount: 1000 },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'CC recipients',
    example: ['manager@example.com'],
  })
  @IsOptional()
  @IsArray()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'BCC recipients',
    example: ['archive@example.com'],
  })
  @IsOptional()
  @IsArray()
  bcc?: string[];
}
