import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  Headers,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { LinkLoanDto } from './dto/link-loan.dto';
import { UpdateProfileDto, UpdateEmailDto, ChangePasswordDto } from './dto/update-profile.dto';
import { SetupMfaDto, VerifyMfaDto, DisableMfaDto } from './dto/mfa.dto';
import { VerifyMfaLoginDto } from './dto/verify-mfa-login.dto';
import { SchedulePaymentDto, CancelScheduledPaymentDto } from './dto/schedule-payment.dto';
import { CreateLoanApplicationDto } from '../loan-application/dto/create-loan-application.dto';
import { JwtService } from '@nestjs/jwt';


@ApiTags('customer-portal')
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(
    private readonly customerPortalService: CustomerPortalService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register customer portal account', 
    description: 'Creates a new customer portal account' 
  })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer registered successfully',
    schema: { 
      type: 'object', 
      properties: { 
        access_token: { type: 'string' }, 
        user: { type: 'object' } 
      } 
    } 
  })
  @ApiResponse({ status: 409, description: 'Customer already exists' })
  async register(@Body() registerDto: CustomerRegisterDto) {
    return this.customerPortalService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Customer portal login', 
    description: 'Authenticates a customer and returns JWT token' 
  })
  @ApiBody({ type: CustomerLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful or MFA required',
    schema: { 
      type: 'object', 
      properties: { 
        access_token: { type: 'string' }, 
        tempToken: { type: 'string' },
        requiresMfa: { type: 'boolean' },
        user: { type: 'object' } 
      } 
    } 
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: CustomerLoginDto) {
    return this.customerPortalService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer portal logout',
    description: 'Clears the customer authentication cookie',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('login/verify-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify MFA for login',
    description: 'Verifies MFA token during login and returns final access token',
  })
  @ApiBody({ type: VerifyMfaLoginDto })
  @ApiResponse({
    status: 200,
    description: 'MFA verified successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid token or MFA code' })
  async verifyMfaLogin(@Body() verifyDto: VerifyMfaLoginDto) {
    return this.customerPortalService.verifyMfaLogin(verifyDto.tempToken, verifyDto.token);
  }

  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  private validateToken(req: any, authHeader?: string): { sub: string; email: string; type: string } {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current customer',
    description: 'Retrieves the currently authenticated customer from JWT token',
  })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @Headers('authorization') authHeader?: string,
    @Request() req?: any,
  ) {
    // Extensive logging was here for debugging, now simplified to use unified validation
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getCurrentUser(payload.sub);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update profile information',
    description: 'Updates customer profile information (name, phone number)',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Body() updateDto: UpdateProfileDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.updateProfile(payload.sub, updateDto);
  }

  @Patch('profile/email')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update email address',
    description: 'Updates customer email address (requires re-verification)',
  })
  @ApiBody({ type: UpdateEmailDto })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateEmail(
    @Body() updateDto: UpdateEmailDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);

    if (!updateDto.email) {
      throw new BadRequestException('Email is required');
    }

    return this.customerPortalService.updateEmail(payload.sub, updateDto.email);
  }

  @Post('profile/change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes customer password',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or incorrect current password' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    await this.customerPortalService.changePassword(
      payload.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return { message: 'Password changed successfully' };
  }

  @Get('loans')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my loans',
    description: 'Retrieves all loans for the authenticated customer',
  })
  @ApiResponse({ status: 200, description: 'Loans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyLoans(
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getMyLoans(payload.email, payload.sub);
  }

  @Get('loans/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get loan details',
    description: 'Retrieves details of a specific loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 200, description: 'Loan found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  async getMyLoan(
    @Param('id') loanId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getMyLoan(loanId, payload.email, payload.sub);
  }

  @Get('loans/:id/summary')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get loan account summary',
    description: 'Retrieves account summary for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getLoanSummary(
    @Param('id') loanId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getLoanSummary(loanId, payload.email, payload.sub);
  }

  @Get('loans/:id/payment-history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Retrieves payment history for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', type: Number })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(
    @Param('id') loanId: string,
    @Request() req: any,
    @Query('limit') limit?: number,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getPaymentHistory(loanId, payload.email, payload.sub, limit);
  }

  @Get('loans/:id/upcoming-payments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get upcoming payments',
    description: 'Retrieves upcoming payment schedule for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results', type: Number })
  @ApiResponse({ status: 200, description: 'Upcoming payments retrieved successfully' })
  async getUpcomingPayments(
    @Param('id') loanId: string,
    @Request() req: any,
    @Query('limit') limit?: number,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getUpcomingPayments(loanId, payload.email, payload.sub, limit);
  }

  @Get('loans/:id/statements')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get loan statements',
    description: 'Retrieves all statements for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 200, description: 'Statements retrieved successfully' })
  async getStatements(
    @Param('id') loanId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getStatements(loanId, payload.email, payload.sub);
  }

  @Post('loans/link')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Link a loan to customer account',
    description: 'Links a loan to the authenticated customer account with verification',
  })
  @ApiBody({ type: LinkLoanDto })
  @ApiResponse({ status: 201, description: 'Loan linked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @ApiResponse({ status: 409, description: 'Loan already linked' })
  async linkLoan(
    @Body() linkDto: LinkLoanDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.linkLoan(payload.sub, payload.email, linkDto);
  }

  @Delete('loans/:id/link')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Unlink a loan from customer account',
    description: 'Removes the link between a loan and the customer account',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 200, description: 'Loan unlinked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Loan link not found' })
  async unlinkLoan(
    @Param('id') loanId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    await this.customerPortalService.unlinkLoan(payload.sub, loanId);
    return { message: 'Loan unlinked successfully' };
  }

  @Get('documents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all documents',
    description: 'Retrieves all documents (statements, agreements, etc.) for the authenticated customer',
  })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllDocuments(
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getAllDocuments(payload.email, payload.sub);
  }

  @Get('notifications')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get notifications',
    description: 'Retrieves in-app notifications for the authenticated customer',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of notifications to return' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Return only unread notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: string | boolean,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getNotifications(
      payload.sub,
      limit ? parseInt(limit.toString()) : 50,
      unreadOnly === true || unreadOnly === 'true',
    );
  }

  @Get('notifications/unread-count')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the count of unread notifications',
  })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    const count = await this.customerPortalService.getUnreadNotificationCount(payload.sub);
    return { count };
  }

  @Patch('notifications/:id/read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Marks a specific notification as read',
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markNotificationAsRead(
    @Param('id') notificationId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    await this.customerPortalService.markNotificationAsRead(payload.sub, notificationId);
    return { message: 'Notification marked as read' };
  }

  @Patch('notifications/read-all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Marks all notifications as read for the authenticated customer',
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllNotificationsAsRead(
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    await this.customerPortalService.markAllNotificationsAsRead(payload.sub);
    return { message: 'All notifications marked as read' };
  }

  @Post('mfa/setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Setup MFA',
    description: 'Initiates MFA setup and returns QR code for authenticator app',
  })
  @ApiResponse({ status: 200, description: 'MFA setup initiated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'MFA already enabled' })
  async setupMfa(
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.setupMfa(payload.sub);
  }

  @Post('mfa/verify-setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify MFA setup',
    description: 'Verifies the MFA token and enables MFA for the account',
  })
  @ApiBody({ type: VerifyMfaDto })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async verifyMfaSetup(
    @Body() verifyDto: VerifyMfaDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    await this.customerPortalService.verifyMfaSetup(payload.sub, verifyDto.token);
    return { message: 'MFA enabled successfully' };
  }

  @Post('mfa/disable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable MFA',
    description: 'Disables MFA for the account (requires valid MFA token)',
  })
  @ApiBody({ type: DisableMfaDto })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token' })
  async disableMfa(
    @Body() disableDto: DisableMfaDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    await this.customerPortalService.disableMfa(payload.sub, disableDto.token);
    return { message: 'MFA disabled successfully' };
  }

  // Payment Scheduling Endpoints
  @Post('loans/:id/schedule-payment')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Schedule a payment',
    description: 'Schedule a one-time payment for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 201, description: 'Payment scheduled successfully' })
  async schedulePayment(
    @Param('id') loanId: string,
    @Body() dto: SchedulePaymentDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    // Set loanId from param
    dto.loanId = loanId;
    return this.customerPortalService.schedulePayment(dto, payload.email, payload.sub);
  }

  @Get('loans/:id/scheduled-payments')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get scheduled payments',
    description: 'Retrieves all scheduled payments for a loan',
  })
  @ApiParam({ name: 'id', description: 'Loan ID', type: String })
  @ApiResponse({ status: 200, description: 'Scheduled payments retrieved successfully' })
  async getScheduledPayments(
    @Param('id') loanId: string,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.getScheduledPayments(loanId, payload.email, payload.sub);
  }

  @Delete('scheduled-payments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel scheduled payment',
    description: 'Cancel a scheduled payment',
  })
  @ApiParam({ name: 'id', description: 'Scheduled Payment ID', type: String })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  async cancelScheduledPayment(
    @Param('id') scheduledPaymentId: string,
    @Body() dto: CancelScheduledPaymentDto,
    @Request() req: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const payload = this.validateToken(req, authHeader);
    return this.customerPortalService.cancelScheduledPayment(
      scheduledPaymentId,
      dto,
      payload.email,
      payload.sub,
    );
  }

  @Get('risk-tier')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get customer risk tier', description: 'Retrieves the risk tier for the authenticated customer' })
  @ApiResponse({ status: 200, description: 'Risk tier retrieved successfuly' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRiskTier(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      return this.customerPortalService.getRiskTier(payload.sub);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('companies')
  @ApiOperation({ summary: 'Get available lending companies', description: 'Returns a list of active lending companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  async getCompanies() {
    return this.customerPortalService.getAvailableCompanies();
  }

  @Get('loan-products')
  @ApiOperation({ summary: 'Get loan products by company', description: 'Returns active loan products for a specific company' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiResponse({ status: 200, description: 'Loan products retrieved successfully' })
  async getLoanProducts(@Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }
    return this.customerPortalService.getLoanProductsByCompany(companyId);
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a loan application', description: 'Submits a new loan application for the authenticated customer' })
  @ApiBody({ type: CreateLoanApplicationDto })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitApplication(@Headers('authorization') authHeader: string, @Body() dto: CreateLoanApplicationDto) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      return this.customerPortalService.submitApplication(payload.sub, dto);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('my-applications')
  @ApiOperation({ summary: 'Get my loan applications', description: 'Retrieves all loan applications submitted by the authenticated customer' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyApplications(@Headers('authorization') authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      return this.customerPortalService.getMyApplications(payload.sub);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
