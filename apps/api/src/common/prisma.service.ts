import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readProjectDatabaseUrl() {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return process.env.DATABASE_URL;

  const envFile = readFileSync(envPath, 'utf8');
  const line = envFile.split(/\r?\n/).find((entry) => entry.trim().startsWith('DATABASE_URL='));
  const databaseUrl = line?.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '') ?? process.env.DATABASE_URL;
  return databaseUrl?.replace('encrypt=false', 'encrypt=DANGER_PLAINTEXT');
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: readProjectDatabaseUrl()
        }
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
