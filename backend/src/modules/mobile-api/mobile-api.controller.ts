import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MobileApiService } from './services/mobile-api.service';
import {
  RegisterDeviceDto,
  SendPushNotificationDto,
} from './dto/mobile-api.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('mobile-api')
@ApiBearerAuth('JWT-auth')
@Controller('mobile-api')
@UseGuards(CompanyGuard)
export class MobileApiController {
  constructor(private readonly mobileApiService: MobileApiService) {}

  @Post('devices/register')
  @ApiOperation({
    summary: 'Register device for push notifications',
    description: 'Registers a mobile device (iOS, Android, or Web) for push notifications. Supports FCM and APNS.',
  })
  @ApiBody({ type: RegisterDeviceDto })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
  })
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    const companyId = req.user?.companyId || req.companyId;
    await this.mobileApiService.registerDevice(dto, userId, companyId);
    return { message: 'Device registered successfully' };
  }

  @Delete('devices/:token')
  @ApiOperation({
    summary: 'Unregister device',
    description: 'Unregisters a device from push notifications.',
  })
  @ApiParam({ name: 'token', description: 'Device token' })
  @ApiResponse({
    status: 200,
    description: 'Device unregistered successfully',
  })
  async unregisterDevice(
    @Param('token') token: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.mobileApiService.unregisterDevice(token, companyId);
    return { message: 'Device unregistered successfully' };
  }

  @Post('notifications/push')
  @ApiOperation({
    summary: 'Send push notification',
    description: 'Sends a push notification to a user\'s registered devices. Supports multiple notification types.',
  })
  @ApiBody({ type: SendPushNotificationDto })
  @ApiResponse({
    status: 200,
    description: 'Push notification sent successfully',
  })
  async sendPushNotification(
    @Body() dto: SendPushNotificationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.mobileApiService.sendPushNotification(dto, companyId);
    return { message: 'Push notification sent successfully' };
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get mobile dashboard',
    description: 'Returns mobile-optimized dashboard data including quick stats, recent activities, upcoming payments, and notification count.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile dashboard retrieved successfully',
  })
  async getMobileDashboard(@Request() req: any) {
    const userId = req.user?.id || req.userId;
    const companyId = req.user?.companyId || req.companyId;
    return await this.mobileApiService.getMobileDashboard(userId, companyId);
  }

  @Get('loans/:id')
  @ApiOperation({
    summary: 'Get mobile loan details',
    description: 'Returns mobile-optimized loan details including loan information, next payment, payment history, and documents.',
  })
  @ApiParam({ name: 'id', description: 'Loan ID' })
  @ApiResponse({
    status: 200,
    description: 'Mobile loan details retrieved successfully',
  })
  async getMobileLoanDetails(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    const companyId = req.user?.companyId || req.companyId;
    return await this.mobileApiService.getMobileLoanDetails(id, userId, companyId);
  }

  @Get('applications/:id/status')
  @ApiOperation({
    summary: 'Get mobile application status',
    description: 'Returns mobile-optimized application status including current stage, timeline, required documents, and next steps.',
  })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({
    status: 200,
    description: 'Mobile application status retrieved successfully',
  })
  async getMobileApplicationStatus(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.userId;
    const companyId = req.user?.companyId || req.companyId;
    return await this.mobileApiService.getMobileApplicationStatus(
      id,
      userId,
      companyId,
    );
  }
}

