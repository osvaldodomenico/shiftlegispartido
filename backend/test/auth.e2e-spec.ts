import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';

/**
 * Testes e2e do fluxo de refresh token e logout.
 * Requer banco de testes (shiftpartido_test) com um usuário seed.
 *
 * Seed mínimo necessário:
 *   - tenant: { id: 1, name: 'Test Tenant', status: 'active' }
 *   - user: { email: 'test@example.com', password_hash: bcrypt('Test@1234'), status: 'active', tenant_id: 1 }
 */
describe('Auth — refresh + logout (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await createTestApp();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Test@1234' })
      .expect(200);

    accessToken = res.body.data.access_token;
    refreshToken = res.body.data.refresh_token;

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/refresh', () => {
    it('deve retornar novo access_token com refresh_token válido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.access_token).toBeDefined();
      expect(typeof res.body.data.access_token).toBe('string');
    });

    it('deve rejeitar refresh_token inválido com 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'token-invalido' })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('deve invalidar o refresh_token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // Após logout, o mesmo refresh_token não pode mais ser usado
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
