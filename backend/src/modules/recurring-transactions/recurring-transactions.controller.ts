import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('finance/recurring-transactions')
export class RecurringTransactionsController {
  constructor(private readonly service: RecurringTransactionsService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRecurringTransactionDto, @CurrentUser() actor: JwtPayload) {
    return this.service.create(dto, actor);
  }

  @Get()
  @Roles('member', 'admin')
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('is_active') is_active?: string,
  ) {
    const isActiveFilter =
      is_active === 'true' ? true : is_active === 'false' ? false : undefined;

    return this.service.findAll(actor.tenantId, { is_active: isActiveFilter });
  }

  @Get(':id')
  @Roles('member', 'admin')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.service.findOne(id, actor.tenantId);
  }

  @Post(':id/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.service.deactivate(id, actor);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.service.remove(id, actor);
  }

  /**
   * Gera lançamento para o mês especificado (ou mês corrente se omitido).
   * Idempotente: não duplica para o mesmo mês/ano.
   */
  @Post(':id/run')
  @Roles('member', 'admin')
  @HttpCode(HttpStatus.OK)
  run(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: JwtPayload,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.service.run(id, actor, month, year);
  }
}
