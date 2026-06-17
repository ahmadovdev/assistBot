import { Module } from '@nestjs/common';
import { PresentationsService } from './presentations.service';

@Module({
  providers: [PresentationsService],
  exports: [PresentationsService],
})
export class PresentationsModule {}
