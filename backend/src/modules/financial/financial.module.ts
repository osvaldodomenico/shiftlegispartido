import { Module } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [FinancialController],
  providers: [FinancialService, PrismaService, PermissionsService],
  exports: [FinancialService],
})
export class FinancialModule {}
