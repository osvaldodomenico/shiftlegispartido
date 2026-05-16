import { Module } from '@nestjs/common';
import { FinancialPeriodClosingsController } from './financial-period-closings.controller';
import { FinancialPeriodClosingsService } from './financial-period-closings.service';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [FinancialPeriodClosingsController],
  providers: [FinancialPeriodClosingsService, PrismaService, PermissionsService],
  exports: [FinancialPeriodClosingsService],
})
export class FinancialPeriodClosingsModule {}
