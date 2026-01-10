import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class ExportToExcelDto {
  @ApiProperty({
    description: 'Data to export',
    example: [{ id: '1', name: 'Loan 1', amount: 1000 }],
  })
  @IsArray()
  data: any[];

  @ApiPropertyOptional({
    description: 'Filename',
    example: 'loans-export.xlsx',
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({
    description: 'Sheet name',
    example: 'Loans',
  })
  @IsOptional()
  @IsString()
  sheetName?: string;

  @ApiPropertyOptional({
    description: 'Column headers',
    example: ['ID', 'Name', 'Amount'],
  })
  @IsOptional()
  @IsArray()
  headers?: string[];
}

export class ImportFromExcelDto {
  @ApiProperty({
    description: 'Excel file buffer (base64)',
    example: 'UEsDBBQAAAAI...',
  })
  @IsString()
  fileData: string;

  @ApiPropertyOptional({
    description: 'Sheet index (0-based)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  sheetIndex?: number;

  @ApiPropertyOptional({
    description: 'Start row (1-based)',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  startRow?: number;

  @ApiPropertyOptional({
    description: 'Column headers',
    example: ['ID', 'Name', 'Amount'],
  })
  @IsOptional()
  @IsArray()
  headers?: string[];

  @ApiPropertyOptional({
    description: 'Skip empty rows',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  skipEmptyRows?: boolean;
}

export class ExportToCSVDto {
  @ApiProperty({
    description: 'Data to export',
    example: [{ id: '1', name: 'Loan 1', amount: 1000 }],
  })
  @IsArray()
  data: any[];

  @ApiPropertyOptional({
    description: 'Column headers',
    example: ['ID', 'Name', 'Amount'],
  })
  @IsOptional()
  @IsArray()
  headers?: string[];
}

export class ImportFromCSVDto {
  @ApiProperty({
    description: 'CSV file content',
    example: 'ID,Name,Amount\n1,Loan 1,1000',
  })
  @IsString()
  csvContent: string;

  @ApiPropertyOptional({
    description: 'Column headers',
    example: ['ID', 'Name', 'Amount'],
  })
  @IsOptional()
  @IsArray()
  headers?: string[];
}

