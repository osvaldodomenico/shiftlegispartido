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
// CRM modules
import { TagsModule } from './modules/crm/tags/tags.module';
import { PipelineModule } from './modules/crm/pipeline/pipeline.module';
import { InteractionsModule } from './modules/crm/interactions/interactions.module';
import { TasksModule } from './modules/crm/tasks/tasks.module';
import { NotificationsModule } from './modules/crm/notifications/notifications.module';
import { EventsModule } from './modules/crm/events/events.module';
import { DeviceTokensModule } from './modules/crm/device-tokens/device-tokens.module';
import { CrmImportsModule } from './modules/crm/crm-import/crm-import.module';
import { CrmDashboardModule } from './modules/crm/crm-dashboard/crm-dashboard.module';
// Electoral + Party modules
import { ElectionsModule } from './modules/elections/elections.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { PartyModule } from './modules/party/party.module';
import { MandatesModule } from './modules/mandates/mandates.module';
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
  imports: [
    AuthModule,
    UsersModule,
    PeopleModule,
    FinancialModule,
    DocumentsModule,
    ContributionsModule,
    FinancialCategoriesModule,
    CostCentersModule,
    FinancialPeriodClosingsModule,
    RecurringTransactionsModule,
    CompanyModule,
    // CRM
    TagsModule,
    PipelineModule,
    InteractionsModule,
    TasksModule,
    NotificationsModule,
    EventsModule,
    DeviceTokensModule,
    CrmImportsModule,
    CrmDashboardModule,
    // Electoral + Party
    ElectionsModule,
    CampaignsModule,
    PartyModule,
    MandatesModule,
  ],
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
