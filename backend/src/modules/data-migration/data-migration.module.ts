import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataMigrationService } from './services/data-migration.service';
import { DataMigrationController } from './data-migration.controller';
import { DataMigration } from './entities/data-migration.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataMigration]),
    AuthModule,
  ],
  controllers: [DataMigrationController],
  providers: [DataMigrationService],
  exports: [DataMigrationService],
})
export class DataMigrationModule {}

