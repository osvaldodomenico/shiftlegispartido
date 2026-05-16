import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

// Campos seguros retornados em todas as respostas (nunca expor deleted_at)
const ELECTION_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  year: true,
  scope: true,
  description: true,
  election_date: true,
  runoff_date: true,
  is_active: true,
  created_by: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class ElectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateElectionDto, actor: JwtPayload) {
    const election = await this.prisma.elections.create({
      data: {
        tenant_id: actor.tenantId,
        created_by: actor.userId,
        name: dto.name,
        year: dto.year,
        scope: dto.scope as any,
        description: dto.description ?? null,
        election_date: dto.election_date ? new Date(dto.election_date) : null,
        runoff_date: dto.runoff_date ? new Date(dto.runoff_date) : null,
        is_active: dto.is_active ?? true,
      },
      select: ELECTION_SELECT,
    });

    await this.audit(
      actor.tenantId,
      actor.userId,
      'CREATE',
      election.id,
      { dto },
    );

    return { data: election, message: 'Eleição criada com sucesso.' };
  }

  async findAll(actor: JwtPayload) {
    const elections = await this.prisma.elections.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: ELECTION_SELECT,
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });

    return { data: elections };
  }

  async findOne(id: string, actor: JwtPayload) {
    const election = await this.prisma.elections.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      select: ELECTION_SELECT,
    });

    if (!election) {
      throw new NotFoundException('Eleição não encontrada.');
    }

    return { data: election };
  }

  async update(id: string, dto: UpdateElectionDto, actor: JwtPayload) {
    // Escrita atômica: updateMany + verificação de count para evitar race conditions
    const result = await this.prisma.elections.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.scope !== undefined && { scope: dto.scope as any }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.election_date !== undefined && {
          election_date: dto.election_date ? new Date(dto.election_date) : null,
        }),
        ...(dto.runoff_date !== undefined && {
          runoff_date: dto.runoff_date ? new Date(dto.runoff_date) : null,
        }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        updated_at: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Eleição não encontrada.');
    }

    const election = await this.prisma.elections.findFirst({
      where: { id: BigInt(id), tenant_id: actor.tenantId, deleted_at: null },
      select: ELECTION_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'UPDATE', BigInt(id), { dto });

    return { data: election, message: 'Eleição atualizada com sucesso.' };
  }

  async remove(id: string, actor: JwtPayload) {
    // Soft delete: apenas marca deleted_at
    const result = await this.prisma.elections.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: actor.tenantId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Eleição não encontrada.');
    }

    await this.audit(actor.tenantId, actor.userId, 'DELETE', BigInt(id), {});

    return { data: null, message: 'Eleição removida com sucesso.' };
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
        entity: 'election',
        entity_id: entityId,
        metadata,
      },
    });
  }
}
