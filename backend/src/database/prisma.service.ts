// Para testes e2e, o runner deve definir DATABASE_URL com o valor de TEST_DATABASE_URL
// antes de iniciar a aplicação (ex: via cross-env ou diretamente no jest.setup).
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
