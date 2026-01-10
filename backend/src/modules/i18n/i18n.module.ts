import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nService } from './services/i18n.service';
import { I18nController } from './i18n.controller';
import { LanguagePreference } from './entities/language-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LanguagePreference])],
  controllers: [I18nController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}

