import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

// Campos seguros retornados nas respostas — nunca expor dados de outros tenants
// Sem user_id/user relation no schema — apenas created_by (BigInt)
const INTERACTION_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  created_by: true,
  type: true,
  direction: true,
  summary: true,
  occurred_at: true,
  created_at: true,
  person: { select: { id: true, name: true } },
};

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Registra uma interação — append-only: nunca editar, soft delete via deleted_at
  async create(dto: CreateInteractionDto, actor: JwtPayload) {
    // Valida que a pessoa existe e pertence ao tenant do actor
    const person = await this.prisma.people.findFirst({
      where: {
        id: BigInt(dto.person_id),
        tenant_id: BigInt(actor.tenantId),
        deleted_at: null,
      },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    const interaction = await this.prisma.interactions.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        person_id: BigInt(dto.person_id),
        created_by: BigInt(actor.userId),
        type: dto.type,
        direction: dto.direction,
        summary: dto.summary,
        occurred_at: new Date(dto.occurred_at),
      },
      select: INTERACTION_SAFE_SELECT,
    });

    // Audit log obrigatório em todo create
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'CREATE',
        entity: 'interactions',
        entity_id: String(interaction.id),
        payload: JSON.stringify(dto),
      },
    });

    return {
      success: true,
      data: serializeInteraction(interaction),
      message: 'Interação registrada',
    };
  }

  // Lista interações do tenant, ordenadas por data decrescente
  // Filtro por person_id opcional; respeita soft delete
  async findAll(tenantId: string, personId?: string) {
    const interactions = await this.prisma.interactions.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        deleted_at: null,
        ...(personId && { person_id: BigInt(personId) }),
      },
      select: INTERACTION_SAFE_SELECT,
      orderBy: { occurred_at: 'desc' },
    });

    return { success: true, data: interactions.map(serializeInteraction) };
  }

  // Busca uma interação por ID com isolamento de tenant e soft delete
  async findOne(id: string, tenantId: string) {
    const interaction = await this.prisma.interactions.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
      select: INTERACTION_SAFE_SELECT,
    });
    if (!interaction) throw new NotFoundException('Interação não encontrada');

    return { success: true, data: serializeInteraction(interaction) };
  }
}

// BigInt não é serializável em JSON — converte para string
function serializeInteraction(interaction: any) {
  return {
    ...interaction,
    id: String(interaction.id),
    tenant_id: String(interaction.tenant_id),
    person_id: String(interaction.person_id),
    created_by: String(interaction.created_by),
    person: interaction.person
      ? { ...interaction.person, id: String(interaction.person.id) }
      : null,
  };
}
