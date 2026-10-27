import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './context/config/app.config';

async function bootstrap() {
  const logger = new Logger('FidelBootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);

  const port = configService.get('PORT', { infer: true });
  const frontendUrl = configService.get('FRONTEND_URL', { infer: true });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: frontendUrl ? frontendUrl.split(',').map((o: string) => o.trim()) : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FIDEL v1.3 — Commercial AI Agent & MCP Server API')
    .setDescription(
      'Backend NestJS 11 + Prisma 7 + Model Context Protocol (MCP) para Clear Minds / KrakeDev.',
    )
    .setVersion('1.3.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 FidelBack_MCP corriendo en: http://localhost:${port}/api`);
  logger.log(`📚 Documentación OpenAPI / Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🔌 Servidor MCP (Tools & Resources): http://localhost:${port}/api/mcp/status`);
}

void bootstrap();
