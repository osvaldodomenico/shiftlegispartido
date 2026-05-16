import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateTransactionDto,
  TransactionStatus,
  TransactionContext,
  TransactionOrigin,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { RejectTransactionDto, CancelTransactionDto, PayTransactionDto } from './dto/transition-transaction.dto';

const TRANSACTION_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  description: true,
  amount: true,
  type: true,
  status: true,
  context: true,
  origin: true,
  campaign_id: true,
  category_id: true,
  cost_center_id: true,
  competency_month: true,
  competency_year: true,
  due_date: true,
  paid_at: true,
  notes: true,
  attachments_count: true,
  created_at: true,
  updated_at: true,
  person: {
    select: { id: true, name: true, email: true },
  },
  category: {
    select: { id: true, name: true, type: true },
  },
  cost_center: {
    select: { id: true, name: true, code: true },
  },
} as const;

/** Threshold acima do qual a transação exige aprovação antes de poder ser paga */
const APPROVAL_THRESHOLD = 5000;

@Injectable()
export class FinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateTransactionDto, actor: JwtPayload) {
    // Validações de integridade
    if (dto.amount <= 0) throw new BadRequestException('O valor deve ser maior que zero');

    if (dto.context === TransactionContext.CAMPANHA && !dto.campaign_id) {
      throw new BadRequestException('campaign_id é obrigatório quando context = campanha');
    }

    if (dto.type === 'expense' && !dto.due_date) {
      throw new BadRequestException('Despesas exigem due_date informado');
    }

    await this.assertPeriodNotClosed(dto.competency_month, dto.competency_year, actor.tenantId);
    await this.assertPersonBelongsToTenant(dto.person_id, actor.tenantId);
    await this.assertCategoryBelongsToTenant(dto.category_id, actor.tenantId);

    if (dto.cost_center_id) {
      await this.assertCostCenterBelongsToTenant(dto.cost_center_id, actor.tenantId);
    }

    const tx = await this.prisma.transactions.create({
      data: {
        tenant_id: actor.tenantId,
        person_id: dto.person_id,
        description: dto.description,
        amount: dto.amount,
        type: dto.type as any,
        status: TransactionStatus.DRAFT as any,
        context: (dto.context ?? TransactionContext.DIRETORIO) as any,
        origin: (dto.origin ?? TransactionOrigin.MANUAL) as any,
        campaign_id: dto.campaign_id ?? null,
        category_id: dto.category_id,
        cost_center_id: dto.cost_center_id ?? null,
        competency_month: dto.competency_month,
        competency_year: dto.competency_year,
        due_date: new Date(dto.due_date),
        paid_at: dto.paid_at ? new Date(dto.paid_at) : null,
        notes: dto.notes ?? null,
        created_by: actor.userId,
      },
      select: TRANSACTION_SELECT,
    });

