import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BlockchainService } from './services/blockchain.service';
import {
  CreateBlockchainRecordDto,
  RecordType,
} from './dto/blockchain.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Blockchain')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Post('records')
  @ApiOperation({ summary: 'Create blockchain record' })
  @ApiResponse({ status: 201, description: 'Blockchain record created successfully' })
  createRecord(@Body() createDto: CreateBlockchainRecordDto) {
    return this.blockchainService.createRecord(createDto);
  }

  @Get('records')
  @ApiOperation({ summary: 'Get all blockchain records' })
  @ApiResponse({ status: 200, description: 'List of blockchain records' })
  findAllRecords(
    @Query('entityType') entityType?: string,
    @Query('recordType') recordType?: RecordType,
    @Query('limit') limit?: number,
  ) {
    return this.blockchainService.findAllRecords(entityType, recordType, limit);
  }

  @Get('records/:id')
  @ApiOperation({ summary: 'Get blockchain record by ID' })
  @ApiResponse({ status: 200, description: 'Blockchain record details' })
  findOneRecord(@Param('id') id: string) {
    return this.blockchainService.findOneRecord(id);
  }

  @Get('records/entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get records by entity' })
  @ApiResponse({ status: 200, description: 'List of records for entity' })
  getRecordsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.blockchainService.getRecordsByEntity(entityId, entityType);
  }

  @Post('records/:id/verify')
  @ApiOperation({ summary: 'Verify blockchain record' })
  @ApiResponse({ status: 200, description: 'Record verified' })
  verifyRecord(@Param('id') id: string) {
    return this.blockchainService.verifyRecord(id);
  }

  @Post('hash')
  @ApiOperation({ summary: 'Hash data' })
  @ApiResponse({ status: 200, description: 'Data hash generated' })
  hashData(@Body('data') data: string | Record<string, any>) {
    return this.blockchainService.hashData(data);
  }

  @Post('verify-integrity')
  @ApiOperation({ summary: 'Verify data integrity' })
  @ApiResponse({ status: 200, description: 'Integrity verification result' })
  verifyDataIntegrity(
    @Body('entityId') entityId: string,
    @Body('entityType') entityType: string,
    @Body('currentDataHash') currentDataHash: string,
  ) {
    return this.blockchainService.verifyDataIntegrity(entityId, entityType, currentDataHash);
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Register smart contract' })
  @ApiResponse({ status: 201, description: 'Smart contract registered' })
  createSmartContract(
    @Body('contractAddress') contractAddress: string,
    @Body('contractName') contractName: string,
    @Body('abi') abi: Record<string, any>,
    @Body('network') network: string,
    @Body('blockchainType') blockchainType: string,
  ) {
    return this.blockchainService.createSmartContract(
      contractAddress,
      contractName,
      abi,
      network,
      blockchainType,
    );
  }

  @Get('contracts')
  @ApiOperation({ summary: 'Get smart contracts' })
  @ApiResponse({ status: 200, description: 'List of smart contracts' })
  getSmartContracts(@Query('isActive') isActive?: boolean) {
    return this.blockchainService.getSmartContracts(
      isActive !== undefined ? isActive === true : undefined,
    );
  }
}

