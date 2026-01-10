import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from './entities/document-type.entity';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  async create(createDto: CreateDocumentTypeDto): Promise<DocumentType> {
    // Check if code already exists
    const existing = await this.documentTypeRepository.findOne({
      where: { code: createDto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Document type with code ${createDto.code} already exists`,
      );
    }

    const documentType = this.documentTypeRepository.create(createDto);
    return await this.documentTypeRepository.save(documentType);
  }

  async findAll(): Promise<DocumentType[]> {
    return await this.documentTypeRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<DocumentType[]> {
    return await this.documentTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findByCategory(category: string): Promise<DocumentType[]> {
    return await this.documentTypeRepository.find({
      where: { category: category as any, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException(
        `Document type with ID ${id} not found`,
      );
    }

    return documentType;
  }

  async findByCode(code: string): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findOne({
      where: { code },
    });

    if (!documentType) {
      throw new NotFoundException(
        `Document type with code ${code} not found`,
      );
    }

    return documentType;
  }

  async update(
    id: string,
    updateDto: UpdateDocumentTypeDto,
  ): Promise<DocumentType> {
    const documentType = await this.findOne(id);
    Object.assign(documentType, updateDto);
    return await this.documentTypeRepository.save(documentType);
  }

  async remove(id: string): Promise<void> {
    const documentType = await this.findOne(id);

    // Check if document type is used in any documents
    // This would require checking LoanApplicationDocument - can be added later

    await this.documentTypeRepository.remove(documentType);
  }
}

