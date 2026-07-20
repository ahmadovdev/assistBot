import { Module } from '@nestjs/common';
import { ImageLabController } from './image-lab.controller';
import { ImageLabService } from './image-lab.service';

@Module({
  controllers: [ImageLabController],
  providers: [ImageLabService],
})
export class ImageLabModule {}
