import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { RejectTransactionDto, CancelTransactionDto, PayTransactionDto, TransitionReasonDto } from './dto/transition-transaction.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('finance/transactions')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTransactionDto, @CurrentUser() actor: JwtPayload) {
    return this.financialService.create(dto, actor);
  }

  /**
   * Filtros disponíveis:
   *   ?status=draft|pending_approval|approved|paid|overdue|cancelled
   *   ?type=income|expense
   *   ?context=diretorio|partidario|campanha
   *   ?person_id=1
   *   ?category_id=1
   *   ?cost_center_id=1
   *   ?start_date=2026-01-01&end_date=2026-12-31
   *   ?competency_month=4&competency_year=2026
   */
  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('context') context?: string,
    @Query('person_id', new ParseIntPipe({ optional: true })) personId?: number,
    @Query('category_id', new ParseIntPipe({ optional: true })) categoryId?: number,
    @Query('cost_center_id', new ParseIntPipe({ optional: true })) costCenterId?: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('competency_month', new ParseIntPipe({ optional: true })) competencyMonth?: number,
    @Query('competency_year', new ParseIntPipe({ optional: true })) competencyYear?: number,
  ) {
    return this.financialService.findAll(actor.tenantId, page, limit, {
      status, type, context, personId, categoryId, costCenterId, startDate, endDate,
      competencyMonth, competencyYear,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.financialService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.financialService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.financialService.remove(id, actor);
  }

  // ─── TRANSIÇÕES DE STATUS ──────────────────────────────────────────────────

  /** draft → pending_approval */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.financialService.submit(id, actor);
  }

  /** pending_approval → approved (admin only, validado no DB) */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransitionReasonDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.financialService.approve(id, actor, dto.reason);
  }

  /** pending_approval → draft (admin only, reason obrigatório) */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransactionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.financialService.reject(id, actor, dto);
  }

  /** approved | overdue → paid */
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  pay(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayTransactionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.financialService.pay(id, actor, dto);
  }

  /** any → cancelled (reason obrigatório, paid não pode ser cancelado) */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelTransactionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.financialService.cancel(id, actor, dto);
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  /** Marca approved vencidos como overdue — para cron ou uso manual */
  @Post('admin/mark-overdue')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  markOverdue(@CurrentUser() actor: JwtPayload) {
    return this.financialService.markOverdue(actor.tenantId);
  }
}
