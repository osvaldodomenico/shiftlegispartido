import { Module } from '@nestjs/common';
import { CrmDashboardController } from './crm-dashboard.controller';
import { CrmDashboardService } from './crm-dashboard.service';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [CrmDashboardController],
  providers: [CrmDashboardService, PrismaService],
  exports: [CrmDashboardService],
})
export class CrmDashboardModule {}
