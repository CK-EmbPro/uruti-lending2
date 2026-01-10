import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockchainRecord } from '../entities/blockchain-record.entity';
import { RecordType, VerificationStatus } from '../dto/blockchain.dto';
import { SmartContract } from '../entities/smart-contract.entity';
import {
  CreateBlockchainRecordDto,
  VerifyBlockchainRecordDto,
  BlockchainRecord as BlockchainRecordDto,
} from '../dto/blockchain.dto';
import * as crypto from 'crypto';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(
    @InjectRepository(BlockchainRecord)
    private recordRepository: Repository<BlockchainRecord>,
    @InjectRepository(SmartContract)
    private contractRepository: Repository<SmartContract>,
  ) {}

  async createRecord(createDto: CreateBlockchainRecordDto): Promise<BlockchainRecord> {
    // Generate transaction hash (simplified - in production, this would interact with actual blockchain)
    const transactionHash = this.generateTransactionHash(createDto);

    // Simulate blockchain transaction
    const blockNumber = await this.simulateBlockchainTransaction(transactionHash, createDto);

    const record = this.recordRepository.create({
      ...createDto,
      transactionHash,
      blockNumber,
      blockHash: this.generateBlockHash(blockNumber),
      verificationStatus: VerificationStatus.PENDING,
    });

    const saved = await this.recordRepository.save(record);

    // Verify the record
    await this.verifyRecord(saved.id);

    return saved;
  }

  private generateTransactionHash(dto: CreateBlockchainRecordDto): string {
    const data = `${dto.recordType}-${dto.entityId}-${dto.entityType}-${dto.dataHash}-${Date.now()}`;
    return '0x' + crypto.createHash('sha256').update(data).digest('hex').substring(0, 64);
  }

  private generateBlockHash(blockNumber: number): string {
    return '0x' + crypto.createHash('sha256').update(`block-${blockNumber}`).digest('hex').substring(0, 64);
  }

  private async simulateBlockchainTransaction(
    transactionHash: string,
    dto: CreateBlockchainRecordDto,
  ): Promise<number> {
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this would:
    // 1. Connect to blockchain network (Ethereum, Hyperledger, etc.)
    // 2. Submit transaction to smart contract
    // 3. Wait for transaction confirmation
    // 4. Return block number

    this.logger.log(`Simulated blockchain transaction: ${transactionHash}`);
    return Math.floor(Math.random() * 1000000) + 1000000; // Simulated block number
  }

  async verifyRecord(recordId: string): Promise<BlockchainRecord> {
    const record = await this.recordRepository.findOne({ where: { id: recordId } });
    if (!record) {
      throw new NotFoundException(`Blockchain record with ID ${recordId} not found`);
    }

    // TODO: Verify against actual blockchain
    // This is a placeholder that simulates verification
    try {
      const isValid = await this.verifyOnBlockchain(record.transactionHash, record.blockNumber);

      record.verificationStatus = isValid ? VerificationStatus.VERIFIED : VerificationStatus.FAILED;
      record.verifiedAt = new Date();

      if (!isValid) {
        record.verificationError = 'Transaction not found on blockchain';
      }
    } catch (error) {
      record.verificationStatus = VerificationStatus.FAILED;
      record.verificationError = error.message;
    }

    return this.recordRepository.save(record);
  }

  private async verifyOnBlockchain(transactionHash: string, blockNumber: number): Promise<boolean> {
    // TODO: Query blockchain to verify transaction exists
    // In production, this would:
    // 1. Connect to blockchain node
    // 2. Query transaction by hash
    // 3. Verify block number matches
    // 4. Verify transaction data

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 50));
    return true; // Simulated success
  }

  async findAllRecords(
    entityType?: string,
    recordType?: RecordType,
    limit: number = 100,
  ): Promise<BlockchainRecord[]> {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (recordType) where.recordType = recordType;

    return this.recordRepository.find({
      where,
      order: { blockNumber: 'DESC' },
      take: limit,
    });
  }

  async findOneRecord(id: string): Promise<BlockchainRecord> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Blockchain record with ID ${id} not found`);
    }
    return record;
  }

  async getRecordsByEntity(entityId: string, entityType: string): Promise<BlockchainRecord[]> {
    return this.recordRepository.find({
      where: { entityId, entityType },
      order: { createdAt: 'DESC' },
    });
  }

  async createSmartContract(
    contractAddress: string,
    contractName: string,
    abi: Record<string, any>,
    network: string,
    blockchainType: string,
  ): Promise<SmartContract> {
    const contract = this.contractRepository.create({
      contractAddress,
      contractName,
      abi,
      network,
      blockchainType: blockchainType as any,
      isActive: true,
    });

    return this.contractRepository.save(contract);
  }

  async getSmartContracts(isActive?: boolean): Promise<SmartContract[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.contractRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async hashData(data: string | Record<string, any>): Promise<string> {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async verifyDataIntegrity(
    entityId: string,
    entityType: string,
    currentDataHash: string,
  ): Promise<boolean> {
    const records = await this.getRecordsByEntity(entityId, entityType);
    if (records.length === 0) {
      return false;
    }

    // Get the most recent verified record
    const latestRecord = records.find(r => r.verificationStatus === VerificationStatus.VERIFIED);
    if (!latestRecord) {
      return false;
    }

    // Compare hashes
    return latestRecord.dataHash === currentDataHash;
  }
}

