import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { QRCodeService } from './qrcode.service';
import {
  GenerateQRCodeDto,
  GeneratePaymentQRCodeDto,
  GenerateLoanDocumentQRCodeDto,
  QRCodeResponse,
  QRCodeType,
} from './dto/qrcode.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('QR Code')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qrcode')
export class QRCodeController {
  constructor(private readonly qrCodeService: QRCodeService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code from data' })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    type: QRCodeResponse,
  })
  async generateQRCode(@Body() dto: GenerateQRCodeDto): Promise<QRCodeResponse> {
    // Validate data
    const validation = this.qrCodeService.validateData(dto.data);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const result = await this.qrCodeService.generate(dto.data, {
      errorCorrectionLevel: dto.errorCorrectionLevel,
      type: dto.type,
      quality: dto.quality,
      margin: dto.margin,
      width: dto.width,
      color: dto.color,
    });

    return {
      dataUrl: result.dataUrl,
      size: result.size || 0,
    };
  }

  @Post('generate/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code and download as image' })
  @ApiResponse({
    status: 200,
    description: 'QR code generated and downloaded',
  })
  async generateAndDownload(
    @Body() dto: GenerateQRCodeDto,
    @Res() res: Response,
  ): Promise<void> {
    // Validate data
    const validation = this.qrCodeService.validateData(dto.data);
    if (!validation.valid) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.error,
      });
      return;
    }

    const buffer = await this.qrCodeService.generateBuffer(dto.data, {
      errorCorrectionLevel: dto.errorCorrectionLevel,
      type: dto.type,
      quality: dto.quality,
      margin: dto.margin,
      width: dto.width,
      color: dto.color,
    });

    const extension = dto.type === 'svg' ? 'svg' : dto.type?.split('/')[1] || 'png';
    const mimeType = dto.type || 'image/png';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="qrcode.${extension}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.send(buffer);
  }

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code for payment' })
  @ApiResponse({
    status: 200,
    description: 'Payment QR code generated successfully',
    type: QRCodeResponse,
  })
  async generatePaymentQRCode(
    @Body() dto: GeneratePaymentQRCodeDto,
  ): Promise<QRCodeResponse> {
    const result = await this.qrCodeService.generateForPayment(
      {
        amount: dto.amount,
        currency: dto.currency,
        reference: dto.reference,
        merchant: dto.merchant,
      },
      {
        errorCorrectionLevel: dto.options?.errorCorrectionLevel,
        type: dto.options?.type,
        quality: dto.options?.quality,
        margin: dto.options?.margin,
        width: dto.options?.width,
        color: dto.options?.color,
      },
    );

    return {
      dataUrl: result.dataUrl,
      size: result.size || 0,
    };
  }

  @Post('loan-document')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code for loan document' })
  @ApiResponse({
    status: 200,
    description: 'Loan document QR code generated successfully',
    type: QRCodeResponse,
  })
  async generateLoanDocumentQRCode(
    @Body() dto: GenerateLoanDocumentQRCodeDto,
  ): Promise<QRCodeResponse> {
    const result = await this.qrCodeService.generateForLoanDocument(
      dto.loanId,
      dto.documentId,
      dto.baseUrl,
    );

    return {
      dataUrl: result.dataUrl,
      size: result.size || 0,
    };
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate QR code data' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
  })
  async validateData(@Query('data') data: string): Promise<{ valid: boolean; error?: string }> {
    return this.qrCodeService.validateData(data);
  }
}

