import {
  Controller,
  Post,
  Body,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationPrefillService } from './services/application-prefill.service';
import { PrefillApplicationDto } from './dto/prefill-application.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('application-prefill')
@ApiBearerAuth('JWT-auth')
@Controller('application-prefill')
@UseGuards(CompanyGuard)
export class ApplicationPrefillController {
  constructor(private readonly prefillService: ApplicationPrefillService) {}

  @Post('prefill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pre-fill loan application',
    description: 'Intelligently pre-fills loan application form based on applicant history, previous applications, and active loans',
  })
  @ApiBody({ type: PrefillApplicationDto })
  @ApiResponse({
    status: 200,
    description: 'Application pre-filled successfully',
  })
  async prefillApplication(
    @Body() dto: PrefillApplicationDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.prefillService.prefillApplication(dto, companyId);
  }
}

