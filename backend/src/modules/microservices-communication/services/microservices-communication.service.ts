import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRegistry } from '../entities/service-registry.entity';
import { ServiceCallLog } from '../entities/service-call-log.entity';
import {
  ServiceCallDto,
  ServiceType,
  ServiceStatus,
  ServiceRegistrationDto,
  ServiceHealth,
} from '../dto/microservices-communication.dto';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class MicroservicesCommunicationService {
  private readonly logger = new Logger(MicroservicesCommunicationService.name);
  private readonly httpClients = new Map<string, AxiosInstance>();

  constructor(
    @InjectRepository(ServiceRegistry)
    private serviceRepository: Repository<ServiceRegistry>,
    @InjectRepository(ServiceCallLog)
    private callLogRepository: Repository<ServiceCallLog>,
  ) {
    // Start health check loop
    setInterval(() => this.checkServiceHealth(), 30000); // Every 30 seconds
  }

  async registerService(registrationDto: ServiceRegistrationDto): Promise<ServiceRegistry> {
    const existing = await this.serviceRepository.findOne({
      where: { serviceName: registrationDto.serviceName },
    });

    if (existing) {
      existing.serviceUrl = registrationDto.serviceUrl;
      existing.serviceType = registrationDto.serviceType;
      existing.healthCheckEndpoint = registrationDto.healthCheckEndpoint;
      existing.metadata = registrationDto.metadata;
      return this.serviceRepository.save(existing);
    }

    const service = this.serviceRepository.create(registrationDto);
    return this.serviceRepository.save(service);
  }

  async findAllServices(status?: ServiceStatus): Promise<ServiceRegistry[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.serviceRepository.find({
      where,
      order: { serviceName: 'ASC' },
    });
  }

  async findService(serviceName: string): Promise<ServiceRegistry> {
    const service = await this.serviceRepository.findOne({
      where: { serviceName },
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceName} not found`);
    }

    return service;
  }

  async callService(callDto: ServiceCallDto): Promise<any> {
    const service = await this.findService(callDto.serviceName);
    const startTime = Date.now();

    try {
      let response: any;

      switch (service.serviceType) {
        case ServiceType.HTTP:
          response = await this.callHttpService(service, callDto);
          break;
        case ServiceType.GRPC:
          // TODO: Implement gRPC call
          throw new Error('gRPC calls not yet implemented');
        case ServiceType.MESSAGE_QUEUE:
          // TODO: Implement message queue call
          throw new Error('Message queue calls not yet implemented');
        default:
          throw new Error(`Unsupported service type: ${service.serviceType}`);
      }

      const responseTime = Date.now() - startTime;

      // Log successful call
      await this.logServiceCall(service.serviceName, callDto, 'success', responseTime, 200, null, response);

      // Update service stats
      service.successCount += 1;
      service.responseTime = responseTime;
      await this.serviceRepository.save(service);

      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Log failed call
      await this.logServiceCall(
        service.serviceName,
        callDto,
        'error',
        responseTime,
        error.response?.status || 500,
        error.message,
        null,
      );

      // Update service stats
      service.failureCount += 1;
      if (service.failureCount > 5) {
        service.status = ServiceStatus.DEGRADED;
      }
      await this.serviceRepository.save(service);

      throw error;
    }
  }

  private async callHttpService(service: ServiceRegistry, callDto: ServiceCallDto): Promise<any> {
    let client = this.httpClients.get(service.serviceName);

    if (!client) {
      client = axios.create({
        baseURL: service.serviceUrl,
        timeout: callDto.timeout || 5000,
      });
      this.httpClients.set(service.serviceName, client);
    }

    const config: any = {
      method: callDto.method.toLowerCase(),
      url: callDto.endpoint,
    };

    if (callDto.data) {
      if (callDto.method.toUpperCase() === 'GET') {
        config.params = callDto.data;
      } else {
        config.data = callDto.data;
      }
    }

    const response = await client.request(config);
    return response.data;
  }

  private async logServiceCall(
    serviceName: string,
    callDto: ServiceCallDto,
    status: string,
    responseTime: number,
    statusCode: number | null,
    errorMessage: string | null,
    responseData: any,
  ): Promise<void> {
    const log = this.callLogRepository.create({
      serviceName,
      endpoint: callDto.endpoint,
      method: callDto.method,
      status,
      responseTime,
      statusCode,
      errorMessage,
      requestData: callDto.data,
      responseData,
      timestamp: new Date(),
    });

    await this.callLogRepository.save(log);
  }

  private async checkServiceHealth(): Promise<void> {
    const services = await this.serviceRepository.find();

    for (const service of services) {
      try {
        if (service.serviceType === ServiceType.HTTP && service.healthCheckEndpoint) {
          const startTime = Date.now();
          const client = axios.create({
            baseURL: service.serviceUrl,
            timeout: 5000,
          });

          await client.get(service.healthCheckEndpoint);
          const responseTime = Date.now() - startTime;

          service.status = ServiceStatus.HEALTHY;
          service.responseTime = responseTime;
          service.lastCheckedAt = new Date();
        } else {
          service.status = ServiceStatus.UNKNOWN;
        }
      } catch (error) {
        this.logger.warn(`Health check failed for ${service.serviceName}: ${error}`);
        service.status = ServiceStatus.DOWN;
        service.lastCheckedAt = new Date();
      }

      await this.serviceRepository.save(service);
    }
  }

  async getServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const service = await this.findService(serviceName);

    return {
      serviceName: service.serviceName,
      status: service.status,
      responseTime: service.responseTime,
      lastChecked: service.lastCheckedAt || new Date(),
    };
  }

  async getServiceStats(serviceName?: string): Promise<Record<string, any>> {
    const where: any = {};
    if (serviceName) where.serviceName = serviceName;

    const logs = await this.callLogRepository.find({ where });
    const totalCalls = logs.length;
    const successfulCalls = logs.filter(l => l.status === 'success').length;
    const failedCalls = logs.filter(l => l.status === 'error').length;
    const avgResponseTime = logs.length > 0
      ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
      : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? successfulCalls / totalCalls : 0,
      avgResponseTime,
    };
  }
}

