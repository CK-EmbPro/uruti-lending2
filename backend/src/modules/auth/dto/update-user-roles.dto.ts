import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'User roles',
    type: [String],
    example: ['Loan Officer', 'Loan Processor'],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

