import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FinancialPeriodClosingsService } from './financial-period-closings.service';
import { ClosePeriodDto, ReopenPeriodDto } from './dto/period-closing.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('finance/period-closings')
export class FinancialPeriodClosingsController {
  constructor(private readonly service: FinancialPeriodClosingsService) {}

  @Get()
  @Roles('member', 'admin')
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.service.findAll(actor.tenantId);
  }

  @Get('status')
  @Roles('member', 'admin')
  findOne(
    @CurrentUser() actor: JwtPayload,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.service.findOne(actor.tenantId, month, year);
  }

  /** Fecha período — bloqueia edições no mês/ano */
  @Post('close')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  close(@Body() dto: ClosePeriodDto, @CurrentUser() actor: JwtPayload) {
    return this.service.close(dto, actor);
  }

  /** Reabre período — reason obrigatório */
  @Post('reopen')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  reopen(@Body() dto: ReopenPeriodDto, @CurrentUser() actor: JwtPayload) {
    return this.service.reopen(dto, actor);
  }
}
