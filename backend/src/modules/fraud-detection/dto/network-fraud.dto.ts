import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum RelationshipType {
  DEVICE = 'DEVICE',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ID_NUMBER = 'ID_NUMBER',
  ADDRESS = 'ADDRESS',
  GPS = 'GPS',
  GUARANTOR = 'GUARANTOR',
  REFERRAL = 'REFERRAL',
}

export class RelationshipDto {
  @ApiProperty({ description: 'Source application ID', example: 'app-123' })
  @IsString()
  sourceApplicationId: string;

  @ApiProperty({ description: 'Target application ID', example: 'app-456' })
  @IsString()
  targetApplicationId: string;

  @ApiProperty({ description: 'Relationship type', enum: RelationshipType, example: RelationshipType.DEVICE })
  relationshipType: RelationshipType;

  @ApiProperty({ description: 'Shared attribute value', example: 'device-fingerprint-hash' })
  @IsString()
  sharedAttribute: string;

  @ApiProperty({ description: 'Similarity score (0-100)', example: 100 })
  @IsNumber()
  similarityScore: number;
}

export class ClusterDto {
  @ApiProperty({ description: 'Cluster ID', example: 'cluster-123' })
  id: string;

  @ApiProperty({ description: 'Application IDs in cluster', example: ['app-1', 'app-2', 'app-3'] })
  @IsArray()
  applicationIds: string[];

  @ApiProperty({ description: 'Cluster size', example: 5 })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'Cluster density (0-1)', example: 0.75 })
  @IsNumber()
  density: number;

  @ApiProperty({ description: 'Relationship types in cluster', example: [RelationshipType.DEVICE, RelationshipType.BANK_ACCOUNT] })
  @IsArray()
  relationshipTypes: RelationshipType[];

  @ApiProperty({ description: 'Whether cluster is flagged', example: true })
  @IsBoolean()
  flagged: boolean;

  @ApiProperty({ description: 'Number of fraudulent members', example: 2 })
  @IsNumber()
  fraudulentMembers: number;

  @ApiProperty({ description: 'Number of defaulted members', example: 1 })
  @IsNumber()
  defaultedMembers: number;

  @ApiProperty({ description: 'Cluster risk score (0-100)', example: 85 })
  @IsNumber()
  riskScore: number;
}

export class NetworkGraphDto {
  @ApiProperty({ description: 'Nodes (applications)', type: [Object] })
  nodes: Array<{
    id: string;
    applicationId: string;
    label: string;
    flagged: boolean;
    fraudulent: boolean;
    defaulted: boolean;
    riskScore: number;
  }>;

  @ApiProperty({ description: 'Edges (relationships)', type: [RelationshipDto] })
  edges: RelationshipDto[];

  @ApiProperty({ description: 'Clusters detected', type: [ClusterDto] })
  clusters: ClusterDto[];

  @ApiProperty({ description: 'Total nodes', example: 50 })
  totalNodes: number;

  @ApiProperty({ description: 'Total edges', example: 120 })
  totalEdges: number;

  @ApiProperty({ description: 'Total clusters', example: 3 })
  totalClusters: number;
}

export class NetworkFraudCheckRequestDto {
  @ApiProperty({ description: 'Application ID to check', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Include visualization data', example: true })
  @IsOptional()
  @IsBoolean()
  includeVisualization?: boolean;
}

export class NetworkFraudCheckResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Whether part of a fraud ring', example: true })
  @IsBoolean()
  isPartOfRing: boolean;

  @ApiProperty({ description: 'Cluster ID if part of ring', example: 'cluster-123' })
  @IsString()
  clusterId?: string;

  @ApiProperty({ description: 'Cluster details', type: ClusterDto })
  @ValidateNested()
  @Type(() => ClusterDto)
  cluster?: ClusterDto;

  @ApiProperty({ description: 'Network risk score (0-100)', example: 75 })
  @IsNumber()
  networkRiskScore: number;

  @ApiProperty({ description: 'Whether flagged for review', example: true })
  @IsBoolean()
  flaggedForReview: boolean;

  @ApiPropertyOptional({ description: 'Network graph visualization data', type: NetworkGraphDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NetworkGraphDto)
  visualization?: NetworkGraphDto;
}

