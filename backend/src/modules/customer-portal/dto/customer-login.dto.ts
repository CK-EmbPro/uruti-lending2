import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerLoginDto {
  @ApiProperty({ description: 'Customer email address', example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer password', example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Optional: Loan number for additional verification', required: false })
  @IsOptional()
  @IsString()
  loanNumber?: string;
}

