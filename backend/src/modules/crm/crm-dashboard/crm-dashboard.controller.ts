import { Controller, Get } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/dashboard')
export class CrmDashboardController {
  constructor(private readonly crmDashboardService: CrmDashboardService) {}

  @Get()
  getDashboard(@CurrentUser() actor: JwtPayload) {
    return this.crmDashboardService.getDashboard(actor.tenantId);
  }
}
