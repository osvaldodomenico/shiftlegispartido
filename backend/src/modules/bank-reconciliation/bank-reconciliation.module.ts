import { Module } from '@nestjs/common';
import { BankReconciliationService } from './bank-reconciliation.service';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [BankReconciliationController],
  providers: [BankReconciliationService, PrismaService],
  exports: [BankReconciliationService],
})
export class BankReconciliationModule {}
