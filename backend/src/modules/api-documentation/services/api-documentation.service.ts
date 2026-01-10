import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { APIDocumentation } from '../entities/api-documentation.entity';
import {
  CreateAPIDocumentationDto,
  TestAPIDto,
  DocumentationStatus,
} from '../dto/api-documentation.dto';
import axios from 'axios';

@Injectable()
export class APIDocumentationService {
  private readonly logger = new Logger(APIDocumentationService.name);

  constructor(
    @InjectRepository(APIDocumentation)
    private documentationRepository: Repository<APIDocumentation>,
  ) {}

  async createDocumentation(createDto: CreateAPIDocumentationDto): Promise<APIDocumentation> {
    const doc = this.documentationRepository.create(createDto);
    return this.documentationRepository.save(doc);
  }

  async findAllDocumentation(status?: DocumentationStatus): Promise<APIDocumentation[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.documentationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneDocumentation(id: string): Promise<APIDocumentation> {
    const doc = await this.documentationRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`API documentation with ID ${id} not found`);
    }

    // Increment view count
    doc.viewCount += 1;
    await this.documentationRepository.save(doc);

    return doc;
  }

  async findDocumentationByEndpoint(endpoint: string, method: string): Promise<APIDocumentation | null> {
    return this.documentationRepository.findOne({
      where: { endpoint, method },
    });
  }

  async testAPI(testDto: TestAPIDto): Promise<{
    success: boolean;
    statusCode: number;
    response: any;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await axios({
        method: testDto.method.toLowerCase(),
        url: `${process.env.API_BASE_URL || 'http://localhost:3000'}${testDto.endpoint}`,
        data: testDto.data,
        headers: {
          'Content-Type': 'application/json',
          ...testDto.headers,
        },
        timeout: 10000,
      });

      const duration = Date.now() - startTime;

      // Update test count for documentation
      const doc = await this.findDocumentationByEndpoint(testDto.endpoint, testDto.method);
      if (doc) {
        doc.testCount += 1;
        await this.documentationRepository.save(doc);
      }

      return {
        success: true,
        statusCode: response.status,
        response: response.data,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        statusCode: error.response?.status || 500,
        response: error.response?.data || null,
        duration,
        error: error.message,
      };
    }
  }

  async generateOpenAPISpec(): Promise<Record<string, any>> {
    const docs = await this.documentationRepository.find({
      where: { status: DocumentationStatus.PUBLISHED },
    });

    const paths: Record<string, any> = {};

    for (const doc of docs) {
      const pathKey = doc.endpoint;
      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      paths[pathKey][doc.method.toLowerCase()] = {
        summary: doc.title,
        description: doc.description,
        parameters: doc.parameters?.map(p => ({
          name: p.name,
          in: 'query',
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        })),
        requestBody: doc.requestExample
          ? {
              content: {
                'application/json': {
                  example: doc.requestExample,
                },
              },
            }
          : undefined,
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                example: doc.responseExample,
              },
            },
          },
        },
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Uruti Lending API',
        version: '1.0.0',
        description: 'API Documentation for Uruti Lending Platform',
      },
      paths,
    };
  }
}

