import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Transcripts of long recordings go well past the default 100kb.
  app.useBodyParser('json', { limit: '5mb' });

  app.enableCors({
    // Only the whisper UI may call the API from a browser.
    origin: process.env.UI_URL ?? false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3199, process.env.HOST ?? '127.0.0.1');
}
void bootstrap();
