import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetType, ChartType, MetricType } from '../entities/dashboard-widget.entity';

export class CreateDashboardDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  layout?: any;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  filters?: any;

  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  widgets?: CreateWidgetDto[];
}

export class UpdateDashboardDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  layout?: any;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  filters?: any;
}

export class CreateWidgetDto {
  @ApiProperty({ enum: WidgetType })
  widgetType: WidgetType;

  @ApiPropertyOptional({ enum: MetricType })
  metricType?: MetricType;

  @ApiPropertyOptional({ enum: ChartType })
  chartType?: ChartType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  metricId: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiProperty()
  positionX: number;

  @ApiProperty()
  positionY: number;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  refreshInterval?: number;
}

export class UpdateWidgetDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiPropertyOptional()
  @IsOptional()
  positionX?: number;

  @ApiPropertyOptional()
  @IsOptional()
  positionY?: number;

  @ApiPropertyOptional()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  refreshInterval?: number;
}

export class GetMetricsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metricIds?: string[];
}

