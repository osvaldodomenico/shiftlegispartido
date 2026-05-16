import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Tasks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let personId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);

    // Login como admin do tenant de teste
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    authToken = loginRes.body.data.access_token;
    tenantId = loginRes.body.data.user.tenant_id;
    userId = loginRes.body.data.user.id;

    // Busca uma pessoa existente do tenant para associar tarefas
    const person = await prisma.people.findFirst({
      where: { tenant_id: BigInt(tenantId), deleted_at: null },
    });
    personId = String(person?.id);
  });

  afterAll(async () => {
    // Limpa tarefas criadas durante os testes (soft delete via deleted_at)
    await prisma.tasks.updateMany({
      where: { tenant_id: BigInt(tenantId) },
      data: { deleted_at: new Date() },
    });
    await app.close();
  });

  // ── CREATE ────────────────────────────────────────────────────────────────────

  it('POST /crm/tasks — cria tarefa com sucesso', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Ligar para o eleitor',
        description: 'Verificar demandas do bairro',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        priority: 'high',
        assigned_to: userId,
        person_id: personId,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Ligar para o eleitor');
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.assigned_to).toBe(userId);
    taskId = res.body.data.id;
  });

  it('POST /crm/tasks — cria tarefa com prioridade padrão (medium)', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Enviar ofício',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        assigned_to: userId,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.priority).toBe('medium');
    expect(res.body.data.status).toBe('pending');
  });

  it('POST /crm/tasks — rejeita título vazio', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: userId,
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /crm/tasks — rejeita priority inválida', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Tarefa teste',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: userId,
        priority: 'urgentissimo',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /crm/tasks — rejeita assigned_to de outro tenant (404)', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Tarefa inválida',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: '999999999',
      })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── LIST ──────────────────────────────────────────────────────────────────────

  it('GET /crm/tasks — lista todas as tarefas do tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((t: any) => t.id === taskId)).toBe(true);
  });

  it('GET /crm/tasks?assigned_to=... — filtra por responsável', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/tasks?assigned_to=${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((t: any) => t.assigned_to === userId)).toBe(true);
  });

  it('GET /crm/tasks?status=pending — filtra por status', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks?status=pending')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.every((t: any) => t.status === 'pending')).toBe(true);
  });

  it('GET /crm/tasks?person_id=... — filtra por pessoa', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/tasks?person_id=${personId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ── GET ONE ───────────────────────────────────────────────────────────────────

  it('GET /crm/tasks/:id — retorna tarefa pelo ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(taskId);
    expect(res.body.data.title).toBe('Ligar para o eleitor');
    expect(res.body.data.assignee).toBeDefined();
  });

  it('GET /crm/tasks/:id — retorna 404 para ID inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────────

  it('PATCH /crm/tasks/:id — atualiza status para in_progress', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('PATCH /crm/tasks/:id — marca como done e preenche completed_at', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'done' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.completed_at).not.toBeNull();
  });

  it('PATCH /crm/tasks/:id — atualiza título e descrição', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Ligar para o eleitor — atualizado',
        description: 'Confirmado horário das 14h',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Ligar para o eleitor — atualizado');
  });

  it('PATCH /crm/tasks/:id — rejeita status inválido', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'finalizado' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('PATCH /crm/tasks/:id — retorna 404 para tarefa inexistente', async () => {
    const res = await request(app.getHttpServer())
      .patch('/crm/tasks/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Título atualizado' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── DELETE ────────────────────────────────────────────────────────────────────

  it('DELETE /crm/tasks/:id — remove tarefa com soft delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('GET /crm/tasks/:id — retorna 404 após soft delete', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('DELETE /crm/tasks/:id — retorna 404 para tarefa inexistente', async () => {
    const res = await request(app.getHttpServer())
      .delete('/crm/tasks/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

  it('GET /crm/tasks — retorna 401 sem token', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks')
      .expect(401);

    expect(res.status).toBe(401);
  });

  it('POST /crm/tasks — retorna 401 sem token', async () => {
    await request(app.getHttpServer())
      .post('/crm/tasks')
      .send({
        title: 'Sem token',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: userId,
      })
      .expect(401);
  });
});
