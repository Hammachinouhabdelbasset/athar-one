import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie'],
      genReqId: (request) =>
        (request.headers['x-request-id'] as string | undefined) ?? randomUUID(),
    },
    trustProxy: true,
    requestIdHeader: 'x-request-id',
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();
  app.enableCors({
    origin: [process.env.WEB_URL, process.env.PORTAL_URL].filter(
      (value): value is string => Boolean(value),
    ),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'authorization',
      'content-type',
      'if-match',
      'idempotency-key',
      'x-request-id',
      'x-correlation-id',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApi = new DocumentBuilder()
    .setTitle('ATHAR ONE API')
    .setDescription('Versioned contracts for the ATHAR ONE modular business platform.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApi);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
    swaggerOptions: { persistAuthorization: false },
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
