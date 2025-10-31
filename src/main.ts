import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import * as express from 'express';
import path from 'path';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use('/order/webhook', express.raw({ type: 'application/json' }));
  app.use('./uploads', express.static(path.resolve('./uploads')));
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(port, () => {
    console.log(`server is running on port :::${port}`);
  });
}
bootstrap();
