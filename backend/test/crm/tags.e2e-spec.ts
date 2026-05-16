import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Tags (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let tagId: string;
  let peopleId: string;

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

    // Busca uma pessoa existente para testes de people_tags
    const person = await prisma.people.findFirst({ where: { tenant_id: tenantId, deleted_at: null } });
    peopleId = person?.id;
  });

  afterAll(async () => {
    await prisma.people_tags.deleteMany({ where: { tenant_id: tenantId } });
    await prisma.tags.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  // ── TAGS CRUD ────────────────────────────────────────────────────────────────

  it('POST /crm/tags — cria tag', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Apoiador', color: '#6366f1' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Apoiador');
    tagId = res.body.data.id;
  });

  it('POST /crm/tags — rejeita duplicata de nome', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Apoiador' });
    expect(res.status).toBe(409);
  });

  it('POST /crm/tags — rejeita color inválida', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Nova', color: 'vermelho' });
    expect(res.status).toBe(400);
  });

  it('GET /crm/tags — lista tags do tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((t: any) => t.id === tagId)).toBe(true);
  });

  it('PATCH /crm/tags/:id — atualiza tag', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: '#ff0000' });
    expect(res.status).toBe(200);
    expect(res.body.data.color).toBe('#ff0000');
  });

  it('DELETE /crm/tags/:id — remove tag (soft delete)', async () => {
    // Cria uma segunda tag para deletar sem afetar os testes de people_tags
    const createRes = await request(app.getHttpServer())
      .post('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Para Deletar' });
    const idToDelete = createRes.body.data.id;

    const res = await request(app.getHttpServer())
      .delete(`/crm/tags/${idToDelete}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/tags/:id — retorna 404 para tag inexistente', async () => {
    const res = await request(app.getHttpServer())
      .delete('/crm/tags/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });

  // ── PEOPLE TAGS ──────────────────────────────────────────────────────────────

  it('POST /crm/people/:id/tags — vincula tags a pessoa', async () => {
    if (!peopleId) return;
    const res = await request(app.getHttpServer())
      .post(`/crm/people/${peopleId}/tags`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tag_ids: [tagId] });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('POST /crm/people/:id/tags — idempotente (upsert não duplica)', async () => {
    if (!peopleId) return;
    const res = await request(app.getHttpServer())
      .post(`/crm/people/${peopleId}/tags`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tag_ids: [tagId] });
    expect(res.status).toBe(201);
  });

  it('DELETE /crm/people/:id/tags/:tagId — desvincula tag de pessoa', async () => {
    if (!peopleId) return;
    const res = await request(app.getHttpServer())
      .delete(`/crm/people/${peopleId}/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/people/:id/tags/:tagId — retorna 404 para vínculo inexistente', async () => {
    if (!peopleId) return;
    const res = await request(app.getHttpServer())
      .delete(`/crm/people/${peopleId}/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
  });

  // ── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

  it('GET /crm/tags — retorna 401 sem token', async () => {
    const res = await request(app.getHttpServer()).get('/crm/tags');
    expect(res.status).toBe(401);
  });
});
