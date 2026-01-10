import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedSecurityService } from './services/advanced-security.service';
import { AdvancedSecurityController } from './advanced-security.controller';
import { MFAConfig } from './entities/mfa-config.entity';
import { SSOConfig } from './entities/sso-config.entity';
import { SecurityAuditLog } from './entities/security-audit-log.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MFAConfig,
      SSOConfig,
      SecurityAuditLog,
    ]),
      AuthModule,
],
  controllers: [AdvancedSecurityController],
  providers: [AdvancedSecurityService],
  exports: [AdvancedSecurityService],
})
export class AdvancedSecurityModule {}
