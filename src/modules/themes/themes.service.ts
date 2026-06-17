import { Injectable } from '@nestjs/common';
import { Theme } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Theme[]> {
    return this.prisma.theme.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findByKey(key: string): Promise<Theme | null> {
    return this.prisma.theme.findUnique({ where: { key } });
  }
}
