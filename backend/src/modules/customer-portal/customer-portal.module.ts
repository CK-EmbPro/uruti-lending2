import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalAdminController } from './customer-portal-admin.controller';
import { CustomerPortalUser } from './entities/customer-portal-user.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanStatement } from '../account-management/entities/loan-statement.entity';
import { AccountManagementModule } from '../account-management/account-management.module';
import { NotificationModule } from '../notification/notification.module';
import { CustomerLoanLink } from './entities/customer-loan-link.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { NotificationLog } from '../notification/entities/notification-log.entity';
import { ScheduledPayment } from './entities/scheduled-payment.entity';
import { LoanRepaymentModule } from '../loan-repayment/loan-repayment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerPortalUser,
      Loan,
      LoanRepayment,
      LoanRepaymentSchedule,
      LoanStatement,
      CustomerLoanLink,
      LoanApplication,
      NotificationLog,
      ScheduledPayment,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET') || 'your-secret-key';
        const expiresIn = configService.get<string>('jwt.expiresIn') || configService.get<string>('JWT_EXPIRES_IN') || '24h';
        
        console.log('[CustomerPortalModule] JWT secret loaded:', secret ? (secret.substring(0, 5) + '...') : 'MISSING');
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    AccountManagementModule,
    NotificationModule,
    LoanRepaymentModule,
  ],
  controllers: [CustomerPortalController, CustomerPortalAdminController],
  providers: [CustomerPortalService],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}

