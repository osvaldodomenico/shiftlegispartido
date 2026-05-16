import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateContributionDto, ContributionFrequency } from './dto/create-contribution.dto';
import { UpdateContributionDto, ContributionStatus } from './dto/update-contribution.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

const CONTRIBUTION_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  amount: true,
  frequency: true,
  status: true,
  start_date: true,
  end_date: true,
  notes: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  person: {
    select: { id: true, name: true, email: true, type: true },
  },
} as const;

const PAYMENT_SELECT = {
  id: true,
  contribution_id: true,
  tenant_id: true,
  reference_month: true,
  amount: true,
  amount_paid: true,
  status: true,
  due_date: true,
  paid_at: true,
  payment_method: true,
  notes: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class ContributionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTRIBUIÇÕES (RECORRÊNCIAS)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Cria a recorrência e gera a primeira cobrança automaticamente.
   *
   * Regra: uma pessoa não pode ter duas recorrências ativas simultaneamente
   * (previne duplicidade de cobrança).
   */
  async create(dto: CreateContributionDto, actor: JwtPayload) {
    await this.assertPersonBelongsToTenant(dto.person_id, actor.tenantId);
    await this.assertNoActiveContribution(dto.person_id, actor.tenantId);

    const contribution = await this.prisma.$transaction(async (tx) => {
      const c = await tx.contributions.create({
        data: {
          tenant_id: actor.tenantId,
          person_id: dto.person_id,
          amount: dto.amount,
          frequency: dto.frequency as any,
          status: 'active' as any,
          start_date: new Date(dto.start_date),
          end_date: dto.end_date ? new Date(dto.end_date) : null,
          notes: dto.notes ?? null,
          created_by: actor.userId,
        },
        select: CONTRIBUTION_SELECT,
      });

      // Gera a primeira cobrança automaticamente no mês de início
      const startDate = new Date(dto.start_date);
      const referenceMonth = this.formatReferenceMonth(startDate);
      const dueDate = this.calculateDueDate(startDate, dto.frequency);

      await tx.contribution_payments.create({
        data: {
          contribution_id: Number(c.id),
          tenant_id: actor.tenantId,
          reference_month: referenceMonth,
          amount: dto.amount,
          status: 'pending' as any,
          due_date: dueDate,
          created_by: actor.userId,
        },
      });

      return c;
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_CONTRIBUTION',
      entityId: Number(contribution.id),
      metadata: {
        person_id: dto.person_id,
        amount: dto.amount,
        frequency: dto.frequency,
      },
    });

    return { data: this.format(contribution), message: 'Contribuição criada com sucesso' };
  }

  async findAll(
    tenantId: number,
    page = 1,
    limit = 10,
    filters: { status?: string; person_id?: number } = {},
  ) {
    const where: Record<string, any> = { tenant_id: tenantId, deleted_at: null };
    if (filters.status) where.status = filters.status;
    if (filters.person_id) where.person_id = filters.person_id;

    const [items, total] = await Promise.all([
      this.prisma.contributions.findMany({
        where,
        select: CONTRIBUTION_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.contributions.count({ where }),
    ]);

    return {
      data: { items: items.map(this.format), pagination: { page, limit, total } },
      message: '',
    };
  }

  async findOne(id: number, tenantId: number) {
    const c = await this.prisma.contributions.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: CONTRIBUTION_SELECT,
    });
    if (!c) throw new NotFoundException('Contribuição não encontrada');
    return { data: this.format(c), message: '' };
  }

  async update(id: number, dto: UpdateContributionDto, actor: JwtPayload) {
    const existing = await this.prisma.contributions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException('Contribuição não encontrada');

    // Não permite reativar contribuição cancelada (deve criar nova)
    if (existing.status === 'cancelled' && dto.status && dto.status !== ContributionStatus.CANCELLED) {
      throw new BadRequestException(
        'Contribuição cancelada não pode ser reativada. Crie uma nova contribuição.',
      );
    }

    const { count } = await this.prisma.contributions.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.end_date !== undefined && { end_date: new Date(dto.end_date) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
    if (count === 0) throw new NotFoundException('Contribuição não encontrada');

    const updated = await this.prisma.contributions.findFirst({
      where: { id },
      select: CONTRIBUTION_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_CONTRIBUTION',
      entityId: id,
      metadata: dto,
    });

    return { data: this.format(updated!), message: 'Contribuição atualizada com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.contributions.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Contribuição não encontrada');

    await this.prisma.contributions.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date(), status: 'cancelled' as any },
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_CONTRIBUTION',
      entityId: id,
      metadata: {},
    });

    return { data: null, message: 'Contribuição removida com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGAMENTOS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Registra o pagamento de uma cobrança pendente ou em atraso.
   *
   * Regra: só é possível pagar cobranças com status pending ou overdue.
   * Cobranças já pagas são imutáveis.
   */
  async registerPayment(
    contributionId: number,
    paymentId: number,
    dto: RegisterPaymentDto,
    actor: JwtPayload,
  ) {
    // Valida que a contribution pertence ao tenant
    const contribution = await this.prisma.contributions.findFirst({
      where: { id: contributionId, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, amount: true },
    });
    if (!contribution) throw new NotFoundException('Contribuição não encontrada');

    // Valida que a cobrança existe e pertence à contribution
    const payment = await this.prisma.contribution_payments.findFirst({
      where: {
        id: paymentId,
        contribution_id: contributionId,
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      select: { id: true, status: true, reference_month: true },
    });
    if (!payment) throw new NotFoundException('Cobrança não encontrada');

    if (payment.status === 'paid') {
      throw new ConflictException('Esta cobrança já foi paga');
    }

    const amountPaid = dto.amount_paid ?? Number(contribution.amount);
    const paidAt = dto.paid_at ? new Date(dto.paid_at) : new Date();

    const { count } = await this.prisma.contribution_payments.updateMany({
      where: { id: paymentId, tenant_id: actor.tenantId, deleted_at: null, status: { not: 'paid' as any } },
      data: {
        status: 'paid' as any,
        amount_paid: amountPaid,
        paid_at: paidAt,
        payment_method: (dto.payment_method as any) ?? null,
        notes: dto.notes ?? null,
      },
    });
    if (count === 0) throw new ConflictException('Cobrança não pode ser paga (já paga ou não encontrada)');

    const updated = await this.prisma.contribution_payments.findFirst({
      where: { id: paymentId },
      select: PAYMENT_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'PAY_CONTRIBUTION',
      entityId: paymentId,
      metadata: { contribution_id: contributionId, reference_month: payment.reference_month, amount_paid: amountPaid },
    });

    return { data: this.formatPayment(updated!), message: 'Pagamento registrado com sucesso' };
  }

  async findPayments(
    contributionId: number,
    tenantId: number,
    page = 1,
    limit = 12,
    filters: { status?: string } = {},
  ) {
    // Valida acesso cross-tenant
    const contribution = await this.prisma.contributions.findFirst({
      where: { id: contributionId, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!contribution) throw new NotFoundException('Contribuição não encontrada');

    const where: Record<string, any> = {
      contribution_id: contributionId,
      tenant_id: tenantId,
      deleted_at: null,
    };
    if (filters.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      this.prisma.contribution_payments.findMany({
        where,
        select: PAYMENT_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { due_date: 'desc' },
      }),
      this.prisma.contribution_payments.count({ where }),
    ]);

    return {
      data: { items: items.map(this.formatPayment), pagination: { page, limit, total } },
      message: '',
    };
  }

  /**
   * Gera cobranças mensais para todas as contribuições ativas no tenant.
   *
   * Regra: idempotente — não duplica cobrança para o mesmo mês de referência.
   * Uso: chamar via cron job ou manualmente pelo admin no início de cada mês.
   *
   * @param referenceMonth - formato YYYY-MM (ex: "2026-04")
   */
  async generateMonthlyCharges(tenantId: number, referenceMonth: string, actor: JwtPayload) {
    if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
      throw new BadRequestException('referenceMonth deve estar no formato YYYY-MM');
    }

    const [year, month] = referenceMonth.split('-').map(Number);
    const dueDate = new Date(year, month - 1, 10); // vencimento dia 10 de cada mês

    const activeContributions = await this.prisma.contributions.findMany({
      where: {
        tenant_id: tenantId,
        status: 'active' as any,
        deleted_at: null,
        start_date: { lte: new Date(year, month - 1, 1) },    // já iniciou
        OR: [
          { end_date: null },
          { end_date: { gte: new Date(year, month - 1, 1) } }, // ainda não encerrou
        ],
      },
      select: { id: true, amount: true, frequency: true },
    });

    let generated = 0;
    let skipped = 0;

    for (const c of activeContributions) {
      // Filtra frequência: quarterly só gera em Jan/Abr/Jul/Out; annual só em Jan
      if (!this.shouldGenerateForMonth(c.frequency as string, month)) {
        skipped++;
        continue;
      }

      // Idempotência: não gera duplicata para o mesmo mês de referência
      const existing = await this.prisma.contribution_payments.findFirst({
        where: { contribution_id: Number(c.id), reference_month: referenceMonth },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.contribution_payments.create({
        data: {
          contribution_id: Number(c.id),
          tenant_id: tenantId,
          reference_month: referenceMonth,
          amount: c.amount,
          status: 'pending' as any,
          due_date: dueDate,
          created_by: actor.userId,
        },
      });
      generated++;
    }

    await this.audit({
      tenantId,
      userId: actor.userId,
      action: 'GENERATE_MONTHLY_CHARGES',
      entityId: 0,
      metadata: { reference_month: referenceMonth, generated, skipped },
    });

    return {
      data: { reference_month: referenceMonth, generated, skipped },
      message: `${generated} cobranças geradas para ${referenceMonth}`,
    };
  }

  /**
   * Marca cobranças vencidas como overdue.
   * Uso: chamar diariamente via cron job.
   */
  async markOverdue(tenantId: number, actor: JwtPayload) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await this.prisma.contribution_payments.updateMany({
      where: {
        tenant_id: tenantId,
        status: 'pending' as any,
        due_date: { lt: today },
        deleted_at: null,
      },
      data: { status: 'overdue' as any },
    });

    await this.audit({
      tenantId,
      userId: actor.userId,
      action: 'MARK_CONTRIBUTIONS_OVERDUE',
      entityId: 0,
      metadata: { count, date: today.toISOString() },
    });

    return { data: { updated: count }, message: `${count} cobranças marcadas como em atraso` };
  }

  /**
   * Resumo de inadimplência do tenant.
   */
  async overdueStats(tenantId: number) {
    const [overdueCount, overdueTotal, pendingCount] = await Promise.all([
      this.prisma.contribution_payments.count({
        where: { tenant_id: tenantId, status: 'overdue' as any, deleted_at: null },
      }),
      this.prisma.contribution_payments.aggregate({
        where: { tenant_id: tenantId, status: 'overdue' as any, deleted_at: null },
        _sum: { amount: true },
      }),
      this.prisma.contribution_payments.count({
        where: { tenant_id: tenantId, status: 'pending' as any, deleted_at: null },
      }),
    ]);

    return {
      data: {
        overdue_count: overdueCount,
        overdue_total: Number(overdueTotal._sum.amount ?? 0),
        pending_count: pendingCount,
      },
      message: '',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  private async assertPersonBelongsToTenant(personId: number, tenantId: number) {
    const person = await this.prisma.people.findFirst({
      where: { id: personId, tenant_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!person) throw new BadRequestException('Pessoa não encontrada neste tenant');
  }

  /** Garante que o filiado não tem recorrência ativa duplicada */
  private async assertNoActiveContribution(personId: number, tenantId: number) {
    const existing = await this.prisma.contributions.findFirst({
      where: { person_id: personId, tenant_id: tenantId, status: 'active' as any, deleted_at: null },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Esta pessoa já possui uma contribuição ativa');
    }
  }

  /** Calcula data de vencimento com base na frequência */
  private calculateDueDate(startDate: Date, frequency: ContributionFrequency): Date {
    const due = new Date(startDate);
    due.setDate(10); // vencimento sempre no dia 10
    return due;
  }

  /** Formata referência de mês YYYY-MM a partir de uma data */
  private formatReferenceMonth(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  /**
   * Define se a frequência gera cobrança no mês informado.
   * - monthly: sempre
   * - quarterly: meses 1, 4, 7, 10
   * - annual: apenas mês 1
   */
  private shouldGenerateForMonth(frequency: string, month: number): boolean {
    if (frequency === ContributionFrequency.MONTHLY) return true;
    if (frequency === ContributionFrequency.QUARTERLY) return [1, 4, 7, 10].includes(month);
    if (frequency === ContributionFrequency.ANNUAL) return month === 1;
    return false;
  }

  private format(c: any) {
    return {
      id: Number(c.id),
      tenantId: Number(c.tenant_id),
      personId: Number(c.person_id),
      person: c.person
        ? { id: Number(c.person.id), name: c.person.name, email: c.person.email, type: c.person.type }
        : null,
      amount: Number(c.amount),
      frequency: c.frequency,
      status: c.status,
      startDate: c.start_date,
      endDate: c.end_date ?? null,
      notes: c.notes ?? null,
      createdBy: Number(c.created_by),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  private formatPayment(p: any) {
    return {
      id: Number(p.id),
      contributionId: Number(p.contribution_id),
      tenantId: Number(p.tenant_id),
      referenceMonth: p.reference_month,
      amount: Number(p.amount),
      amountPaid: p.amount_paid !== null ? Number(p.amount_paid) : null,
      status: p.status,
      dueDate: p.due_date,
      paidAt: p.paid_at ?? null,
      paymentMethod: p.payment_method ?? null,
      notes: p.notes ?? null,
      createdBy: Number(p.created_by),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
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
        entity: 'contributions',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}
