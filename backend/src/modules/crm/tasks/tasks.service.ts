import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { task_status } from '@prisma/client';

// Campos seguros retornados nas respostas — nunca expor dados sensíveis
const TASK_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  person_id: true,
  title: true,
  description: true,
  due_date: true,
  status: true,
  priority: true,
  assigned_to: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  completed_at: true,
  assignee: { select: { id: true, name: true, email: true } },
  person: { select: { id: true, name: true } },
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Cria tarefa e notifica o responsável se for atribuição a outro usuário
  async create(dto: CreateTaskDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const userId = BigInt(actor.userId);
    const assignedTo = BigInt(dto.assigned_to);

    // Valida que o assignee existe e pertence ao tenant
    const assignee = await this.prisma.users.findFirst({
      where: { id: assignedTo, tenant_id: tenantId, deleted_at: null },
    });
    if (!assignee) throw new NotFoundException('Usuário atribuído não encontrado');

    // Valida person_id se fornecido
    if (dto.person_id) {
      const person = await this.prisma.people.findFirst({
        where: {
          id: BigInt(dto.person_id),
          tenant_id: tenantId,
          deleted_at: null,
        },
      });
      if (!person) throw new NotFoundException('Pessoa não encontrada');
    }

    const task = await this.prisma.tasks.create({
      data: {
        tenant_id: tenantId,
        title: dto.title,
        description: dto.description,
        due_date: new Date(dto.due_date),
        status: dto.status ?? 'pending',
        priority: dto.priority ?? 'medium',
        assigned_to: assignedTo,
        created_by: userId,
        ...(dto.person_id && { person_id: BigInt(dto.person_id) }),
      },
      select: TASK_SAFE_SELECT,
    });

    // Notifica o responsável quando a tarefa é atribuída a outro usuário
    if (assignedTo !== userId) {
      await this.prisma.notifications.create({
        data: {
          tenant_id: tenantId,
          user_id: assignedTo,
          type: 'task_assigned',
          title: 'Nova tarefa atribuída',
          message: `Você recebeu uma nova tarefa: "${dto.title}"`,
          entity_type: 'tasks',
          entity_id: task.id,
        },
      });
    }

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action: 'CREATE',
        entity: 'tasks',
        entity_id: String(task.id),
        payload: JSON.stringify(dto),
      },
    });

    return {
      success: true,
      data: serializeTask(task),
      message: 'Tarefa criada com sucesso',
    };
  }

  // Lista tarefas do tenant com filtros opcionais
  async findAll(
    tenantId: string,
    filters: {
      assigned_to?: string;
      status?: task_status;
      person_id?: string;
    } = {},
  ) {
    const tasks = await this.prisma.tasks.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        deleted_at: null,
        ...(filters.assigned_to && { assigned_to: BigInt(filters.assigned_to) }),
        ...(filters.status && { status: filters.status }),
        ...(filters.person_id && { person_id: BigInt(filters.person_id) }),
      },
      select: TASK_SAFE_SELECT,
      orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
    });

    return { success: true, data: tasks.map(serializeTask) };
  }

  // Busca uma tarefa por ID com isolamento de tenant e soft delete
  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.tasks.findFirst({
      where: {
        id: BigInt(id),
        tenant_id: BigInt(tenantId),
        deleted_at: null,
      },
      select: TASK_SAFE_SELECT,
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');

    return { success: true, data: serializeTask(task) };
  }

  // Atualiza tarefa — apenas o criador ou o responsável pode editar
  async update(id: string, dto: UpdateTaskDto, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const taskId = BigInt(id);

    // Busca atual para validação de autorização
    const existing = await this.prisma.tasks.findFirst({
      where: { id: taskId, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Tarefa não encontrada');

    // Apenas criador ou responsável atual pode editar
    const actorId = BigInt(actor.userId);
    if (existing.created_by !== actorId && existing.assigned_to !== actorId) {
      throw new ForbiddenException(
        'Apenas o criador ou responsável pode editar esta tarefa',
      );
    }

    const data: Record<string, any> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.due_date !== undefined) data.due_date = new Date(dto.due_date);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.person_id !== undefined)
      data.person_id = dto.person_id ? BigInt(dto.person_id) : null;

    // Marca completed_at quando status muda para done
    if (dto.status === 'done' && existing.status !== 'done') {
      data.completed_at = new Date();
    }

    const newAssignedTo = dto.assigned_to ? BigInt(dto.assigned_to) : null;

    if (newAssignedTo) {
      // Valida novo responsável no tenant
      const assignee = await this.prisma.users.findFirst({
        where: { id: newAssignedTo, tenant_id: tenantId, deleted_at: null },
      });
      if (!assignee)
        throw new NotFoundException('Usuário atribuído não encontrado');
      data.assigned_to = newAssignedTo;
    }

    const updated = await this.prisma.tasks.update({
      where: { id: taskId },
      data,
      select: TASK_SAFE_SELECT,
    });

    // Notifica novo responsável em caso de reatribuição
    if (newAssignedTo && newAssignedTo !== existing.assigned_to) {
      await this.prisma.notifications.create({
        data: {
          tenant_id: tenantId,
          user_id: newAssignedTo,
          type: 'task_assigned',
          title: 'Tarefa reatribuída',
          message: `Você foi atribuído à tarefa: "${updated.title}"`,
          entity_type: 'tasks',
          entity_id: taskId,
        },
      });
    }

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: BigInt(actor.userId),
        action: 'UPDATE',
        entity: 'tasks',
        entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return {
      success: true,
      data: serializeTask(updated),
      message: 'Tarefa atualizada com sucesso',
    };
  }

  // Soft delete — apenas o criador pode remover
  async remove(id: string, actor: JwtPayload) {
    const tenantId = BigInt(actor.tenantId);
    const taskId = BigInt(id);

    const existing = await this.prisma.tasks.findFirst({
      where: { id: taskId, tenant_id: tenantId, deleted_at: null },
    });
    if (!existing) throw new NotFoundException('Tarefa não encontrada');

    if (existing.created_by !== BigInt(actor.userId)) {
      throw new ForbiddenException('Apenas o criador pode remover esta tarefa');
    }

    await this.prisma.tasks.update({
      where: { id: taskId },
      data: { deleted_at: new Date() },
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: BigInt(actor.userId),
        action: 'DELETE',
        entity: 'tasks',
        entity_id: id,
        payload: JSON.stringify({}),
      },
    });

    return { success: true, message: 'Tarefa removida com sucesso' };
  }
}

// BigInt não é serializável em JSON — converte para string
function serializeTask(task: any) {
  return {
    ...task,
    id: String(task.id),
    tenant_id: String(task.tenant_id),
    assigned_to: String(task.assigned_to),
    created_by: String(task.created_by),
    person_id: task.person_id ? String(task.person_id) : null,
    assignee: task.assignee
      ? { ...task.assignee, id: String(task.assignee.id) }
      : null,
    person: task.person
      ? { ...task.person, id: String(task.person.id) }
      : null,
  };
}
