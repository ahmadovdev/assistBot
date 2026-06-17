import { Module } from '@nestjs/common';
import { SlidesService } from './slides.service';

@Module({
  providers: [SlidesService],
  exports: [SlidesService],
})
export class SlidesModule {}
