import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Campaigns (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let electionId: string;
  let campaignId: string;
  let peopleId: string;
  let teamMemberId: string;
  let contractId: string;
  let eventId: string;
  let reportId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = loginRes.body.data.access_token;

    const elRes = await request(app.getHttpServer())
      .post('/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Eleição para Campanha Test', year: 2026, type: 'municipal' });
    electionId = elRes.body.data.id;

    const pRes = await request(app.getHttpServer())
      .get('/people?limit=1')
      .set('Authorization', `Bearer ${token}`);
    peopleId = pRes.body.data[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── CAMPAIGNS CRUD ────────────────────────────────────────────────────────

  it('POST /campaigns — creates campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        election_id: electionId,
        people_id: peopleId,
        name: 'Campanha Vereador 2026',
        office: 'Vereador',
        budget: 50000,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Campanha Vereador 2026');
    campaignId = res.body.data.id;
  });

  it('GET /campaigns — lists campaigns', async () => {
    const res = await request(app.getHttpServer())
      .get('/campaigns')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /campaigns?election_id=x — filters by election', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns?election_id=${electionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.id === campaignId)).toBe(true);
  });

  it('GET /campaigns/:id — finds campaign', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(campaignId);
  });

  it('PATCH /campaigns/:id — updates campaign', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ativa' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ativa');
  });

  // ── TEAM ──────────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/team — adds team member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/team`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        people_id: peopleId,
        role: 'coordenador',
        payment_type: 'voluntario',
        start_date: '2026-01-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    teamMemberId = res.body.data.id;
  });

  it('GET /campaigns/:id/team — lists team', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}/team`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((m: any) => m.id === teamMemberId)).toBe(true);
  });

  it('PATCH /campaigns/:id/team/:memberId — updates member role', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/team/${teamMemberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'tesoureiro' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('tesoureiro');
  });

  it('DELETE /campaigns/:id/team/:memberId — soft deletes member', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}/team/${teamMemberId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── CONTRACTS ─────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/contracts — creates contract', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/contracts`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        people_id: peopleId,
        description: 'Contrato gráfico',
        object: 'Produção de material gráfico para campanha',
        value: 10000,
        start_date: '2026-01-01',
      });
    expect(res.status).toBe(201);
    contractId = res.body.data.id;
  });

  it('GET /campaigns/:id/contracts — lists contracts', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}/contracts`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.id === contractId)).toBe(true);
  });

  it('PATCH /campaigns/:id/contracts/:contractId — updates contract', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
  });

  it('POST /campaigns/:id/contracts/:contractId/payments — registers payment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/contracts/${contractId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000, due_date: '2026-02-01' });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
  });

  it('DELETE /campaigns/:id/contracts/:contractId — soft deletes contract', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── SCHEDULE ──────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/schedule — creates event', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Comício Central',
        type: 'comicio',
        start_at: '2026-09-01T18:00:00.000Z',
        location: 'Praça Central',
      });
    expect(res.status).toBe(201);
    eventId = res.body.data.id;
  });

  it('GET /campaigns/:id/schedule — lists schedule', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}/schedule`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((e: any) => e.id === eventId)).toBe(true);
  });

  it('PATCH /campaigns/:id/schedule/:eventId — updates event', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/schedule/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('confirmed');
  });

  it('DELETE /campaigns/:id/schedule/:eventId — soft deletes event', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}/schedule/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── TSE REPORTS ───────────────────────────────────────────────────────────

  it('POST /campaigns/:id/tse-reports — creates report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/tse-reports`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'parcial',
        reference: '2026-P1',
        period_start: '2026-01-01',
        period_end: '2026-06-30',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    reportId = res.body.data.id;
  });

  it('GET /campaigns/:id/tse-reports — lists reports', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}/tse-reports`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((r: any) => r.id === reportId)).toBe(true);
  });

  it('POST /campaigns/:id/tse-reports/:reportId/items — adds item', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/tse-reports/${reportId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        tse_code: 'REC001',
        direction: 'income',
        amount: 5000,
        description: 'Doação de pessoa física',
      });
    expect(res.status).toBe(201);
  });

  it('POST /campaigns/:id/tse-reports/:reportId/submit — submits report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/tse-reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('submitted');
  });

  it('DELETE /campaigns/:id — soft deletes campaign', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /campaigns/:id — returns 404 after delete', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
