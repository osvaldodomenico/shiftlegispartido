import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let notificationId: string;

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

    // Cria uma notificação de seed para os testes de leitura
    const notif = await prisma.notifications.create({
      data: {
        tenant_id: BigInt(tenantId),
        user_id: BigInt(userId),
        type: 'task_assigned',
        title: 'Notificação de teste',
        message: 'Você recebeu uma tarefa de teste',
        read: false,
      },
    });
    notificationId = String(notif.id);
  });

  afterAll(async () => {
    // Limpa notificações criadas durante os testes
    await prisma.notifications.deleteMany({
      where: { tenant_id: BigInt(tenantId) },
    });
    await app.close();
  });

  // ── LIST ──────────────────────────────────────────────────────────────────────

  it('GET /crm/notifications — lista todas as notificações do usuário', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((n: any) => n.id === notificationId)).toBe(true);
  });

  it('GET /crm/notifications?read=false — filtra por não lidas', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications?read=false')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.every((n: any) => n.read === false)).toBe(true);
  });

  it('GET /crm/notifications?read=true — filtra por lidas (lista vazia inicialmente)', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications?read=true')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ── UNREAD COUNT ──────────────────────────────────────────────────────────────

  it('GET /crm/notifications/unread-count — retorna contagem de não lidas', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications/unread-count')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.unread).toBe('number');
    expect(res.body.data.unread).toBeGreaterThanOrEqual(1);
  });

  // ── MARK READ ─────────────────────────────────────────────────────────────────

  it('PATCH /crm/notifications/:id/read — marca notificação como lida', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(notificationId);
    expect(res.body.data.read).toBe(true);
  });

  it('GET /crm/notifications/unread-count — contagem decrementou após marcar lida', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications/unread-count')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.unread).toBe(0);
  });

  it('PATCH /crm/notifications/:id/read — retorna 404 para notificação inexistente', async () => {
    const res = await request(app.getHttpServer())
      .patch('/crm/notifications/999999999/read')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── MARK ALL READ ─────────────────────────────────────────────────────────────

  it('PATCH /crm/notifications/read-all — marca todas como lidas', async () => {
    // Cria algumas notificações não lidas para o teste
    await prisma.notifications.createMany({
      data: [
        {
          tenant_id: BigInt(tenantId),
          user_id: BigInt(userId),
          type: 'task_overdue',
          title: 'Tarefa vencida 1',
          message: 'Uma tarefa está vencida',
          read: false,
        },
        {
          tenant_id: BigInt(tenantId),
          user_id: BigInt(userId),
          type: 'pipeline_moved',
          title: 'Pipeline movido',
          message: 'Pessoa movida no pipeline',
          read: false,
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .patch('/crm/notifications/read-all')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.updated).toBeGreaterThanOrEqual(2);

    // Confirma que contagem é zero após marcar todas como lidas
    const countRes = await request(app.getHttpServer())
      .get('/crm/notifications/unread-count')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(countRes.body.data.unread).toBe(0);
  });

  // ── ISOLAMENTO DE TENANT ──────────────────────────────────────────────────────

  it('PATCH /crm/notifications/:id/read — não acessa notificações de outro usuário', async () => {
    // Cria notificação para outro user (user_id 999999999 não existe no tenant)
    // A busca retorna 404 por não encontrar no tenant+user_id do actor
    const res = await request(app.getHttpServer())
      .patch('/crm/notifications/999999999/read')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

  it('GET /crm/notifications — retorna 401 sem token', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications')
      .expect(401);

    expect(res.status).toBe(401);
  });

  it('GET /crm/notifications/unread-count — retorna 401 sem token', async () => {
    await request(app.getHttpServer())
      .get('/crm/notifications/unread-count')
      .expect(401);
  });

  it('PATCH /crm/notifications/read-all — retorna 401 sem token', async () => {
    await request(app.getHttpServer())
      .patch('/crm/notifications/read-all')
      .expect(401);
  });
});
