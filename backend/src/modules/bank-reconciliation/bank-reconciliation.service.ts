import { Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateStatementDto } from './dto/create-statement.dto';
import { ReconcileStatementDto } from './dto/reconcile-statement.dto';

@Injectable()
export class BankReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private toNumber(value: Decimal | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return +value.toString();
  }

  private formatAccount(acc: any) {
    return {
      id: Number(acc.id),
      tenantId: Number(acc.tenant_id),
      name: acc.name,
      bank_name: acc.bank_name,
      bank_code: acc.bank_code,
      agency: acc.agency,
      account_number: acc.account_number,
      type: acc.type,
      initial_balance: this.toNumber(acc.initial_balance),
      is_active: acc.is_active,
      created_at: acc.created_at,
      updated_at: acc.updated_at,
    };
  }

  private formatStatement(s: any) {
    return {
      id: Number(s.id),
      tenantId: Number(s.tenant_id),
      bank_account_id: Number(s.bank_account_id),
      date: s.date,
      description: s.description,
      amount: this.toNumber(s.amount),
      type: s.type,
      balance_after: s.balance_after !== null ? this.toNumber(s.balance_after) : null,
      is_reconciled: s.is_reconciled,
      transaction_id: s.transaction_id !== null ? Number(s.transaction_id) : null,
      notes: s.notes,
      created_at: s.created_at,
    };
  }

  // ─── Accounts ──────────────────────────────────────────────────────────────

  async listAccounts(tenantId: number) {
    const accounts = await this.prisma.bank_accounts.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
    return { data: accounts.map(this.formatAccount.bind(this)), message: '' };
  }

  async createAccount(dto: CreateBankAccountDto, actor: JwtPayload) {
    const account = await this.prisma.bank_accounts.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        bank_name: dto.bank_name,
        bank_code: dto.bank_code ?? null,
        agency: dto.agency ?? null,
        account_number: dto.account_number,
        type: dto.type,
        initial_balance: dto.initial_balance ?? 0,
      },
    });
    return { data: this.formatAccount(account), message: 'Conta bancária criada com sucesso' };
  }

  async updateAccount(id: number, dto: Partial<CreateBankAccountDto>, actor: JwtPayload) {
    const existing = await this.prisma.bank_accounts.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Conta bancária não encontrada');

    const updated = await this.prisma.bank_accounts.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.bank_name !== undefined && { bank_name: dto.bank_name }),
        ...(dto.bank_code !== undefined && { bank_code: dto.bank_code }),
        ...(dto.agency !== undefined && { agency: dto.agency }),
        ...(dto.account_number !== undefined && { account_number: dto.account_number }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.initial_balance !== undefined && { initial_balance: dto.initial_balance }),
      },
    });
    return { data: this.formatAccount(updated), message: 'Conta bancária atualizada com sucesso' };
  }

  async deleteAccount(id: number, actor: JwtPayload) {
    const existing = await this.prisma.bank_accounts.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Conta bancária não encontrada');

    await this.prisma.bank_accounts.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { data: null, message: 'Conta bancária removida com sucesso' };
  }

  // ─── Statements ────────────────────────────────────────────────────────────

  async listStatements(
    accountId: number,
    tenantId: number,
    filter?: 'pendentes' | 'conciliados' | 'todos',
  ) {
    const account = await this.prisma.bank_accounts.findFirst({
      where: { id: accountId, tenant_id: tenantId, deleted_at: null },
    });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');

    const where: any = { bank_account_id: accountId, tenant_id: tenantId };
    if (filter === 'pendentes') where.is_reconciled = false;
    if (filter === 'conciliados') where.is_reconciled = true;

    const statements = await this.prisma.bank_statements.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Compute summary
    const credits = statements.filter(s => s.type === 'credito').reduce((a, s) => a + this.toNumber(s.amount), 0);
    const debits = statements.filter(s => s.type === 'debito').reduce((a, s) => a + this.toNumber(s.amount), 0);
    const statementBalance = +((this.toNumber(account.initial_balance) + credits - debits).toFixed(2));

    return {
      data: {
        items: statements.map(this.formatStatement.bind(this)),
        summary: {
          total_creditos: +credits.toFixed(2),
          total_debitos: +debits.toFixed(2),
          saldo_extrato: statementBalance,
        },
      },
      message: '',
    };
  }

  async addStatement(accountId: number, dto: CreateStatementDto, actor: JwtPayload) {
    const account = await this.prisma.bank_accounts.findFirst({
      where: { id: accountId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');

    const statement = await this.prisma.bank_statements.create({
      data: {
        tenant_id: actor.tenantId,
        bank_account_id: accountId,
        date: new Date(dto.date),
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        balance_after: dto.balance_after ?? null,
        notes: dto.notes ?? null,
      },
    });
    return { data: this.formatStatement(statement), message: 'Lançamento do extrato adicionado com sucesso' };
  }

  async importStatements(accountId: number, entries: CreateStatementDto[], actor: JwtPayload) {
    const account = await this.prisma.bank_accounts.findFirst({
      where: { id: accountId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');

    const created = await this.prisma.$transaction(
      entries.map(dto =>
        this.prisma.bank_statements.create({
          data: {
            tenant_id: actor.tenantId,
            bank_account_id: accountId,
            date: new Date(dto.date),
            description: dto.description,
            amount: dto.amount,
            type: dto.type,
            balance_after: dto.balance_after ?? null,
            notes: dto.notes ?? null,
          },
        }),
      ),
    );
    return { data: { count: created.length }, message: `${created.length} lançamento(s) importado(s) com sucesso` };
  }

  async reconcileStatement(statementId: number, dto: ReconcileStatementDto, actor: JwtPayload) {
    const statement = await this.prisma.bank_statements.findFirst({
      where: { id: statementId, tenant_id: actor.tenantId },
    });
    if (!statement) throw new NotFoundException('Lançamento do extrato não encontrado');

    // Verify transaction belongs to same tenant
    const tx = await this.prisma.transactions.findFirst({
      where: { id: dto.transaction_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!tx) throw new NotFoundException('Transação não encontrada');

    const updated = await this.prisma.bank_statements.update({
      where: { id: statementId },
      data: { is_reconciled: true, transaction_id: dto.transaction_id },
    });
    return { data: this.formatStatement(updated), message: 'Lançamento conciliado com sucesso' };
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  async getSummary(tenantId: number) {
    const accounts = await this.prisma.bank_accounts.findMany({
      where: { tenant_id: tenantId, deleted_at: null, is_active: true },
    });

    const summaries = await Promise.all(
      accounts.map(async acc => {
        const statements = await this.prisma.bank_statements.findMany({
          where: { bank_account_id: acc.id, tenant_id: tenantId },
          select: { amount: true, type: true },
        });
        const credits = statements.filter(s => s.type === 'credito').reduce((a, s) => a + this.toNumber(s.amount), 0);
        const debits = statements.filter(s => s.type === 'debito').reduce((a, s) => a + this.toNumber(s.amount), 0);
        const current_balance = +((this.toNumber(acc.initial_balance) + credits - debits).toFixed(2));

        return {
          ...this.formatAccount(acc),
          current_balance,
        };
      }),
    );

    const total_balance = summaries.reduce((a, s) => a + s.current_balance, 0);

    return {
      data: {
        accounts: summaries,
        total_balance: +total_balance.toFixed(2),
      },
      message: '',
    };
  }
}
