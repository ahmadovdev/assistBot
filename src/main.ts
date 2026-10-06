import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { appRole } from './common/config/role';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter());
  // Translate SIGINT/SIGTERM into Nest lifecycle hooks so BullMQ workers and
  // the bot shut down gracefully (in-flight jobs finish) instead of being
  // killed mid-work and orphaned.
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const role = appRole();
  // bot + worker can run on the same host — offset the worker's health port
  // so they don't collide on the same TCP port.
  const basePort = config.get<number>('app.port') ?? 3000;
  const port = role === 'worker' ? basePort + 1 : basePort;
  const host = role === 'worker' ? '127.0.0.1' : '0.0.0.0';

  await app.listen(port, host);
  app.get(Logger).log(`Application running (role=${role}) on http://${host}:${port}`);
}

void bootstrap();
