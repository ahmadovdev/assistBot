import { Module } from '@nestjs/common';
import { ThemesService } from './themes.service';

@Module({
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
