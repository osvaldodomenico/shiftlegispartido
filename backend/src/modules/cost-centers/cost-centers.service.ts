import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

const COST_CENTER_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  code: true,
  description: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCostCenterDto, actor: JwtPayload) {
    await this.assertCodeUnique(dto.code, actor.tenantId, null);

    const cc = await this.prisma.cost_centers.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description ?? null,
        is_active: true,
        created_by: actor.userId,
      },
      select: COST_CENTER_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_COST_CENTER',
      entityId: Number(cc.id),
      metadata: { name: cc.name, code: cc.code },
    });

    return { data: this.format(cc), message: 'Centro de custo criado com sucesso' };
  }

  async findAll(
    tenantId: number,
    filters: { is_active?: boolean; name?: string } = {},
  ) {
    const where: Record<string, any> = { tenant_id: tenantId, deleted_at: null };

    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    if (filters.name) {
      where.name = { contains: filters.name };
    }

    const items = await this.prisma.cost_centers.findMany({
      where,
      select: COST_CENTER_SELECT,
      orderBy: { code: 'asc' },
    });

    return { data: { items: items.map(this.format) }, message: '' };
  }

  async findOne(id: number, tenantId: number) {
    const cc = await this.prisma.cost_centers.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: COST_CENTER_SELECT,
    });
    if (!cc) throw new NotFoundException('Centro de custo não encontrado');

    return { data: this.format(cc), message: '' };
  }

  async update(id: number, dto: UpdateCostCenterDto, actor: JwtPayload) {
    const existing = await this.prisma.cost_centers.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Centro de custo não encontrado');

    if (dto.code !== undefined) {
      await this.assertCodeUnique(dto.code, actor.tenantId, id);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.code !== undefined) updateData.code = dto.code.toUpperCase();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const { count } = await this.prisma.cost_centers.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });
    if (count === 0) throw new NotFoundException('Centro de custo não encontrado');

    const updated = await this.prisma.cost_centers.findFirst({
      where: { id },
      select: COST_CENTER_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_COST_CENTER',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: this.format(updated!), message: 'Centro de custo atualizado com sucesso' };
  }

  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.cost_centers.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, name: true, code: true },
    });
    if (!existing) throw new NotFoundException('Centro de custo não encontrado');

    await this.prisma.cost_centers.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_COST_CENTER',
      entityId: id,
      metadata: { name: existing.name, code: existing.code },
    });

    return { data: null, message: 'Centro de custo removido com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  /** Código é único por tenant (case-insensitive via toUpperCase no create/update) */
  private async assertCodeUnique(code: string, tenantId: number, excludeId: number | null) {
    const existing = await this.prisma.cost_centers.findFirst({
      where: {
        tenant_id: tenantId,
        code: code.toUpperCase(),
        deleted_at: null,
        ...(excludeId !== null && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Já existe um centro de custo com o código "${code.toUpperCase()}"`);
    }
  }

  private format(cc: any) {
    return {
      id: Number(cc.id),
      tenantId: Number(cc.tenant_id),
      name: cc.name,
      code: cc.code,
      description: cc.description ?? null,
      isActive: cc.is_active,
      createdAt: cc.created_at,
      updatedAt: cc.updated_at,
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
        entity: 'cost_centers',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}
