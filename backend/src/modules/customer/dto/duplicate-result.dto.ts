import { ApiProperty } from '@nestjs/swagger';

export class DuplicateResultDto {
  @ApiProperty({ description: 'Whether duplicates were found', example: true })
  hasDuplicates: boolean;

  @ApiProperty({ description: 'Number of potential duplicates found', example: 3 })
  duplicateCount: number;

  @ApiProperty({
    description: 'List of potential duplicate customer IDs',
    type: [String],
    example: ['customer-uuid-1', 'customer-uuid-2'],
  })
  duplicateIds: string[];

  @ApiProperty({
    description: 'Matching fields that identified duplicates',
    type: [String],
    example: ['email', 'phone'],
  })
  matchingFields: string[];
}

