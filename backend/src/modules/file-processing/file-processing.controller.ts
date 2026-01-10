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
import { FileProcessingService } from './services/file-processing.service';
import { ProcessFileDto, ProcessingStatus } from './dto/file-processing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('File Processing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('file-processing')
export class FileProcessingController {
  constructor(private readonly fileProcessingService: FileProcessingService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process file' })
  @ApiResponse({ status: 201, description: 'File processing started' })
  processFile(@Body() processDto: ProcessFileDto) {
    return this.fileProcessingService.processFile(processDto);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get processing job' })
  @ApiResponse({ status: 200, description: 'Processing job details' })
  getJob(@Param('id') id: string) {
    return this.fileProcessingService.getJob(id);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get processing jobs' })
  @ApiResponse({ status: 200, description: 'List of processing jobs' })
  getJobs(
    @Query('fileId') fileId?: string,
    @Query('status') status?: ProcessingStatus,
  ) {
    if (fileId) {
      return this.fileProcessingService.getJobsByFile(fileId);
    }
    if (status) {
      return this.fileProcessingService.getJobsByStatus(status);
    }
    return [];
  }
}

