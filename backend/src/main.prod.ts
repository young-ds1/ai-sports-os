// Production entry point — uses ts-node transpile-only.
// For <100 users, this is faster to deploy than wrestling with nest build + rootDir.

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://ai-sports-os.vercel.app',
    ].filter(Boolean),
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`⚽ AI Sports OS API running on port ${port}`);
  logger.log(`📊 Health: http://localhost:${port}/api/health`);
}

bootstrap();
