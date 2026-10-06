import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { ImageLabService } from './image-lab.service';
import { imageLabHtml } from './image-lab.html';

@Controller('image-lab')
export class ImageLabController {
  constructor(private readonly imageLab: ImageLabService) {}

  @Get()
  page(@Query('token') token?: string): string {
    this.assertToken(token);
    return imageLabHtml(token ?? '');
  }

  @Get('api/models')
  async models(@Query('token') queryToken?: string, @Headers('x-image-lab-token') headerToken?: string): Promise<unknown> {
    this.assertToken(headerToken ?? queryToken);
    return this.imageLab.listModels();
  }

  @Post('api/generate')
  async generate(
    @Body() body: Record<string, unknown>,
    @Query('token') queryToken?: string,
    @Headers('x-image-lab-token') headerToken?: string,
  ): Promise<unknown> {
    this.assertToken(headerToken ?? queryToken);
    return this.imageLab.generate(body as any);
  }

  private assertToken(token: string | undefined): void {
    if (!this.imageLab.isTokenValid(token)) {
      throw new HttpException('Image lab token is missing or invalid', HttpStatus.UNAUTHORIZED);
    }
  }
}
