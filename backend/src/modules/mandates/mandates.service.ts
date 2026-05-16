import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';

// Campos seguros retornados em todas as respostas (nunca expor deleted_at)
const MANDATE_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  campaign_id: true,
  position: true,
  jurisdiction: true,
  start_date: true,
  end_date: true,
  status: true,
  notes: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class MandatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMandateDto, actor: JwtPayload) {
    const mandate = await this.prisma.mandates.create({
      data: {
        tenant_id: actor.tenantId,
        created_by: actor.userId,
        person_id: dto.person_id,
        campaign_id: dto.campaign_id ?? null,
        position: dto.position,
        jurisdiction: dto.jurisdiction,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        status: (dto.status as any) ?? 'active',
        notes: dto.notes ?? null,
      },
      select: MANDATE_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'CREATE', mandate.id, {
      dto,
    });

    return { data: mandate, message: 'Mandato criado com sucesso.' };
  }

  async findAll(actor: JwtPayload) {
    const mandates = await this.prisma.mandates.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: MANDATE_SELECT,
      orderBy: [{ start_date: 'desc' }, { position: 'asc' }],
    });

    return { data: mandates };
  }

  async findOne(id: string, actor: JwtPayload) {
    const mandate = await this.prisma.mandates.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      select: MANDATE_SELECT,
    });

    if (!mandate) {
      throw new NotFoundException('Mandato não encontrado.');
    }

    return { data: mandate };
  }

  async update(id: string, dto: UpdateMandateDto, actor: JwtPayload) {
    // Escrita atômica: updateMany + verificação de count para evitar race conditions
    const result = await this.prisma.mandates.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      data: {
        ...(dto.person_id !== undefined && { person_id: dto.person_id }),
        ...(dto.campaign_id !== undefined && { campaign_id: dto.campaign_id }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.jurisdiction !== undefined && {
          jurisdiction: dto.jurisdiction,
        }),
        ...(dto.start_date !== undefined && {
          start_date: new Date(dto.start_date),
        }),
        ...(dto.end_date !== undefined && {
          end_date: dto.end_date ? new Date(dto.end_date) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Mandato não encontrado.');
    }

    await this.audit(actor.tenantId, actor.userId, 'UPDATE', BigInt(id), {
      dto,
    });

    const updated = await this.prisma.mandates.findFirst({
      where: { id: BigInt(id), tenant_id: actor.tenantId, deleted_at: null },
      select: MANDATE_SELECT,
    });

    return { data: updated, message: 'Mandato atualizado com sucesso.' };
  }

  async remove(id: string, actor: JwtPayload) {
    // Soft delete: seta deleted_at em vez de apagar o registro
    const result = await this.prisma.mandates.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Mandato não encontrado.');
    }

    await this.audit(actor.tenantId, actor.userId, 'DELETE', BigInt(id), {});

    return { data: null, message: 'Mandato removido com sucesso.' };
  }

  // Registra operação no log de auditoria
  private async audit(
    tenantId: number,
    userId: number,
    action: string,
    entityId: bigint,
    metadata: object,
  ) {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        entity: 'mandate',
        entity_id: entityId,
        metadata,
      },
    });
  }
}
