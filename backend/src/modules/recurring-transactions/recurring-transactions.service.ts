import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { TransactionContext, TransactionOrigin } from '../financial/dto/create-transaction.dto';

const RECURRING_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  description: true,
  amount: true,
  type: true,
  context: true,
  category_id: true,
  cost_center_id: true,
  campaign_id: true,
  day_of_month: true,
  start_month: true,
  start_year: true,
  end_month: true,
  end_year: true,
  is_active: true,
  notes: true,
  created_at: true,
  updated_at: true,
  person: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  cost_center: { select: { id: true, name: true, code: true } },
} as const;

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecurringTransactionDto, actor: JwtPayload) {
    await this.assertPersonBelongsToTenant(dto.person_id, actor.tenantId);
    await this.assertCategoryBelongsToTenant(dto.category_id, actor.tenantId);

    if (dto.cost_center_id) {
      await this.assertCostCenterBelongsToTenant(dto.cost_center_id, actor.tenantId);
    }

    const rec = await this.prisma.recurring_transactions.create({
      data: {
        tenant_id: actor.tenantId,
        person_id: dto.person_id,
        description: dto.description,
        amount: dto.amount,
        type: dto.type as any,
        context: (dto.context ?? TransactionContext.DIRETORIO) as any,
        category_id: dto.category_id,
        cost_center_id: dto.cost_center_id ?? null,
        campaign_id: dto.campaign_id ?? null,
        day_of_month: dto.day_of_month,
        start_month: dto.start_month,
        start_year: dto.start_year,
        end_month: dto.end_month ?? null,
        end_year: dto.end_year ?? null,
        is_active: true,
        notes: dto.notes ?? null,
        created_by: actor.userId,
      },
      select: RECURRING_SELECT,
    });

    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'CREATE_RECURRING_TRANSACTION', entityId: Number(rec.id), metadata: { description: rec.description } });

    return { data: this.format(rec), message: 'Lançamento recorrente criado com sucesso' };
  }

  async findAll(tenantId: number, filters: { is_active?: boolean } = {}) {
    const where: Record<string, any> = { tenant_id: tenantId, deleted_at: null };
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    const items = await this.prisma.recurring_transactions.findMany({
      where,
      select: RECURRING_SELECT,
      orderBy: { created_at: 'desc' },
    });

    return { data: { items: items.map(this.format) }, message: '' };
  }

  async findOne(id: number, tenantId: number) {
    const rec = await this.prisma.recurring_transactions.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: RECURRING_SELECT,
    });
    if (!rec) throw new NotFoundException('Lançamento recorrente não encontrado');

    return { data: this.format(rec), message: '' };
  }

  async deactivate(id: number, actor: JwtPayload) {
    const existing = await this.prisma.recurring_transactions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Lançamento recorrente não encontrado');

    await this.prisma.recurring_transactions.updateMany({
      where: { id, tenant_id: actor.tenantId },
      data: { is_active: false },
    });

    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'DEACTIVATE_RECURRING_TRANSACTION', entityId: id, metadata: {} });

    return { data: null, message: 'Lançamento recorrente desativado com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.recurring_transactions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Lançamento recorrente não encontrado');

    await this.prisma.recurring_transactions.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });

    await this.audit({ tenantId: actor.tenantId, userId: actor.userId, action: 'DELETE_RECURRING_TRANSACTION', entityId: id, metadata: {} });

    return { data: null, message: 'Lançamento recorrente removido com sucesso' };
  }

  /**
   * Gera o lançamento do mês corrente para um template recorrente.
   *
   * Idempotente: verifica se já existe transação gerada para esse template
   * no mesmo mês de competência (via recurring_transaction_id + competency).
   *
   * O lançamento gerado começa em status 'draft' — fluxo de aprovação segue
   * as mesmas regras do módulo financial.
   */
  async run(id: number, actor: JwtPayload, targetMonth?: number, targetYear?: number) {
    const rec = await this.prisma.recurring_transactions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null, is_active: true },
      select: {
        id: true, person_id: true, description: true, amount: true, type: true,
        context: true, category_id: true, cost_center_id: true, campaign_id: true,
        day_of_month: true, start_month: true, start_year: true,
        end_month: true, end_year: true,
      },
    });
    if (!rec) throw new NotFoundException('Lançamento recorrente não encontrado ou inativo');

    const now = new Date();
    const month = targetMonth ?? now.getMonth() + 1;
    const year = targetYear ?? now.getFullYear();

    // Verifica se está dentro do intervalo de vigência
    const startOk = year > rec.start_year || (year === rec.start_year && month >= rec.start_month);
    if (!startOk) throw new BadRequestException('Mês/ano anterior ao início da recorrência');

    if (rec.end_month && rec.end_year) {
      const endOk = year < rec.end_year || (year === rec.end_year && month <= rec.end_month);
      if (!endOk) throw new BadRequestException('Mês/ano posterior ao término da recorrência');
    }

    // Idempotência: evita gerar duplicata
    const already = await this.prisma.transactions.findFirst({
      where: {
        tenant_id: actor.tenantId,
        recurring_transaction_id: id,
        competency_month: month,
        competency_year: year,
        deleted_at: null,
      },
      select: { id: true },
    });
    if (already) {
      throw new ConflictException(`Lançamento já gerado para ${String(month).padStart(2, '0')}/${year}`);
    }

    const dueDate = new Date(year, month - 1, rec.day_of_month);

    const tx = await this.prisma.transactions.create({
      data: {
        tenant_id: actor.tenantId,
        person_id: rec.person_id,
        description: rec.description,
        amount: rec.amount,
        type: rec.type as any,
        status: 'draft' as any,
        context: rec.context as any,
        origin: TransactionOrigin.RECURRING as any,
        category_id: rec.category_id,
        cost_center_id: rec.cost_center_id ?? null,
        campaign_id: rec.campaign_id ?? null,
        competency_month: month,
        competency_year: year,
        due_date: dueDate,
        recurring_transaction_id: id,
        created_by: actor.userId,
      },
      select: { id: true, description: true, amount: true, due_date: true, status: true },
    });

    // Registra no histórico de status
    await this.prisma.transaction_status_history.create({
      data: {
        transaction_id: Number(tx.id),
        tenant_id: actor.tenantId,
        from_status: null,
        to_status: 'draft' as any,
        changed_by: actor.userId,
        reason: `Gerado por recorrência #${id}`,
      },
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'RUN_RECURRING_TRANSACTION',
      entityId: id,
      metadata: { generated_transaction_id: Number(tx.id), month, year },
    });

    return {
      data: {
        transactionId: Number(tx.id),
        description: tx.description,
        amount: tx.amount,
        dueDate: tx.due_date,
        status: tx.status,
      },
      message: `Lançamento gerado para ${String(month).padStart(2, '0')}/${year}`,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  private async assertPersonBelongsToTenant(personId: number, tenantId: number) {
    const p = await this.prisma.people.findFirst({
      where: { id: personId, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!p) throw new BadRequestException('Pessoa não encontrada neste tenant');
  }

  private async assertCategoryBelongsToTenant(categoryId: number, tenantId: number) {
    const c = await this.prisma.financial_categories.findFirst({
      where: { id: categoryId, tenant_id: tenantId, deleted_at: null, is_active: true },
      select: { id: true },
    });
    if (!c) throw new BadRequestException('Categoria financeira não encontrada ou inativa');
  }

  private async assertCostCenterBelongsToTenant(costCenterId: number, tenantId: number) {
    const cc = await this.prisma.cost_centers.findFirst({
      where: { id: costCenterId, tenant_id: tenantId, deleted_at: null, is_active: true },
      select: { id: true },
    });
    if (!cc) throw new BadRequestException('Centro de custo não encontrado ou inativo');
  }

  private format(r: any) {
    return {
      id: Number(r.id),
      tenantId: Number(r.tenant_id),
      personId: Number(r.person_id),
      person: r.person ? { id: Number(r.person.id), name: r.person.name } : null,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      context: r.context,
      categoryId: Number(r.category_id),
      category: r.category ? { id: Number(r.category.id), name: r.category.name } : null,
      costCenterId: r.cost_center_id !== null ? Number(r.cost_center_id) : null,
      costCenter: r.cost_center ? { id: Number(r.cost_center.id), name: r.cost_center.name, code: r.cost_center.code } : null,
      campaignId: r.campaign_id !== null ? Number(r.campaign_id) : null,
      dayOfMonth: r.day_of_month,
      startMonth: r.start_month,
      startYear: r.start_year,
      endMonth: r.end_month,
      endYear: r.end_year,
      isActive: r.is_active,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
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
        entity: 'recurring_transactions',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}
