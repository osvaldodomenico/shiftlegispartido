import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Interactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let personId: string;
  let interactionId: string;

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

    // Busca uma pessoa existente do tenant para associar interações
    const person = await prisma.people.findFirst({
      where: { tenant_id: BigInt(tenantId), deleted_at: null },
    });
    personId = String(person?.id);
  });

  afterAll(async () => {
    // Limpa interações criadas durante os testes (soft delete via deleted_at)
    await prisma.interactions.updateMany({
      where: { tenant_id: BigInt(tenantId) },
      data: { deleted_at: new Date() },
    });
    await app.close();
  });

  // ── CREATE ────────────────────────────────────────────────────────────────────

  it('POST /crm/interactions — cria interação com sucesso', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: personId,
        type: 'meeting',
        direction: 'outbound',
        summary: 'Reunião de alinhamento estratégico',
        occurred_at: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('meeting');
    expect(res.body.data.direction).toBe('outbound');
    expect(res.body.data.person_id).toBe(personId);
    interactionId = res.body.data.id;
  });

  it('POST /crm/interactions — cria interação inbound (call)', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: personId,
        type: 'call',
        direction: 'inbound',
        summary: 'Ligação recebida do eleitor',
        occurred_at: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('call');
    expect(res.body.data.direction).toBe('inbound');
  });

  it('POST /crm/interactions — rejeita type inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: personId,
        type: 'tipo_invalido',
        direction: 'outbound',
        summary: 'Teste',
        occurred_at: new Date().toISOString(),
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /crm/interactions — rejeita direction inválido', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: personId,
        type: 'call',
        direction: 'lateral',
        summary: 'Teste',
        occurred_at: new Date().toISOString(),
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /crm/interactions — rejeita summary vazio', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: personId,
        type: 'email',
        direction: 'outbound',
        summary: '',
        occurred_at: new Date().toISOString(),
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /crm/interactions — rejeita person_id de outro tenant (404)', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        person_id: '999999999',
        type: 'call',
        direction: 'inbound',
        summary: 'Tentativa de cross-tenant',
        occurred_at: new Date().toISOString(),
      })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── LIST ──────────────────────────────────────────────────────────────────────

  it('GET /crm/interactions — lista todas as interações do tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((i: any) => i.id === interactionId)).toBe(true);
  });

  it('GET /crm/interactions?person_id=... — filtra por pessoa', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/interactions?person_id=${personId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((i: any) => i.person_id === personId)).toBe(true);
  });

  // ── GET ONE ───────────────────────────────────────────────────────────────────

  it('GET /crm/interactions/:id — retorna interação pelo ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/interactions/${interactionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(interactionId);
    expect(res.body.data.summary).toBe('Reunião de alinhamento estratégico');
  });

  it('GET /crm/interactions/:id — retorna 404 para ID inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/interactions/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  // ── APPEND-ONLY: sem PATCH nem DELETE ─────────────────────────────────────────

  it('PATCH /crm/interactions/:id — não existe (append-only)', async () => {
    await request(app.getHttpServer())
      .patch(`/crm/interactions/${interactionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ summary: 'tentativa de edição' })
      .expect(404);
  });

  it('DELETE /crm/interactions/:id — não existe (append-only)', async () => {
    await request(app.getHttpServer())
      .delete(`/crm/interactions/${interactionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

  it('GET /crm/interactions — retorna 401 sem token', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/interactions')
      .expect(401);

    expect(res.status).toBe(401);
  });

  it('POST /crm/interactions — retorna 401 sem token', async () => {
    await request(app.getHttpServer())
      .post('/crm/interactions')
      .send({
        person_id: personId,
        type: 'call',
        direction: 'inbound',
        summary: 'Sem token',
        occurred_at: new Date().toISOString(),
      })
      .expect(401);
  });
});
