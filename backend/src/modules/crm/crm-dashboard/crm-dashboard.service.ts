import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CrmDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: number) {
    const tid = BigInt(tenantId);
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const minus7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPeople,
      activeTasks,
      overdueTasks,
      upcomingEvents,
      recentInteractions,
      totalTags,
      pipelineStages,
    ] = await Promise.all([
      // Total de pessoas ativas
      this.prisma.people.count({
        where: { tenant_id: tid, deleted_at: null },
      }),

      // Tarefas pendentes ou em andamento
      this.prisma.tasks.count({
        where: {
          tenant_id: tid,
          deleted_at: null,
          status: { in: ['pending', 'in_progress'] as any },
        },
      }),

      // Tarefas vencidas
      this.prisma.tasks.count({
        where: {
          tenant_id: tid,
          deleted_at: null,
          status: { in: ['pending', 'in_progress'] as any },
          due_date: { lt: now },
        },
      }),

      // Eventos nos próximos 30 dias
      this.prisma.events.count({
        where: {
          tenant_id: tid,
          deleted_at: null,
          start_at: { gte: now, lte: in30Days },
        },
      }),

      // Interações nos últimos 7 dias
      this.prisma.interactions.count({
        where: {
          tenant_id: tid,
          occurred_at: { gte: minus7Days },
        },
      }),

      // Total de tags ativas
      this.prisma.tags.count({
        where: { tenant_id: tid, deleted_at: null },
      }),

      // Contagem de pessoas por estágio do pipeline
      this.prisma.pipeline_stages.findMany({
        where: { tenant_id: tid, deleted_at: null },
        select: {
          id: true,
          name: true,
          color: true,
          order: true,
          _count: { select: { pipeline_entries: true } },
        },
        orderBy: { order: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        people: { total: totalPeople },
        tasks: { active: activeTasks, overdue: overdueTasks },
        events: { upcoming_30_days: upcomingEvents },
        interactions: { last_7_days: recentInteractions },
        tags: { total: totalTags },
        pipeline: pipelineStages.map((s) => ({
          id: s.id.toString(),
          name: s.name,
          color: s.color,
          order: s.order,
          people_count: s._count.pipeline_entries,
        })),
      },
    };
  }
}
