import { Module } from '@nestjs/common';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [InteractionsController],
  providers: [InteractionsService, PrismaService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
