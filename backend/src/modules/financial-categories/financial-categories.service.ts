import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';

const CATEGORY_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  type: true,
  parent_id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  parent: {
    select: { id: true, name: true, type: true },
  },
} as const;

@Injectable()
export class FinancialCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────────

  async create(dto: CreateFinancialCategoryDto, actor: JwtPayload) {
    if (dto.parent_id !== undefined) {
      await this.assertParentBelongsToTenant(dto.parent_id, actor.tenantId);
    }

    // Unicidade: name + type dentro do tenant (ignora soft-deleted)
    await this.assertNoDuplicate(dto.name, dto.type, actor.tenantId, null);

    const category = await this.prisma.financial_categories.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        type: dto.type as any,
        parent_id: dto.parent_id ?? null,
        is_active: true,
        created_by: actor.userId,
      },
      select: CATEGORY_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'CREATE_FINANCIAL_CATEGORY',
      entityId: Number(category.id),
      metadata: { name: category.name, type: category.type },
    });

    return { data: this.format(category), message: 'Categoria criada com sucesso' };
  }

  async findAll(
    tenantId: number,
    filters: { type?: string; is_active?: boolean } = {},
  ) {
    const where: Record<string, any> = { tenant_id: tenantId, deleted_at: null };

    if (filters.type) where.type = filters.type;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    const items = await this.prisma.financial_categories.findMany({
      where,
      select: CATEGORY_SELECT,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return {
      data: { items: items.map(this.format) },
      message: '',
    };
  }

  async findOne(id: number, tenantId: number) {
    const category = await this.prisma.financial_categories.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
      select: {
        ...CATEGORY_SELECT,
        // Inclui filhos diretos na resposta detalhada
        children: {
          where: { deleted_at: null },
          select: { id: true, name: true, type: true, is_active: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    return { data: this.formatWithChildren(category), message: '' };
  }

  async update(id: number, dto: UpdateFinancialCategoryDto, actor: JwtPayload) {
    const existing = await this.prisma.financial_categories.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, name: true, type: true },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    if (dto.parent_id !== undefined) {
      // Não permite circularidade: categoria não pode ser pai de si mesma
      if (dto.parent_id === id) {
        throw new BadRequestException('Uma categoria não pode ser pai de si mesma');
      }
      await this.assertParentBelongsToTenant(dto.parent_id, actor.tenantId);
      // Previne ciclo: verifica se o parent proposto é descendente desta categoria
      await this.assertNoCycle(id, dto.parent_id, actor.tenantId);
    }

    if (dto.name !== undefined || dto.type !== undefined) {
      const name = dto.name ?? existing.name;
      const type = (dto.type ?? existing.type) as string;
      await this.assertNoDuplicate(name, type, actor.tenantId, id);
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.parent_id !== undefined) updateData.parent_id = dto.parent_id;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const { count } = await this.prisma.financial_categories.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: updateData,
    });
    if (count === 0) throw new NotFoundException('Categoria não encontrada');

    const updated = await this.prisma.financial_categories.findFirst({
      where: { id },
      select: CATEGORY_SELECT,
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'UPDATE_FINANCIAL_CATEGORY',
      entityId: id,
      metadata: { fields: Object.keys(dto) },
    });

    return { data: this.format(updated!), message: 'Categoria atualizada com sucesso' };
  }

  /**
   * Soft delete — bloqueia se a categoria tem filhos ativos.
   * Subcategorias precisam ser deletadas ou reatribuídas antes.
   */
  async remove(id: number, actor: JwtPayload) {
    const existing = await this.prisma.financial_categories.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: { id: true, name: true },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    // Bloqueia se há filhos ativos
    const activeChildren = await this.prisma.financial_categories.count({
      where: { parent_id: id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (activeChildren > 0) {
      throw new ConflictException(
        `Categoria possui ${activeChildren} subcategoria(s) ativa(s). Remova-as antes de excluir a categoria pai.`,
      );
    }

    await this.prisma.financial_categories.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date(), is_active: false },
    });

    await this.audit({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'DELETE_FINANCIAL_CATEGORY',
      entityId: id,
      metadata: { name: existing.name },
    });

    return { data: null, message: 'Categoria removida com sucesso' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  /** Garante que o parent existe e pertence ao tenant — bloqueia cross-tenant */
  private async assertParentBelongsToTenant(parentId: number, tenantId: number) {
    const parent = await this.prisma.financial_categories.findFirst({
      where: { id: parentId, tenant_id: tenantId, deleted_at: null },
      select: { id: true, parent_id: true },
    });
    if (!parent) {
      throw new BadRequestException('Categoria pai não encontrada neste tenant');
    }
    // Hierarquia máxima de 2 níveis: pai não pode já ter pai
    if (parent.parent_id !== null) {
      throw new BadRequestException(
        'Hierarquia máxima de dois níveis. A categoria pai não pode ter um pai.',
      );
    }
  }

  /**
   * Previne ciclo hierárquico.
   * Verifica se o candidato a parent é descendente da categoria atual.
   */
  private async assertNoCycle(categoryId: number, candidateParentId: number, tenantId: number) {
    // Dado que a hierarquia é limitada a 2 níveis, basta checar se o candidateParentId
    // tem como pai o próprio categoryId
    const candidate = await this.prisma.financial_categories.findFirst({
      where: { id: candidateParentId, tenant_id: tenantId },
      select: { parent_id: true },
    });
    if (candidate?.parent_id === BigInt(categoryId)) {
      throw new BadRequestException(
        'Referência circular: a categoria pai proposta é descendente desta categoria',
      );
    }
  }

  /** Garante unicidade de name + type dentro do tenant (exclui o próprio registro em updates) */
  private async assertNoDuplicate(
    name: string,
    type: string,
    tenantId: number,
    excludeId: number | null,
  ) {
    const existing = await this.prisma.financial_categories.findFirst({
      where: {
        tenant_id: tenantId,
        name,
        type: type as any,
        deleted_at: null,
        ...(excludeId !== null && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Já existe uma categoria "${name}" do tipo "${type}" neste tenant`);
    }
  }

  private format(c: any) {
    return {
      id: Number(c.id),
      tenantId: Number(c.tenant_id),
      name: c.name,
      type: c.type,
      parentId: c.parent_id !== null ? Number(c.parent_id) : null,
      parent: c.parent
        ? { id: Number(c.parent.id), name: c.parent.name, type: c.parent.type }
        : null,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  private formatWithChildren(c: any) {
    return {
      ...this.format(c),
      children: (c.children ?? []).map((ch: any) => ({
        id: Number(ch.id),
        name: ch.name,
        type: ch.type,
        isActive: ch.is_active,
      })),
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
        entity: 'financial_categories',
        entity_id: params.entityId,
        metadata: params.metadata ?? {},
      },
    });
  }
}
