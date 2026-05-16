import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PeopleModule } from './modules/people/people.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { FinancialCategoriesModule } from './modules/financial-categories/financial-categories.module';
import { CostCentersModule } from './modules/cost-centers/cost-centers.module';
import { FinancialPeriodClosingsModule } from './modules/financial-period-closings/financial-period-closings.module';
import { RecurringTransactionsModule } from './modules/recurring-transactions/recurring-transactions.module';
import { CompanyModule } from './modules/company/company.module';
import { TagsModule } from './modules/crm/tags/tags.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsService } from './common/services/permissions.service';
import { PrismaService } from './database/prisma.service';

/**
 * Guards globais executam na ordem de declaração dos providers:
 * 1. JwtAuthGuard → valida o token e popula request.user
 * 2. RolesGuard   → valida roles/permissions com request.user já disponível
 *
 * Rotas públicas (@Public) são ignoradas por ambos os guards.
 */
@Module({
  imports: [AuthModule, UsersModule, PeopleModule, FinancialModule, DocumentsModule, ContributionsModule, FinancialCategoriesModule, CostCentersModule, FinancialPeriodClosingsModule, RecurringTransactionsModule, CompanyModule, TagsModule],
  providers: [
    PrismaService,
    PermissionsService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
