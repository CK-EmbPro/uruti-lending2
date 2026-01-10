import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({ description: 'Customer email address', example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer password', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Optional: Phone number', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Optional: Loan number to link account', required: false })
  @IsOptional()
  @IsString()
  loanNumber?: string;
}

