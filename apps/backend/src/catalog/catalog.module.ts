import { Module } from '@nestjs/common';
import {
  AttractionsController,
  CatalogController,
  RestaurantsController,
} from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [
    CatalogController,
    AttractionsController,
    RestaurantsController,
  ],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
