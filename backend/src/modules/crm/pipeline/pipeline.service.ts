import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const STAGE_SAFE_SELECT = {
  id: true, tenant_id: true, name: true, order_index: true,
  color: true, is_final: true, target_people_type: true,
  created_at: true, updated_at: true,
};

const ENTRY_SAFE_SELECT = {
  id: true, tenant_id: true, people_id: true, stage_id: true,
  entered_at: true, exited_at: true, notes: true,
  created_at: true, updated_at: true,
  person: { select: { id: true, name: true } },
  stage: { select: { id: true, name: true, color: true } },
};

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Stages ----

  async createStage(dto: CreateStageDto, actor: JwtPayload) {
    const stage = await this.prisma.pipeline_stages.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        order_index: dto.order_index,
        color: dto.color ?? '#6366f1',
        is_final: dto.is_final ?? false,
        target_people_type: dto.target_people_type as any,
      },
      select: STAGE_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'pipeline_stages', entity_id: stage.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: stage, message: 'Estágio criado' };
  }

  async findAllStages(tenantId: string) {
    const stages = await this.prisma.pipeline_stages.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      select: STAGE_SAFE_SELECT,
      orderBy: { order_index: 'asc' },
    });
    return { success: true, data: stages };
  }

  async updateStage(id: string, dto: UpdateStageDto, actor: JwtPayload) {
    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { ...dto, updated_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    const stage = await this.prisma.pipeline_stages.findUnique({ where: { id }, select: STAGE_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_stages', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: stage, message: 'Estágio atualizado' };
  }

  async removeStage(id: string, actor: JwtPayload) {
    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'DELETE', entity: 'pipeline_stages', entity_id: id,
        payload: JSON.stringify({ id }),
      },
    });

    return { success: true, message: 'Estágio removido' };
  }

  async reorderStages(dto: ReorderStagesDto, actor: JwtPayload) {
    await this.prisma.$transaction(
      dto.order.map((item) =>
        this.prisma.pipeline_stages.updateMany({
          where: { id: item.id, tenant_id: actor.tenantId, deleted_at: null },
          data: { order_index: item.order_index, updated_at: new Date() },
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_stages', entity_id: 'batch-reorder',
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Estágios reordenados' };
  }

  // ---- Entries ----

  async createEntry(dto: CreateEntryDto, actor: JwtPayload) {
    const person = await this.prisma.people.findFirst({
      where: { id: dto.people_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    const stage = await this.prisma.pipeline_stages.findFirst({
      where: { id: dto.stage_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!stage) throw new NotFoundException('Estágio não encontrado');

    const entry = await this.prisma.pipeline_entries.create({
      data: {
        tenant_id: actor.tenantId,
        people_id: dto.people_id,
        stage_id: dto.stage_id,
        notes: dto.notes,
        entered_at: new Date(),
      },
      select: ENTRY_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'pipeline_entries', entity_id: entry.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: entry, message: 'Entrada criada' };
  }

  async findAllEntries(tenantId: string, stageId?: string, peopleId?: string) {
    const entries = await this.prisma.pipeline_entries.findMany({
      where: {
        tenant_id: tenantId,
        ...(stageId && { stage_id: stageId }),
        ...(peopleId && { people_id: peopleId }),
      },
      select: ENTRY_SAFE_SELECT,
      orderBy: { entered_at: 'desc' },
    });
    return { success: true, data: entries };
  }

  async updateEntry(id: string, dto: UpdateEntryDto, actor: JwtPayload) {
    const result = await this.prisma.pipeline_entries.updateMany({
      where: { id, tenant_id: actor.tenantId },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.exited_at && { exited_at: new Date(dto.exited_at) }),
        updated_at: new Date(),
      },
    });
    if (result.count === 0) throw new NotFoundException('Entrada não encontrada');

    const entry = await this.prisma.pipeline_entries.findUnique({ where: { id }, select: ENTRY_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_entries', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: entry, message: 'Entrada atualizada' };
  }
}
