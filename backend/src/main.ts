import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS for Next.js frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api', { exclude: ['api/health'] });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`⚽ AI Sports OS backend running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
}

bootstrap();
