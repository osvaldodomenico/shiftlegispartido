import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { UpdateContributionDto } from './dto/update-contribution.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  // ─── CONTRIBUIÇÕES ─────────────────────────────────────────────────────────

  @Post()
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContributionDto, @CurrentUser() actor: JwtPayload) {
    return this.contributionsService.create(dto, actor);
  }

  @Get()
  @Roles('member', 'admin')
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('person_id') person_id?: string,
  ) {
    return this.contributionsService.findAll(actor.tenantId, page, limit, {
      status,
      person_id: person_id ? parseInt(person_id, 10) : undefined,
    });
  }

  @Get('stats/overdue')
  @Roles('member', 'admin')
  overdueStats(@CurrentUser() actor: JwtPayload) {
    return this.contributionsService.overdueStats(actor.tenantId);
  }

  @Get(':id')
  @Roles('member', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.contributionsService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContributionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.contributionsService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.contributionsService.remove(id, actor);
  }

  // ─── PAGAMENTOS ────────────────────────────────────────────────────────────

  /**
   * Lista cobranças de uma contribuição com paginação.
   * Filtro por status: pending | paid | overdue
   */
  @Get(':id/payments')
  @Roles('member', 'admin')
  findPayments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.contributionsService.findPayments(id, actor.tenantId, page, limit, { status });
  }

  /**
   * Registra pagamento de uma cobrança específica.
   */
  @Post(':id/payments/:paymentId/pay')
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.OK)
  registerPayment(
    @Param('id', ParseIntPipe) id: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.contributionsService.registerPayment(id, paymentId, dto, actor);
  }

  // ─── OPERAÇÕES ADMINISTRATIVAS ─────────────────────────────────────────────

  /**
   * Gera cobranças mensais para o mês de referência informado.
   * Idempotente: pode ser chamado múltiplas vezes sem duplicar cobranças.
   * Parâmetro: reference_month no formato YYYY-MM
   */
  @Post('admin/generate-charges')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  generateMonthlyCharges(
    @Query('reference_month') referenceMonth: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.contributionsService.generateMonthlyCharges(actor.tenantId, referenceMonth, actor);
  }

  /**
   * Marca cobranças vencidas como overdue.
   * Uso: cron job diário.
   */
  @Post('admin/mark-overdue')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  markOverdue(@CurrentUser() actor: JwtPayload) {
    return this.contributionsService.markOverdue(actor.tenantId, actor);
  }
}
