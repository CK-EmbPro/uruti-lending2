import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { VerifyLoanLinkDto } from './dto/verify-loan-link.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('customer-portal-admin')
@Controller('admin/customer-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles('Admin', 'System Administrator', 'admin', 'Loan Officer', 'loan_officer', 'Customer Service', 'customer_service')
export class CustomerPortalAdminController {
  constructor(
    private readonly customerPortalService: CustomerPortalService,
  ) {}

  @Get('pending-verifications')
  @ApiOperation({
    summary: 'Get pending loan link verifications',
    description: 'Retrieves all unverified loan links that need admin review',
  })
  @ApiResponse({ status: 200, description: 'Pending verifications retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPendingVerifications() {
    try {
      return await this.customerPortalService.getPendingVerifications();
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      throw error;
    }
  }

  @Get('links/:id')
  @ApiOperation({
    summary: 'Get loan link details',
    description: 'Retrieves detailed information about a specific loan link',
  })
  @ApiParam({ name: 'id', description: 'Loan link ID', type: String })
  @ApiResponse({ status: 200, description: 'Loan link found' })
  @ApiResponse({ status: 404, description: 'Loan link not found' })
  async getLinkDetails(@Param('id') linkId: string) {
    return this.customerPortalService.getLinkById(linkId);
  }

  @Post('links/:id/verify')
  @ApiOperation({
    summary: 'Verify or reject a loan link',
    description: 'Admin action to approve, reject, or request additional information for a loan link',
  })
  @ApiParam({ name: 'id', description: 'Loan link ID', type: String })
  @ApiResponse({ status: 200, description: 'Verification action completed' })
  @ApiResponse({ status: 404, description: 'Loan link not found' })
  async verifyLoanLink(
    @Param('id') linkId: string,
    @Body() verifyDto: VerifyLoanLinkDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub;
    return this.customerPortalService.verifyLoanLink(linkId, adminId, verifyDto);
  }
}

