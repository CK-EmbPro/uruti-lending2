import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
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
import { ESignatureService } from './services/e-signature.service';
import {
  CreateSignatureRequestDto,
  SignatureStatusResult,
} from './dto/e-signature.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('e-signature')
@ApiBearerAuth('JWT-auth')
@Controller('e-signature')
@UseGuards(CompanyGuard)
export class ESignatureController {
  constructor(private readonly eSignatureService: ESignatureService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create signature request',
    description: 'Creates a new e-signature request for a document. Supports multiple signers with sequential or parallel signing.',
  })
  @ApiBody({ type: CreateSignatureRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Signature request created successfully',
  })
  async createSignatureRequest(
    @Body() dto: CreateSignatureRequestDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.eSignatureService.createSignatureRequest(dto, companyId);
  }

  @Get('request/:id/status')
  @ApiOperation({
    summary: 'Get signature request status',
    description: 'Returns the current status of a signature request including completion percentage and signer statuses.',
  })
  @ApiParam({ name: 'id', description: 'Signature request ID' })
  @ApiResponse({
    status: 200,
    description: 'Signature status retrieved successfully',
  })
  async getSignatureStatus(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.eSignatureService.getSignatureStatus(id, companyId);
  }

  @Post('request/:id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign document',
    description: 'Signs a document for a specific signer. Updates signature request status and generates signed document when all signers complete.',
  })
  @ApiParam({ name: 'id', description: 'Signature request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        signerEmail: { type: 'string', example: 'john@example.com' },
        signature: { type: 'string', description: 'Base64 signature image' },
        initials: { type: 'string', description: 'Base64 initials image' },
        ipAddress: { type: 'string', example: '192.168.1.1' },
        userAgent: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document signed successfully',
  })
  async signDocument(
    @Param('id') id: string,
    @Body() body: {
      signerEmail: string;
      signature?: string;
      initials?: string;
      ipAddress?: string;
      userAgent?: string;
    },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.eSignatureService.signDocument(
      id,
      body.signerEmail,
      {
        signature: body.signature,
        initials: body.initials,
        ipAddress: body.ipAddress,
        userAgent: body.userAgent,
      },
      companyId,
    );
  }

  @Patch('request/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel signature request',
    description: 'Cancels a pending signature request. Cannot cancel completed requests.',
  })
  @ApiParam({ name: 'id', description: 'Signature request ID' })
  @ApiResponse({
    status: 200,
    description: 'Signature request cancelled successfully',
  })
  async cancelSignatureRequest(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.eSignatureService.cancelSignatureRequest(id, companyId);
    return { message: 'Signature request cancelled successfully' };
  }

  @Post('request/:id/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend signature request',
    description: 'Resends signature request email to a specific signer.',
  })
  @ApiParam({ name: 'id', description: 'Signature request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        signerEmail: { type: 'string', example: 'john@example.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Signature request resent successfully',
  })
  async resendSignatureRequest(
    @Param('id') id: string,
    @Body() body: { signerEmail: string },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.eSignatureService.resendSignatureRequest(id, body.signerEmail, companyId);
    return { message: 'Signature request resent successfully' };
  }
}

