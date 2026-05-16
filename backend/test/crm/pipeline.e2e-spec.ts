import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('CRM Pipeline (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let stageId: string;
  let entryId: string;
  let peopleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    authToken = loginRes.body.data.access_token;
    tenantId = loginRes.body.data.user.tenant_id;

    const person = await prisma.people.findFirst({ where: { tenant_id: BigInt(tenantId), deleted_at: null } });
    peopleId = person?.id.toString();
  });

  afterAll(async () => {
    await prisma.pipeline_entries.deleteMany({ where: { tenant_id: BigInt(tenantId) } });
    await prisma.pipeline_stages.deleteMany({ where: { tenant_id: BigInt(tenantId) } });
    await app.close();
  });

  it('POST /crm/pipeline/stages — cria estágio', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/pipeline/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Prospect', order_index: 1, color: '#6366f1' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Prospect');
    stageId = res.body.data.id;
  });

  it('GET /crm/pipeline/stages — lista estágios ordenados', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/pipeline/stages')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /crm/pipeline/stages/order — reordena estágios', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/pipeline/stages/order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ order: [{ id: stageId, order_index: 10 }] })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('POST /crm/pipeline/entries — move pessoa para estágio', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/pipeline/entries')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ people_id: peopleId, stage_id: stageId, notes: 'Primeiro contato' })
      .expect(201);

    expect(res.body.success).toBe(true);
    entryId = res.body.data.id;
  });

  it('GET /crm/pipeline/entries — filtra por stage_id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/pipeline/entries?stage_id=${stageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((e: any) => e.id === entryId)).toBe(true);
  });

  it('PATCH /crm/pipeline/entries/:id — atualiza notas', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/pipeline/entries/${entryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ notes: 'Atualizado' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.notes).toBe('Atualizado');
  });

  it('DELETE /crm/pipeline/stages/:id — soft delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/pipeline/stages/${stageId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const deleted = await prisma.pipeline_stages.findUnique({ where: { id: BigInt(stageId) } });
    expect(deleted?.deleted_at).not.toBeNull();
  });
});
