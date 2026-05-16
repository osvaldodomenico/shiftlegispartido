import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles('member', 'admin')
  getCurrent(@CurrentUser() actor: JwtPayload) {
    return this.companyService.getCurrent(actor);
  }

  @Patch()
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.OK)
  updateCurrent(@Body() dto: UpdateCompanyDto, @CurrentUser() actor: JwtPayload) {
    return this.companyService.updateCurrent(dto, actor);
  }
}

