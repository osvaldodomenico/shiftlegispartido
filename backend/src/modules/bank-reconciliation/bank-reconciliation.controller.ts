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
import { BankReconciliationService } from './bank-reconciliation.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateStatementDto } from './dto/create-statement.dto';
import { ReconcileStatementDto } from './dto/reconcile-statement.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('bank-reconciliation')
export class BankReconciliationController {
  constructor(private readonly service: BankReconciliationService) {}

  // ─── Accounts ──────────────────────────────────────────────────────────────

  @Get('accounts')
  listAccounts(@CurrentUser() actor: JwtPayload) {
    return this.service.listAccounts(actor.tenantId);
  }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  createAccount(@Body() dto: CreateBankAccountDto, @CurrentUser() actor: JwtPayload) {
    return this.service.createAccount(dto, actor);
  }

  @Patch('accounts/:id')
  updateAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBankAccountDto>,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.updateAccount(id, dto, actor);
  }

  @Delete('accounts/:id')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: JwtPayload) {
    return this.service.deleteAccount(id, actor);
  }

  // ─── Statements ────────────────────────────────────────────────────────────

  @Get('accounts/:id/statements')
  listStatements(
    @Param('id', ParseIntPipe) id: number,
    @Query('filter') filter: 'pendentes' | 'conciliados' | 'todos',
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.listStatements(id, actor.tenantId, filter);
  }

  @Post('accounts/:id/statements')
  @HttpCode(HttpStatus.CREATED)
  addStatement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStatementDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.addStatement(id, dto, actor);
  }

  @Post('accounts/:id/statements/import')
  @HttpCode(HttpStatus.CREATED)
  importStatements(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { entries: CreateStatementDto[] },
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.importStatements(id, body.entries, actor);
  }

  // ─── Reconcile ─────────────────────────────────────────────────────────────

  @Patch('statements/:id/reconcile')
  reconcileStatement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReconcileStatementDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.service.reconcileStatement(id, dto, actor);
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  @Get('summary')
  getSummary(@CurrentUser() actor: JwtPayload) {
    return this.service.getSummary(actor.tenantId);
  }
}
