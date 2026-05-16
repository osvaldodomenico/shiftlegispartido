import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ClosePeriodDto, ReopenPeriodDto } from './dto/period-closing.dto';

const PERIOD_SELECT = {
  id: true,
  tenant_id: true,
  month: true,
  year: true,
  status: true,
  closed_by: true,
  closed_at: true,
  reopened_by: true,
  reopened_at: true,
  reopen_reason: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class FinancialPeriodClosingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * Fecha o período (mês/ano).
   * Após fechamento: create, update, delete e pay de transações nesse período são bloqueados.
   * Apenas admin pode fechar.
   */
  async close(dto: ClosePeriodDto, actor: JwtPayload) {
    await this.assertAdmin(actor);

    const existing = await this.prisma.financial_period_closings.findFirst({
      where: { tenant_id: actor.tenantId, month: dto.month, year: dto.year },
      select: { id: true, status: true },
    });

    if (existing?.status === 'closed') {
      throw new ConflictException(`Período ${this.label(dto.month, dto.year)} já está fechado`);
    }

    const period = await this.prisma.financial_period_closings.upsert({
      where: {
        tenant_id_year_month: {
          tenant_id: actor.tenantId,
          year: dto.year,
          month: dto.month,
        },
      },
      create: {
        tenant_id: actor.tenantId,
        month: dto.month,
        year: dto.year,
        status: 'closed' as any,
        closed_by: actor.userId,
        closed_at: new Date(),
      },
      update: {
        status: 'closed' as any,
        closed_by: actor.userId,
        closed_at: new Date(),
      },
      select: PERIOD_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CLOSE_PERIOD',
      metadata: { month: dto.month, year: dto.year },
    });

    return {
      data: this.format(period),
      message: `Período ${this.label(dto.month, dto.year)} fechado com sucesso`,
    };
  }

  /**
   * Reabre período fechado.
   * Exige admin + reason obrigatório.
   * Cria rastro de quem reabriu e por quê.
   */
  async reopen(dto: ReopenPeriodDto, actor: JwtPayload) {
    await this.assertAdmin(actor);

    const period = await this.prisma.financial_period_closings.findFirst({
      where: { tenant_id: actor.tenantId, month: dto.month, year: dto.year },
      select: { id: true, status: true },
    });

    if (!period) {
      throw new NotFoundException(`Período ${this.label(dto.month, dto.year)} não encontrado`);
    }

    if (period.status !== 'closed') {
      throw new ConflictException(`Período ${this.label(dto.month, dto.year)} não está fechado`);
    }

    const updated = await this.prisma.financial_period_closings.update({
      where: { id: period.id },
      data: {
        status: 'open' as any,
        reopened_by: actor.userId,
        reopened_at: new Date(),
        reopen_reason: dto.reason,
      },
      select: PERIOD_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'REOPEN_PERIOD',
      metadata: { month: dto.month, year: dto.year, reason: dto.reason },
    });

    return {
      data: this.format(updated),
      message: `Período ${this.label(dto.month, dto.year)} reaberto com sucesso`,
    };
  }

  async findAll(tenantId: number) {
    const items = await this.prisma.financial_period_closings.findMany({
      where: { tenant_id: tenantId },
      select: PERIOD_SELECT,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return { data: { items: items.map(this.format) }, message: '' };
  }

  async findOne(tenantId: number, month: number, year: number) {
    const period = await this.prisma.financial_period_closings.findFirst({
      where: { tenant_id: tenantId, month, year },
      select: PERIOD_SELECT,
    });
    if (!period) throw new NotFoundException(`Período ${this.label(month, year)} não encontrado`);

    return { data: this.format(period), message: '' };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  private async assertAdmin(actor: JwtPayload) {
    const dbRoles = await this.permissionsService.getActiveRolesForUser(actor.userId, actor.tenantId);
    if (!dbRoles.includes('admin')) {
      throw new ForbiddenException('Apenas admin pode fechar ou reabrir períodos financeiros');
    }
  }

  private label(month: number, year: number): string {
    return `${String(month).padStart(2, '0')}/${year}`;
  }

  private format(p: any) {
    return {
      id: Number(p.id),
      tenantId: Number(p.tenant_id),
      month: p.month,
      year: p.year,
      status: p.status,
      closedBy: p.closed_by !== null ? Number(p.closed_by) : null,
      closedAt: p.closed_at,
      reopenedBy: p.reopened_by !== null ? Number(p.reopened_by) : null,
      reopenedAt: p.reopened_at,
      reopenReason: p.reopen_reason,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }

  private async audit(params: {
    tenantId: number;
    userId: number;
    action: string;
    metadata?: object;
  }): Promise<void> {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        action: params.action,
        entity: 'financial_period_closings',
        entity_id: 0,
        metadata: params.metadata ?? {},
      },
    });
  }
}
