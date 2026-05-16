import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let personId: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    authToken = loginRes.body.data.access_token;
    tenantId = loginRes.body.data.user.tenant_id;

    // Busca uma pessoa real do tenant para usar nos testes de attendees
    const person = await prisma.people.findFirst({
      where: { tenant_id: BigInt(tenantId), deleted_at: null },
    });
    personId = String(person?.id);
  });

  afterAll(async () => {
    // Limpeza: remove attendances e eventos criados no teste
    await prisma.event_attendances.deleteMany({
      where: { tenant_id: BigInt(tenantId) },
    });
    await prisma.events.deleteMany({
      where: { tenant_id: BigInt(tenantId) },
    });
    await app.close();
  });

  it('POST /crm/events — cria evento', async () => {
    const start = new Date(Date.now() + 86400000);
    const end = new Date(Date.now() + 90000000);

    const res = await request(app.getHttpServer())
      .post('/crm/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Reunião de filiados',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        location: 'Sede do partido',
        description: 'Reunião trimestral dos filiados',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Reunião de filiados');
    expect(res.body.data.location).toBe('Sede do partido');
    eventId = res.body.data.id;
  });

  it('GET /crm/events — lista eventos do tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/events')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((e: any) => e.id === eventId)).toBe(true);
  });

  it('GET /crm/events — filtra por start_from e start_to', async () => {
    const from = new Date(Date.now() + 3600000).toISOString();
    const to = new Date(Date.now() + 172800000).toISOString();

    const res = await request(app.getHttpServer())
      .get(`/crm/events?start_from=${from}&start_to=${to}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((e: any) => e.id === eventId)).toBe(true);
  });

  it('GET /crm/events/:id — busca evento por ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(eventId);
  });

  it('POST /crm/events/:id/attendees — adiciona participante', async () => {
    const res = await request(app.getHttpServer())
      .post(`/crm/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ person_ids: [personId] })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Participantes adicionados');
  });

  it('POST /crm/events/:id/attendees — upsert idempotente (não duplica)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/crm/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ person_ids: [personId] })
      .expect(201);

    expect(res.body.success).toBe(true);

    // Confirma que não foi criada duplicata
    const count = await prisma.event_attendances.count({
      where: {
        event_id: BigInt(eventId),
        person_id: BigInt(personId),
      },
    });
    expect(count).toBe(1);
  });

  it('PATCH /crm/events/:id/attendees/:personId — atualiza status de presença', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/events/${eventId}/attendees/${personId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'confirmed' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('PATCH /crm/events/:id — atualiza evento', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ location: 'Nova sede', name: 'Reunião atualizada' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.location).toBe('Nova sede');
    expect(res.body.data.name).toBe('Reunião atualizada');
  });

  it('DELETE /crm/events/:id/attendees/:personId — remove participante', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/events/${eventId}/attendees/${personId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Participante removido');
  });

  it('DELETE /crm/events/:id — soft delete do evento', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    // Confirma que deleted_at foi preenchido (soft delete real)
    const deleted = await prisma.events.findUnique({
      where: { id: BigInt(eventId) },
    });
    expect(deleted?.deleted_at).not.toBeNull();
  });

  it('GET /crm/events/:id — retorna 404 para evento soft-deleted', async () => {
    await request(app.getHttpServer())
      .get(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('DELETE /crm/events/:id — retorna 404 para evento inexistente', async () => {
    await request(app.getHttpServer())
      .delete('/crm/events/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('POST /crm/events — rejeita body inválido (sem name)', async () => {
    await request(app.getHttpServer())
      .post('/crm/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ start_at: new Date().toISOString() })
      .expect(400);
  });

  it('POST /crm/events — rejeita request sem autenticação', async () => {
    await request(app.getHttpServer())
      .post('/crm/events')
      .send({ name: 'Sem auth', start_at: new Date().toISOString() })
      .expect(401);
  });
});
