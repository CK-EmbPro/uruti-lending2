import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsArray } from 'class-validator';

export enum BlockchainType {
  ETHEREUM = 'ETHEREUM',
  HYPERLEDGER = 'HYPERLEDGER',
  CUSTOM = 'CUSTOM',
}

export enum RecordType {
  DOCUMENT = 'DOCUMENT',
  TRANSACTION = 'TRANSACTION',
  LOAN_AGREEMENT = 'LOAN_AGREEMENT',
  PAYMENT = 'PAYMENT',
  CONTRACT = 'CONTRACT',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export class CreateBlockchainRecordDto {
  @ApiProperty({ description: 'Record type', enum: RecordType })
  @IsEnum(RecordType)
  recordType: RecordType;

  @ApiProperty({ description: 'Entity ID (loan, document, etc.)', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Entity type', example: 'LOAN' })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Data hash', example: '0xabc123...' })
  @IsString()
  dataHash: string;

  @ApiPropertyOptional({ description: 'Metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class VerifyBlockchainRecordDto {
  @ApiProperty({ description: 'Transaction hash', example: '0xdef456...' })
  @IsString()
  transactionHash: string;

  @ApiProperty({ description: 'Block number', example: 12345 })
  @IsNumber()
  blockNumber: number;
}

export class BlockchainRecord {
  @ApiProperty({ description: 'Record ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Transaction hash', example: '0xabc123...' })
  transactionHash: string;

  @ApiProperty({ description: 'Block number', example: 12345 })
  blockNumber: number;

  @ApiProperty({ description: 'Block hash', example: '0xdef456...' })
  blockHash: string;

  @ApiProperty({ description: 'Record type', enum: RecordType })
  recordType: RecordType;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Data hash', example: '0xghi789...' })
  dataHash: string;

  @ApiProperty({ description: 'Verification status', enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

export class SmartContract {
  @ApiProperty({ description: 'Contract address', example: '0x1234...' })
  contractAddress: string;

  @ApiProperty({ description: 'Contract name', example: 'LoanAgreement' })
  contractName: string;

  @ApiProperty({ description: 'ABI', type: Object })
  abi: Record<string, any>;

  @ApiProperty({ description: 'Network', example: 'mainnet' })
  network: string;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;
}

