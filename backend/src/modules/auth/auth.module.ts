import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { UserSeedService } from './user-seed.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret') || configService.get<string>('JWT_SECRET') || 'your-secret-key';
        const expiresIn = configService.get<string>('jwt.expiresIn') || configService.get<string>('JWT_EXPIRES_IN') || '24h';
        
        console.log('JWT Module Configuration:', {
          secret: secret ? '***' : 'MISSING',
          expiresIn,
        });
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserSeedService, JwtAuthGuard],
  exports: [AuthService, UserSeedService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}

