import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiTenantService } from './services/multi-tenant.service';
import { MultiTenantController } from './multi-tenant.controller';
import { Tenant } from './entities/tenant.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    AuthModule,
  ],
  controllers: [MultiTenantController],
  providers: [MultiTenantService],
  exports: [MultiTenantService],
})
export class MultiTenantModule {}

