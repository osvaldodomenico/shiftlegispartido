import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Elections (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = res.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /electoral/elections — cria eleição', async () => {
    const res = await request(app.getHttpServer())
      .post('/electoral/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Eleições Municipais 2026',
        year: 2026,
        scope: 'municipal',
        description: 'Eleições para prefeito e vereadores',
        election_date: '2026-10-04',
        runoff_date: '2026-10-25',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.name).toBe('Eleições Municipais 2026');
    expect(res.body.data.year).toBe(2026);
    expect(res.body.data.scope).toBe('municipal');
    expect(res.body.data.is_active).toBe(true);
    createdId = res.body.data.id;
  });

  it('GET /electoral/elections — lista eleições', async () => {
    const res = await request(app.getHttpServer())
      .get('/electoral/elections')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /electoral/elections/:id — busca eleição por id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/electoral/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /electoral/elections/:id — atualiza eleição', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/electoral/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Eleições Municipais 2026 (Atualizado)', is_active: false });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Eleições Municipais 2026 (Atualizado)');
    expect(res.body.data.is_active).toBe(false);
  });

  it('DELETE /electoral/elections/:id — remove eleição (soft delete)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/electoral/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /electoral/elections/:id — retorna 404 após soft delete', async () => {
    const res = await request(app.getHttpServer())
      .get(`/electoral/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('GET /electoral/elections — exige autenticação', async () => {
    const res = await request(app.getHttpServer())
      .get('/electoral/elections');

    expect(res.status).toBe(401);
  });
});
