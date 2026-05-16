import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

/**
 * Faz login e retorna { access_token, refresh_token }.
 * Usado nos testes e2e para obter tokens sem mock.
 */
export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    access_token: res.body.data.access_token,
    refresh_token: res.body.data.refresh_token,
  };
}
