import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Mandates (e2e)', () => {
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

  it('POST /mandates — cria mandato', async () => {
    const res = await request(app.getHttpServer())
      .post('/mandates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        person_id: 1,
        position: 'Vereador',
        jurisdiction: 'São Paulo - SP',
        start_date: '2025-01-01',
        end_date: '2028-12-31',
        status: 'active',
        notes: 'Mandato de vereador municipal',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.position).toBe('Vereador');
    expect(res.body.data.jurisdiction).toBe('São Paulo - SP');
    expect(res.body.data.status).toBe('active');
    createdId = res.body.data.id;
  });

  it('GET /mandates — lista mandatos', async () => {
    const res = await request(app.getHttpServer())
      .get('/mandates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /mandates/:id — busca mandato por id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/mandates/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdId);
  });

  it('PATCH /mandates/:id — atualiza mandato', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/mandates/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ position: 'Deputado Estadual', status: 'finished' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.position).toBe('Deputado Estadual');
    expect(res.body.data.status).toBe('finished');
  });

  it('DELETE /mandates/:id — remove mandato (soft delete)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/mandates/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('removido');
  });

  it('GET /mandates/:id — retorna 404 após soft delete', async () => {
    const res = await request(app.getHttpServer())
      .get(`/mandates/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
