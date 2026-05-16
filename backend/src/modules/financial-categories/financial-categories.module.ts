import { Module } from '@nestjs/common';
import { FinancialCategoriesController } from './financial-categories.controller';
import { FinancialCategoriesService } from './financial-categories.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [FinancialCategoriesController],
  providers: [FinancialCategoriesService, PrismaService],
  exports: [FinancialCategoriesService],
})
export class FinancialCategoriesModule {}
