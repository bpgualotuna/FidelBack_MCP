import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const adapter = new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 1500,
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de conexión TCP a PostgreSQL (1.5s)')), 1500),
        ),
      ]);
      this.logger.log('✅ Conectado a PostgreSQL mediante Prisma 7 Adapter (@prisma/adapter-pg).');
    } catch (error) {
      this.logger.warn(
        `⚠️ PostgreSQL no disponible aún (${(error as Error).message}). FidelBack_MCP operará en modo memoria hasta levantar Docker.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
