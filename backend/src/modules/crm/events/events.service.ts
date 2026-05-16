import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AddAttendeesDto } from './dto/add-attendees.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

// Campos seguros retornados nas respostas — nunca expor dados de outros tenants
const EVENT_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  description: true,
  start_at: true,
  end_at: true,
  location: true,
  is_active: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  attendances: {
    select: {
      id: true,
      person_id: true,
      status: true,
      registered_at: true,
      person: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, actor: JwtPayload) {
    const event = await this.prisma.events.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        created_by: BigInt(actor.userId),
        name: dto.name,
        description: dto.description,
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : undefined,
        location: dto.location,
      },
      select: EVENT_SAFE_SELECT,
    });

    // Audit log obrigatório em todo create
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'CREATE',
        entity: 'events',
        entity_id: String(event.id),
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: serializeEvent(event), message: 'Evento criado' };
  }

  async findAll(tenantId: string, startFrom?: string, startTo?: string) {
    const events = await this.prisma.events.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        deleted_at: null,
        ...(startFrom && { start_at: { gte: new Date(startFrom) } }),
        ...(startTo && { start_at: { lte: new Date(startTo) } }),
      },
      select: EVENT_SAFE_SELECT,
      orderBy: { start_at: 'asc' },
    });

    return { success: true, data: events.map(serializeEvent) };
  }

  async findOne(id: string, tenantId: string) {
    const event = await this.prisma.events.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
      select: EVENT_SAFE_SELECT,
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    return { success: true, data: serializeEvent(event) };
  }

  async update(id: string, dto: UpdateEventDto, actor: JwtPayload) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.start_at !== undefined) data.start_at = new Date(dto.start_at);
    if (dto.end_at !== undefined) data.end_at = new Date(dto.end_at);

    // Escrita atômica com isolamento de tenant e proteção contra soft delete
    const result = await this.prisma.events.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(actor.tenantId),
        deleted_at: null,
      },
      data,
    });
    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    const event = await this.prisma.events.findUnique({
      where: { id: BigInt(id) },
      select: EVENT_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'UPDATE',
        entity: 'events',
        entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: serializeEvent(event!), message: 'Evento atualizado' };
  }

  async remove(id: string, actor: JwtPayload) {
    // Soft delete — preserva histórico de auditoria
    const result = await this.prisma.events.updateMany({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(actor.tenantId),
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'DELETE',
        entity: 'events',
        entity_id: id,
        payload: null,
      },
    });

    return { success: true, message: 'Evento removido' };
  }

  async addAttendees(eventId: string, dto: AddAttendeesDto, actor: JwtPayload) {
    // Verifica que o evento existe e pertence ao tenant
    const event = await this.prisma.events.findFirst({
      where: {
        id: BigInt(eventId),
        tenant_id: BigInt(actor.tenantId),
        deleted_at: null,
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    // Upsert atômico — evita duplicatas respeitando unique([event_id, person_id])
    await Promise.all(
      dto.person_ids.map((personId) =>
        this.prisma.event_attendances.upsert({
          where: {
            event_id_person_id: {
              event_id: BigInt(eventId),
              person_id: BigInt(personId),
            },
          },
          create: {
            event_id: BigInt(eventId),
            person_id: BigInt(personId),
            tenant_id: BigInt(actor.tenantId),
          },
          update: {},
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'CREATE',
        entity: 'event_attendances',
        entity_id: eventId,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Participantes adicionados' };
  }

  async updateAttendance(
    eventId: string,
    personId: string,
    dto: UpdateAttendanceDto,
    actor: JwtPayload,
  ) {
    // Verifica que o evento pertence ao tenant antes de atualizar
    const attendance = await this.prisma.event_attendances.findFirst({
      where: {
        event_id: BigInt(eventId),
        person_id: BigInt(personId),
        tenant_id: BigInt(actor.tenantId),
      },
    });
    if (!attendance) throw new NotFoundException('Participante não encontrado');

    const updated = await this.prisma.event_attendances.update({
      where: { id: attendance.id },
      data: { status: dto.status as any },
      select: {
        id: true,
        event_id: true,
        person_id: true,
        status: true,
        registered_at: true,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'UPDATE',
        entity: 'event_attendances',
        entity_id: String(attendance.id),
        payload: JSON.stringify(dto),
      },
    });

    return {
      success: true,
      data: {
        ...updated,
        id: String(updated.id),
        event_id: String(updated.event_id),
        person_id: String(updated.person_id),
      },
      message: 'Status de presença atualizado',
    };
  }

  async removeAttendee(eventId: string, personId: string, actor: JwtPayload) {
    const attendance = await this.prisma.event_attendances.findFirst({
      where: {
        event_id: BigInt(eventId),
        person_id: BigInt(personId),
        tenant_id: BigInt(actor.tenantId),
      },
    });
    if (!attendance) throw new NotFoundException('Participante não encontrado');

    await this.prisma.event_attendances.delete({ where: { id: attendance.id } });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        action: 'DELETE',
        entity: 'event_attendances',
        entity_id: String(attendance.id),
        payload: null,
      },
    });

    return { success: true, message: 'Participante removido' };
  }
}

// BigInt não é serializável em JSON — converte para string
function serializeEvent(event: any) {
  return {
    ...event,
    id: String(event.id),
    tenant_id: String(event.tenant_id),
    created_by: String(event.created_by),
    attendances: event.attendances?.map((a: any) => ({
      ...a,
      id: String(a.id),
      person_id: String(a.person_id),
      person: a.person ? { ...a.person, id: String(a.person.id) } : null,
    })),
  };
}
