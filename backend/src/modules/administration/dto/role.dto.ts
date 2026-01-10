import { IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../../../common/enums/role-type.enum';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Senior Loan Officer' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Role type', enum: RoleType })
  @IsEnum(RoleType)
  roleType: RoleType;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission IDs to assign', example: ['perm-1', 'perm-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission IDs to assign' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionIds?: string[];

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