    // Registra criação no histórico de status
    await this.recordStatusHistory(Number(tx.id), actor.tenantId, null, TransactionStatus.DRAFT, actor.userId, 'Lançamento criado');

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_TRANSACTION',
      entityId: Number(tx.id),
      metadata: { description: tx.description, type: tx.type, amount: tx.amount, context: tx.context },
    });

    return { data: this.format(tx), message: 'Lançamento criado com sucesso' };
  }

  async findAll(
    tenantId: number,
    page = 1,
    limit = 10,
    filters: {
      status?: string;
      type?: string;
      context?: string;
      personId?: number;
      categoryId?: number;
      costCenterId?: number;
      startDate?: string;
      endDate?: string;
      competencyMonth?: number;
      competencyYear?: number;
    } = {},
  ) {
    const where = this.buildWhere(tenantId, filters);

    const [items, total, incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        select: TRANSACTION_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { due_date: 'desc' },
      }),
      this.prisma.transactions.count({ where }),
      this.prisma.transactions.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      this.prisma.transactions.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = this.toNumber(incomeAgg._sum.amount);
    const totalExpense = this.toNumber(expenseAgg._sum.amount);

    return {
      data: {
        items: items.map(this.format),
        pagination: { page, limit, total },
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          balance: +(totalIncome - totalExpense).toFixed(2),
        },
      },
      message: '',
    };
  }

  async findOne(id: number, tenantId: number) {
    const tx = await this.prisma.transactions.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: {
        ...TRANSACTION_SELECT,
        status_history: {
          select: {
            id: true, from_status: true, to_status: true, changed_by: true, reason: true, created_at: true,
          },
          orderBy: { created_at: 'asc' },
        },
        approvals: {
          select: {
            id: true, step_order: true, required_role: true, status: true, acted_by: true, reason: true, acted_at: true,
          },
          orderBy: { step_order: 'asc' },
        },
      },
    });

    if (!tx) throw new NotFoundException('Lançamento não encontrado');
    return { data: this.formatDetailed(tx), message: '' };
  }

  async update(id: number, dto: UpdateTransactionDto, actor: JwtPayload) {
    const existing = await this.prisma.transactions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Lançamento não encontrado');

    // Apenas draft e pending_approval podem ser editados
    const editableStatuses = ['draft', 'pending_approval'];
    if (!editableStatuses.includes(existing.status)) {
      throw new ForbiddenException(
        `Lançamento com status "${existing.status}" não pode ser editado. Use os endpoints de transição de status.`,
      );
    }

    // Verifica período de competência (atual ou novo, se alterado)
    const month = dto.competency_month ?? existing.competency_month;
    const year = dto.competency_year ?? existing.competency_year;
    await this.assertPeriodNotClosed(month, year, actor.tenantId);

    if (dto.person_id !== undefined) {
      await this.assertPersonBelongsToTenant(dto.person_id, actor.tenantId);
    }
    if (dto.category_id !== undefined) {
      await this.assertCategoryBelongsToTenant(dto.category_id, actor.tenantId);
    }
    if (dto.cost_center_id !== undefined) {
      await this.assertCostCenterBelongsToTenant(dto.cost_center_id, actor.tenantId);
    }

    const updateData: Record<string, any> = {};
    const fields = [
      'description', 'amount', 'type', 'context', 'campaign_id',
      'category_id', 'cost_center_id', 'competency_month', 'competency_year', 'notes', 'person_id',
    ] as const;
    for (const f of fields) {
      if ((dto as any)[f] !== undefined) updateData[f] = (dto as any)[f];
    }
    if (dto.due_date !== undefined) updateData.due_date = new Date(dto.due_date);

    const { count } = await this.prisma.transactions.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });
    if (count === 0) throw new NotFoundException('Lançamento não encontrado ou já excluído');

    const updated = await this.prisma.transactions.findFirst({
      where: { id },
      select: TRANSACTION_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_TRANSACTION',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: this.format(updated!), message: 'Lançamento atualizado com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.transactions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Lançamento não encontrado');

    // Apenas admin pode remover transações não-draft
    if (existing.status !== 'draft') {
      const dbRoles = await this.permissionsService.getActiveRolesForUser(actor.userId, actor.tenantId);
      if (!dbRoles.includes('admin')) {
        throw new ForbiddenException('Apenas admin pode remover lançamentos fora do status draft');
      }
    }

    await this.assertPeriodNotClosed(existing.competency_month, existing.competency_year, actor.tenantId);

    await this.prisma.transactions.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_TRANSACTION',
      entityId: id,
      metadata: { description: existing.description, type: existing.type },
    });

    return { data: null, message: 'Lançamento removido com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSIÇÕES DE STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Submete para aprovação (draft → pending_approval).
   * Transações acima do threshold geram registro de approval step.
   */
  async submit(id: number, actor: JwtPayload) {
    const tx = await this.findAndValidate(id, actor.tenantId);
    if (tx.status !== 'draft') {
      throw new ConflictException(`Status atual "${tx.status}" não permite submissão`);
    }

    await this.prisma.transactions.update({
      where: { id },
      data: { status: TransactionStatus.PENDING_APPROVAL as any },
    });

    // Cria step de aprovação se valor acima do threshold
    if (this.toNumber(tx.amount) >= APPROVAL_THRESHOLD) {
      await this.prisma.transaction_approvals.create({
        data: {
          transaction_id: id,
          tenant_id: actor.tenantId,
          step_order: 1,
          required_role: 'admin',
          status: 'pending' as any,
        },
      });
    }

    await this.recordStatusHistory(id, actor.tenantId, 'draft', TransactionStatus.PENDING_APPROVAL, actor.userId);
    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'SUBMIT_TRANSACTION', entityId: id, metadata: {} });

    return { data: null, message: 'Lançamento submetido para aprovação' };
  }

  /**
   * Aprova (pending_approval → approved).
   * Exige role admin validada no banco.
   */
  async approve(id: number, actor: JwtPayload, reason?: string) {
    const dbRoles = await this.permissionsService.getActiveRolesForUser(actor.userId, actor.tenantId);
    if (!dbRoles.includes('admin')) {
      throw new ForbiddenException('Apenas admin pode aprovar lançamentos');
    }

    const tx = await this.findAndValidate(id, actor.tenantId);
    if (tx.status !== 'pending_approval') {
      throw new ConflictException(`Status atual "${tx.status}" não permite aprovação`);
    }

    // Atualiza step de approval pendente
    await this.prisma.transaction_approvals.updateMany({
      where: { transaction_id: id, status: 'pending' as any },
      data: {
        status: 'approved' as any,
        acted_by: actor.userId,
        reason: reason ?? null,
        acted_at: new Date(),
      },
    });

    await this.prisma.transactions.update({
      where: { id },
      data: { status: TransactionStatus.APPROVED as any },
    });

    await this.recordStatusHistory(id, actor.tenantId, 'pending_approval', TransactionStatus.APPROVED, actor.userId, reason);
    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'APPROVE_TRANSACTION', entityId: id, metadata: { reason } });

    return { data: null, message: 'Lançamento aprovado com sucesso' };
  }

  /**
   * Rejeita (pending_approval → draft).
   * Reason obrigatório.
   */
  async reject(id: number, actor: JwtPayload, dto: RejectTransactionDto) {
    const dbRoles = await this.permissionsService.getActiveRolesForUser(actor.userId, actor.tenantId);
    if (!dbRoles.includes('admin')) {
      throw new ForbiddenException('Apenas admin pode rejeitar lançamentos');
    }

    const tx = await this.findAndValidate(id, actor.tenantId);
    if (tx.status !== 'pending_approval') {
      throw new ConflictException(`Status atual "${tx.status}" não permite rejeição`);
    }

    await this.prisma.transaction_approvals.updateMany({
      where: { transaction_id: id, status: 'pending' as any },
      data: {
        status: 'rejected' as any,
        acted_by: actor.userId,
        reason: dto.reason,
        acted_at: new Date(),
      },
    });

    await this.prisma.transactions.update({
      where: { id },
      data: { status: TransactionStatus.DRAFT as any },
    });

    await this.recordStatusHistory(id, actor.tenantId, 'pending_approval', TransactionStatus.DRAFT, actor.userId, dto.reason);
    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'REJECT_TRANSACTION', entityId: id, metadata: { reason: dto.reason } });

    return { data: null, message: 'Lançamento rejeitado e retornado para draft' };
  }

  /**
   * Registra pagamento (approved | overdue → paid).
   * Verifica período de competência antes de pagar.
   */
  async pay(id: number, actor: JwtPayload, dto: PayTransactionDto) {
    const tx = await this.findAndValidate(id, actor.tenantId);
    if (!['approved', 'overdue'].includes(tx.status)) {
      throw new ConflictException(
        `Status atual "${tx.status}" não permite registro de pagamento. Transação deve estar aprovada.`,
      );
    }

    await this.assertPeriodNotClosed(tx.competency_month, tx.competency_year, actor.tenantId);

    const paidAt = dto.paid_at ? new Date(dto.paid_at) : new Date();

    await this.prisma.transactions.update({
      where: { id },
      data: { status: TransactionStatus.PAID as any, paid_at: paidAt },
    });

    await this.recordStatusHistory(id, actor.tenantId, tx.status as string, TransactionStatus.PAID, actor.userId);
    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'PAY_TRANSACTION', entityId: id, metadata: { paid_at: paidAt } });

    return { data: null, message: 'Pagamento registrado com sucesso' };
  }

  /**
   * Cancela (qualquer status editável → cancelled).
   * Reason obrigatório. Não cancela transações pagas.
   */
  async cancel(id: number, actor: JwtPayload, dto: CancelTransactionDto) {
    const tx = await this.findAndValidate(id, actor.tenantId);

    if (tx.status === 'paid') {
      throw new ConflictException('Lançamentos pagos não podem ser cancelados. Contate o admin.');
    }
    if (tx.status === 'cancelled') {
      throw new ConflictException('Lançamento já está cancelado');
    }

    const prevStatus = tx.status;
    await this.prisma.transactions.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED as any },
    });

    await this.recordStatusHistory(id, actor.tenantId, prevStatus as string, TransactionStatus.CANCELLED, actor.userId, dto.reason);
    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'CANCEL_TRANSACTION', entityId: id, metadata: { reason: dto.reason } });

    return { data: null, message: 'Lançamento cancelado com sucesso' };
  }

  /**
   * Marca lançamentos aprovados/vencidos sem pagamento como overdue.
   * Isolado — chamado via cron ou endpoint admin.
   */
  async markOverdue(tenantId: number): Promise<{ updated: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await this.prisma.transactions.updateMany({
      where: {
        tenant_id: tenantId,
        status: 'approved' as any,
        due_date: { lt: today },
        deleted_at: null,
      },
      data: { status: 'overdue' as any },
    });

    return { updated: count };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  private async findAndValidate(id: number, tenantId: number) {
    const tx = await this.prisma.transactions.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: { id: true, status: true, amount: true, competency_month: true, competency_year: true },
    });
    if (!tx) throw new NotFoundException('Lançamento não encontrado');
    return tx;
  }

  /**
   * Bloqueia operação se a competência (mês/ano) está com período fechado.
   */
  async assertPeriodNotClosed(month: number, year: number, tenantId: number): Promise<void> {
    const closed = await this.prisma.financial_period_closings.findFirst({
      where: { tenant_id: tenantId, month, year, status: 'closed' as any },
      select: { id: true },
    });
    if (closed) {
      throw new ForbiddenException(
        `O período ${String(month).padStart(2, '0')}/${year} está fechado. Reabra o período antes de operar.`,
      );
    }
  }

  private async assertPersonBelongsToTenant(personId: number, tenantId: number) {
    const person = await this.prisma.people.findFirst({
      where: { id: personId, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa não encontrada neste tenant');
  }

  private async assertCategoryBelongsToTenant(categoryId: number, tenantId: number) {
    const category = await this.prisma.financial_categories.findFirst({
      where: { id: categoryId, tenant_id: tenantId, deleted_at: null, is_active: true },
      select: { id: true },
    });
    if (!category) throw new BadRequestException('Categoria financeira não encontrada ou inativa');
  }

  private async assertCostCenterBelongsToTenant(costCenterId: number, tenantId: number) {
    const cc = await this.prisma.cost_centers.findFirst({
      where: { id: costCenterId, tenant_id: tenantId, deleted_at: null, is_active: true },
      select: { id: true },
    });
    if (!cc) throw new BadRequestException('Centro de custo não encontrado ou inativo');
  }

  private async recordStatusHistory(
    transactionId: number,
    tenantId: number,
    fromStatus: string | null,
    toStatus: string,
    changedBy: number,
    reason?: string,
  ) {
    await this.prisma.transaction_status_history.create({
      data: {
        transaction_id: transactionId,
        tenant_id: tenantId,
        from_status: fromStatus as any,
        to_status: toStatus as any,
        changed_by: changedBy,
        reason: reason ?? null,
      },
    });
  }

  private buildWhere(tenantId: number, filters: {
    status?: string;
    type?: string;
    context?: string;
    personId?: number;
    categoryId?: number;
    costCenterId?: number;
    startDate?: string;
    endDate?: string;
    competencyMonth?: number;
    competencyYear?: number;
  }) {
    const where: Record<string, any> = { tenant_id: tenantId, deleted_at: null };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.context) where.context = filters.context;
    if (filters.personId) where.person_id = filters.personId;
    if (filters.categoryId) where.category_id = filters.categoryId;
    if (filters.costCenterId) where.cost_center_id = filters.costCenterId;
    if (filters.competencyMonth) where.competency_month = filters.competencyMonth;
    if (filters.competencyYear) where.competency_year = filters.competencyYear;

    if (filters.startDate || filters.endDate) {
      where.due_date = {};
      if (filters.startDate) where.due_date.gte = new Date(filters.startDate);
      if (filters.endDate) where.due_date.lte = new Date(filters.endDate);
    }

    return where;
  }

  private format(tx: any) {
    return {
      id: Number(tx.id),
      tenantId: Number(tx.tenant_id),
      personId: Number(tx.person_id),
      person: tx.person ? { id: Number(tx.person.id), name: tx.person.name, email: tx.person.email } : null,
      description: tx.description,
      amount: this.toNumber(tx.amount),
      type: tx.type,
      status: tx.status,
      context: tx.context,
      origin: tx.origin,
      campaignId: tx.campaign_id !== null ? Number(tx.campaign_id) : null,
      categoryId: Number(tx.category_id),
      category: tx.category ? { id: Number(tx.category.id), name: tx.category.name, type: tx.category.type } : null,
      costCenterId: tx.cost_center_id !== null ? Number(tx.cost_center_id) : null,
      costCenter: tx.cost_center ? { id: Number(tx.cost_center.id), name: tx.cost_center.name, code: tx.cost_center.code } : null,
      competencyMonth: tx.competency_month,
      competencyYear: tx.competency_year,
      dueDate: tx.due_date,
      paidAt: tx.paid_at,
      notes: tx.notes,
      attachmentsCount: tx.attachments_count,
      createdAt: tx.created_at,
      updatedAt: tx.updated_at,
    };
  }

  private formatDetailed(tx: any) {
    return {
      ...this.format(tx),
      statusHistory: (tx.status_history ?? []).map((h: any) => ({
        id: Number(h.id),
        fromStatus: h.from_status,
        toStatus: h.to_status,
        changedBy: Number(h.changed_by),
        reason: h.reason,
        createdAt: h.created_at,
      })),
      approvals: (tx.approvals ?? []).map((a: any) => ({
        id: Number(a.id),
        stepOrder: a.step_order,
        requiredRole: a.required_role,
        status: a.status,
        actedBy: a.acted_by !== null ? Number(a.acted_by) : null,
        reason: a.reason,
        actedAt: a.acted_at,
      })),
    };
  }

  private toNumber(value: Decimal | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return +value.toString();
  }

  private async audit(params: {
    tenantId: number;
    userId: number;
    action: string;
    entityId: number;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: 'transactions',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}
