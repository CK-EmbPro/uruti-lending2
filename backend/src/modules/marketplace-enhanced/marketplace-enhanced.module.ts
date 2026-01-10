import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceEnhancedService } from './services/marketplace-enhanced.service';
import { MarketplaceEnhancedController } from './marketplace-enhanced.controller';
import { MarketplaceListing } from './entities/marketplace-listing.entity';
import { P2PListing } from '../p2p-lending/entities/p2p-listing.entity';
import { P2PInvestment } from '../p2p-lending/entities/p2p-investment.entity';

import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceListing,
      P2PListing,
      P2PInvestment,
    ]),
      AuthModule,
],
  controllers: [MarketplaceEnhancedController],
  providers: [MarketplaceEnhancedService],
  exports: [MarketplaceEnhancedService],
})
export class MarketplaceEnhancedModule {}

