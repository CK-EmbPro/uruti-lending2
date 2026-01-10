import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { EmailService } from './services/email.service';
import { SMSService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { LoanNotificationHelperService } from './services/loan-notification-helper.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

@Module({
  imports: [
    ConfigModule,
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
    TypeOrmModule.forFeature([
      NotificationLog,
      NotificationTemplate,
      NotificationPreference,
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationTemplateService,
    NotificationPreferenceService,
    EmailService,
    SMSService,
    PushNotificationService,
    InAppNotificationService,
    LoanNotificationHelperService,
    NotificationGateway,
  ],
  exports: [
    NotificationService,
    NotificationTemplateService,
    NotificationPreferenceService,
    LoanNotificationHelperService,
    NotificationGateway,
  ],
})
export class NotificationModule {}

