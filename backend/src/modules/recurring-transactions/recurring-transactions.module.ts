import { Module } from '@nestjs/common';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, PrismaService],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
