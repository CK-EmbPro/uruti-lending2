import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ESignatureService } from './services/e-signature.service';
import { ESignatureController } from './e-signature.controller';
import { ESignatureRequest } from './entities/e-signature-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ESignatureRequest])],
  controllers: [ESignatureController],
  providers: [ESignatureService],
  exports: [ESignatureService],
})
export class ESignatureModule {}

