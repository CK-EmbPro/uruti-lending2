import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntegrationController } from './integration.controller';
import { IntegrationAdminController } from './integration-admin.controller';
import { IntegrationService } from './services/integration.service';
import { ThirdPartyPlatform } from './entities/third-party-platform.entity';
import { ExternalLoanApplication } from './entities/external-loan-application.entity';
import { ExternalRepayment } from './entities/external-repayment.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { IntegrationAuditLog } from './entities/integration-audit-log.entity';
import { LoanApplicationModule } from '../loan-application/loan-application.module';
import { LoanModule } from '../loan/loan.module';
import { LoanRepaymentModule } from '../loan-repayment/loan-repayment.module';
import { CustomerModule } from '../customer/customer.module';
import { LoanProductModule } from '../loan-product/loan-product.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ThirdPartyPlatform,
      ExternalLoanApplication,
      ExternalRepayment,
      WebhookDelivery,
      IntegrationAuditLog,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET') || 'your-secret-key';
        const expiresIn = configService.get<string>('jwt.expiresIn') || configService.get<string>('JWT_EXPIRES_IN') || '24h';
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => LoanApplicationModule),
    forwardRef(() => LoanModule),
    LoanRepaymentModule,
    CustomerModule,
    LoanProductModule,
  ],
  controllers: [IntegrationController, IntegrationAdminController],
  providers: [IntegrationService, ApiKeyGuard],
  exports: [IntegrationService],
})
export class IntegrationModule {}

