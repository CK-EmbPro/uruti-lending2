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
import { MicroservicesCommunicationService } from './services/microservices-communication.service';
import {
  ServiceCallDto,
  ServiceRegistrationDto,
  ServiceStatus,
} from './dto/microservices-communication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Microservices Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('microservices-communication')
export class MicroservicesCommunicationController {
  constructor(private readonly communicationService: MicroservicesCommunicationService) {}

  @Post('services/register')
  @ApiOperation({ summary: 'Register service' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  registerService(@Body() registrationDto: ServiceRegistrationDto) {
    return this.communicationService.registerService(registrationDto);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  findAllServices(@Query('status') status?: ServiceStatus) {
    return this.communicationService.findAllServices(status);
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Get service by name' })
  @ApiResponse({ status: 200, description: 'Service details' })
  findService(@Param('serviceName') serviceName: string) {
    return this.communicationService.findService(serviceName);
  }

  @Post('services/:serviceName/call')
  @ApiOperation({ summary: 'Call service' })
  @ApiResponse({ status: 200, description: 'Service call result' })
  callService(
    @Param('serviceName') serviceName: string,
    @Body() callDto: Omit<ServiceCallDto, 'serviceName'>,
  ) {
    return this.communicationService.callService({
      ...callDto,
      serviceName,
    });
  }

  @Get('services/:serviceName/health')
  @ApiOperation({ summary: 'Get service health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getServiceHealth(@Param('serviceName') serviceName: string) {
    return this.communicationService.getServiceHealth(serviceName);
  }

  @Get('services/:serviceName/stats')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiResponse({ status: 200, description: 'Service statistics' })
  getServiceStats(@Param('serviceName') serviceName: string) {
    return this.communicationService.getServiceStats(serviceName);
  }
}

