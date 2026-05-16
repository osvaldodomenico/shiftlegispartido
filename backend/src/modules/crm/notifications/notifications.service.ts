import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { notification_type } from '@prisma/client';

// Campos seguros retornados nas respostas de notificações
const NOTIFICATION_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  user_id: true,
  type: true,
  title: true,
  message: true,
  read: true,
  entity_type: true,
  entity_id: true,
  created_at: true,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lista notificações do usuário autenticado — isolamento por tenant e user_id
  async findAll(
    actor: JwtPayload,
    filters: { read?: boolean } = {},
  ) {
    const notifications = await this.prisma.notifications.findMany({
      where: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        ...(filters.read !== undefined && { read: filters.read }),
      },
      select: NOTIFICATION_SAFE_SELECT,
      orderBy: { created_at: 'desc' },
    });

    return { success: true, data: notifications.map(serializeNotification) };
  }

  // Conta notificações não lidas do usuário autenticado
  async countUnread(actor: JwtPayload) {
    const count = await this.prisma.notifications.count({
      where: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        read: false,
      },
    });

    return { success: true, data: { unread: count } };
  }

  // Marca uma notificação específica como lida — valida pertencimento ao usuário
  async markRead(id: string, actor: JwtPayload) {
    const notification = await this.prisma.notifications.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
      },
    });
    if (!notification)
      throw new NotFoundException('Notificação não encontrada');

    const updated = await this.prisma.notifications.update({
      where: { id: BigInt(id) },
      data: { read: true },
      select: NOTIFICATION_SAFE_SELECT,
    });

    return {
      success: true,
      data: serializeNotification(updated),
      message: 'Notificação marcada como lida',
    };
  }

  // Marca todas as notificações do usuário como lidas (bulk operation)
  async markAllRead(actor: JwtPayload) {
    const result = await this.prisma.notifications.updateMany({
      where: {
        tenant_id: BigInt(actor.tenantId),
        user_id: BigInt(actor.userId),
        read: false,
      },
      data: { read: true },
    });

    return {
      success: true,
      data: { updated: result.count },
      message: 'Todas as notificações foram marcadas como lidas',
    };
  }

  // Cria notificação programaticamente — usado internamente por outros services
  async create(payload: {
    tenantId: bigint;
    userId: bigint;
    type: notification_type;
    title: string;
    message: string;
    entityType?: string;
    entityId?: bigint;
  }) {
    const notification = await this.prisma.notifications.create({
      data: {
        tenant_id: payload.tenantId,
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entity_type: payload.entityType ?? null,
        entity_id: payload.entityId ?? null,
      },
      select: NOTIFICATION_SAFE_SELECT,
    });

    return serializeNotification(notification);
  }
}

// BigInt não é serializável em JSON — converte para string
function serializeNotification(notification: any) {
  return {
    ...notification,
    id: String(notification.id),
    tenant_id: String(notification.tenant_id),
    user_id: String(notification.user_id),
    entity_id: notification.entity_id ? String(notification.entity_id) : null,
  };
}
