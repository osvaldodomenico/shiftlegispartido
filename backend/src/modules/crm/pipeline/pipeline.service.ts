import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const STAGE_SAFE_SELECT = {
  id: true, tenant_id: true, name: true, order: true,
  color: true, is_final: true, target_people_type: true,
  created_at: true, updated_at: true,
};

const ENTRY_SAFE_SELECT = {
  id: true, tenant_id: true, person_id: true, stage_id: true,
  entered_at: true, exited_at: true, notes: true,
  created_at: true, updated_at: true,
  person: { select: { id: true, name: true } },
  stage: { select: { id: true, name: true, color: true } },
};

function serializeStage(s: any) {
  return { ...s, id: String(s.id), tenant_id: String(s.tenant_id) };
}

function serializeEntry(e: any) {
  return {
    ...e,
    id: String(e.id),
    tenant_id: String(e.tenant_id),
    person_id: String(e.person_id),
    stage_id: String(e.stage_id),
    person: e.person ? { ...e.person, id: String(e.person.id) } : null,
    stage: e.stage ? { ...e.stage, id: String(e.stage.id) } : null,
  };
}

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Stages ----

  async createStage(dto: CreateStageDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);

    const stage = await this.prisma.pipeline_stages.create({
      data: {
        tenant_id: tid,
        created_by: uid,
        name: dto.name,
        order: dto.order_index ?? 0,
        color: dto.color ?? '#6366f1',
        is_final: dto.is_final ?? false,
        target_people_type: dto.target_people_type as any,
      },
      select: STAGE_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'CREATE',
        entity: 'pipeline_stages',
        entity_id: stage.id,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: serializeStage(stage), message: 'Estágio criado' };
  }

  async findAllStages(tenantId: number) {
    const tid = BigInt(tenantId);
    const stages = await this.prisma.pipeline_stages.findMany({
      where: { tenant_id: tid, deleted_at: null },
      select: STAGE_SAFE_SELECT,
      orderBy: { order: 'asc' },
    });
    return { success: true, data: stages.map(serializeStage) };
  }

  async updateStage(id: string, dto: UpdateStageDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const stageId = BigInt(id);

    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id: stageId, tenant_id: tid, deleted_at: null },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.color && { color: dto.color }),
        ...(dto.is_final !== undefined && { is_final: dto.is_final }),
        ...(dto.order_index !== undefined && { order: dto.order_index }),
        updated_at: new Date(),
      },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    const stage = await this.prisma.pipeline_stages.findUnique({ where: { id: stageId }, select: STAGE_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'UPDATE',
        entity: 'pipeline_stages',
        entity_id: stageId,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: stage ? serializeStage(stage) : null, message: 'Estágio atualizado' };
  }

  async removeStage(id: string, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const stageId = BigInt(id);

    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id: stageId, tenant_id: tid, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'DELETE',
        entity: 'pipeline_stages',
        entity_id: stageId,
        metadata: null,
      },
    });

    return { success: true, message: 'Estágio removido' };
  }

  async reorderStages(dto: ReorderStagesDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);

    await this.prisma.$transaction(
      dto.order.map((item) =>
        this.prisma.pipeline_stages.updateMany({
          where: { id: BigInt(item.id), tenant_id: tid, deleted_at: null },
          data: { order: item.order_index, updated_at: new Date() },
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'UPDATE',
        entity: 'pipeline_stages',
        entity_id: null,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, message: 'Estágios reordenados' };
  }

  // ---- Entries ----

  async createEntry(dto: CreateEntryDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);

    const person = await this.prisma.people.findFirst({
      where: { id: BigInt(dto.people_id), tenant_id: tid, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    const stage = await this.prisma.pipeline_stages.findFirst({
      where: { id: BigInt(dto.stage_id), tenant_id: tid, deleted_at: null },
    });
    if (!stage) throw new NotFoundException('Estágio não encontrado');

    const entry = await this.prisma.pipeline_entries.create({
      data: {
        tenant_id: tid,
        created_by: uid,
        person_id: BigInt(dto.people_id),
        stage_id: BigInt(dto.stage_id),
        notes: dto.notes,
        entered_at: new Date(),
      },
      select: ENTRY_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'CREATE',
        entity: 'pipeline_entries',
        entity_id: entry.id,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: serializeEntry(entry), message: 'Entrada criada' };
  }

  async findAllEntries(tenantId: number, stageId?: string, peopleId?: string) {
    const tid = BigInt(tenantId);
    const entries = await this.prisma.pipeline_entries.findMany({
      where: {
        tenant_id: tid,
        ...(stageId && { stage_id: BigInt(stageId) }),
        ...(peopleId && { person_id: BigInt(peopleId) }),
      },
      select: ENTRY_SAFE_SELECT,
      orderBy: { entered_at: 'desc' },
    });
    return { success: true, data: entries.map(serializeEntry) };
  }

  async updateEntry(id: string, dto: UpdateEntryDto, actor: JwtPayload) {
    const tid = BigInt(actor.tenantId);
    const uid = BigInt(actor.userId);
    const entryId = BigInt(id);

    const result = await this.prisma.pipeline_entries.updateMany({
      where: { id: entryId, tenant_id: tid },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.exited_at && { exited_at: new Date(dto.exited_at) }),
        updated_at: new Date(),
      },
    });
    if (result.count === 0) throw new NotFoundException('Entrada não encontrada');

    const entry = await this.prisma.pipeline_entries.findUnique({ where: { id: entryId }, select: ENTRY_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tid,
        user_id: uid,
        action: 'UPDATE',
        entity: 'pipeline_entries',
        entity_id: entryId,
        metadata: { data: JSON.stringify(dto) },
      },
    });

    return { success: true, data: entry ? serializeEntry(entry) : null, message: 'Entrada atualizada' };
  }
}
