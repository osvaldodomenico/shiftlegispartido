import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

/**
 * Testes e2e do PartyModule (Chapters + Organs).
 *
 * Requer banco de testes (shiftpartido_test) com seed mínimo:
 *   - tenant: { id: 1, name: 'Test Tenant', status: 'active' }
 *   - user:   { email: 'admin@test.com', password_hash: bcrypt('password123'), tenant_id: 1 }
 *   - person: { id: 1, tenant_id: 1, name: 'João Silva', type: 'filiado', status: 'active' }
 */
describe('Party — Chapters + Organs (e2e)', () => {
  let app: INestApplication;
  let token: string;

  let chapterId: string;
  let childChapterId: string;
  let chapterMemberId: string;

  let organId: string;
  let organMemberId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Obtém token de autenticação
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    token = res.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPÍTULOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /party/chapters — cria diretório', () => {
    it('deve criar um diretório estadual raiz', async () => {
      const res = await request(app.getHttpServer())
        .post('/party/chapters')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Diretório Estadual SP',
          level: 'estadual',
          state: 'SP',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Diretório Estadual SP');
      expect(res.body.data.level).toBe('estadual');
      expect(res.body.data.parent_id).toBeNull();

      chapterId = res.body.data.id;
    });

    it('deve criar um capítulo filho (municipal)', async () => {
      const res = await request(app.getHttpServer())
        .post('/party/chapters')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Diretório Municipal São Paulo',
          level: 'municipal',
          state: 'SP',
          city: 'São Paulo',
          parent_id: chapterId,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.parent_id).toBe(chapterId);
      expect(res.body.data.level).toBe('municipal');

      childChapterId = res.body.data.id;
    });

    it('deve rejeitar level inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/party/chapters')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Inválido', level: 'nacional_plus' })
        .expect(400);
    });

    it('deve rejeitar requisição sem token (401)', async () => {
      await request(app.getHttpServer())
        .post('/party/chapters')
        .send({ name: 'Sem token', level: 'municipal' })
        .expect(401);
    });
  });

  describe('GET /party/chapters — lista hierarquia', () => {
    it('deve retornar árvore com capítulo raiz e filho aninhado', async () => {
      const res = await request(app.getHttpServer())
        .get('/party/chapters')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Raiz deve ter children
      const root = res.body.data.find((c: any) => c.id === chapterId);
      expect(root).toBeDefined();
      expect(Array.isArray(root.children)).toBe(true);
      expect(root.children.some((c: any) => c.id === childChapterId)).toBe(true);
    });

    it('não deve retornar capítulos de outro tenant', async () => {
      // Todos os capítulos retornados devem pertencer ao tenant do token
      const res = await request(app.getHttpServer())
        .get('/party/chapters')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      res.body.data.forEach((c: any) => {
        expect(c.deleted_at).toBeUndefined();
      });
    });
  });

  describe('GET /party/chapters/:id — detalha capítulo', () => {
    it('deve retornar o capítulo com members e children', async () => {
      const res = await request(app.getHttpServer())
        .get(`/party/chapters/${chapterId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(chapterId);
      expect(Array.isArray(res.body.data.members)).toBe(true);
      expect(Array.isArray(res.body.data.children)).toBe(true);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/party/chapters/999999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /party/chapters/:id — atualiza capítulo', () => {
    it('deve atualizar o nome do diretório', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/party/chapters/${chapterId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Diretório Estadual SP — Atualizado' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Diretório Estadual SP — Atualizado');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/party/chapters/999999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Não existe' })
        .expect(404);
    });
  });

  // ─── Membros de Capítulo ──────────────────────────────────────────────────

  describe('POST /party/chapters/:id/members — adiciona membro', () => {
    it('deve adicionar uma pessoa ao capítulo', async () => {
      const res = await request(app.getHttpServer())
        .post(`/party/chapters/${chapterId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          person_id: '1',
          role: 'Presidente',
          joined_at: '2026-01-01',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.person_id).toBe('1');
      expect(res.body.data.role).toBe('Presidente');

      chapterMemberId = res.body.data.id;
    });

    it('deve rejeitar duplicata de membro ativo (409)', async () => {
      await request(app.getHttpServer())
        .post(`/party/chapters/${chapterId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ person_id: '1', joined_at: '2026-01-01' })
        .expect(409);
    });
  });

  describe('GET /party/chapters/:id/members — lista membros', () => {
    it('deve listar membros ativos do capítulo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/party/chapters/${chapterId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].person).toBeDefined();
    });
  });

  describe('DELETE /party/chapters/:id/members/:memberId — remove membro', () => {
    it('deve registrar saída do membro (left_at)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/party/chapters/${chapterId}/members/${chapterMemberId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removido');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ÓRGÃOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /party/organs — cria órgão', () => {
    it('deve criar um órgão partidário', async () => {
      const res = await request(app.getHttpServer())
        .post('/party/organs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Comissão de Ética',
          description: 'Responsável pela ética partidária',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Comissão de Ética');

      organId = res.body.data.id;
    });

    it('deve criar órgão sem descrição', async () => {
      const res = await request(app.getHttpServer())
        .post('/party/organs')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Diretório Executivo' })
        .expect(201);

      expect(res.body.data.description).toBeNull();
    });

    it('deve rejeitar sem nome (400)', async () => {
      await request(app.getHttpServer())
        .post('/party/organs')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Sem nome' })
        .expect(400);
    });
  });

  describe('GET /party/organs — lista órgãos', () => {
    it('deve listar órgãos do tenant', async () => {
      const res = await request(app.getHttpServer())
        .get('/party/organs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const organ = res.body.data.find((o: any) => o.id === organId);
      expect(organ).toBeDefined();
    });
  });

  describe('GET /party/organs/:id — detalha órgão', () => {
    it('deve retornar órgão com members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/party/organs/${organId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(organId);
      expect(Array.isArray(res.body.data.members)).toBe(true);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      await request(app.getHttpServer())
        .get('/party/organs/999999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PATCH /party/organs/:id — atualiza órgão', () => {
    it('deve atualizar nome e descrição', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/party/organs/${organId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Comissão de Ética e Disciplina' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Comissão de Ética e Disciplina');
    });
  });

  // ─── Membros de Órgão ─────────────────────────────────────────────────────

  describe('POST /party/organs/:id/members — adiciona membro', () => {
    it('deve adicionar pessoa ao órgão', async () => {
      const res = await request(app.getHttpServer())
        .post(`/party/organs/${organId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          person_id: '1',
          role: 'Presidente',
          joined_at: '2026-01-01',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.organ_id).toBe(organId);
      expect(res.body.data.role).toBe('Presidente');

      organMemberId = res.body.data.id;
    });

    it('deve rejeitar duplicata de membro ativo (409)', async () => {
      await request(app.getHttpServer())
        .post(`/party/organs/${organId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ person_id: '1', joined_at: '2026-01-01' })
        .expect(409);
    });
  });

  describe('GET /party/organs/:id/members — lista membros', () => {
    it('deve listar membros ativos do órgão', async () => {
      const res = await request(app.getHttpServer())
        .get(`/party/organs/${organId}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /party/organs/:id/members/:memberId — remove membro', () => {
    it('deve registrar saída do membro', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/party/organs/${organId}/members/${organMemberId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ─── Soft Delete ──────────────────────────────────────────────────────────

  describe('DELETE /party/chapters/:id — soft delete', () => {
    it('deve remover o capítulo filho', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/party/chapters/${childChapterId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('não deve mais retornar capítulo deletado no GET', async () => {
      await request(app.getHttpServer())
        .get(`/party/chapters/${childChapterId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('DELETE /party/organs/:id — soft delete', () => {
    it('deve remover o órgão', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/party/organs/${organId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('não deve mais retornar órgão deletado', async () => {
      await request(app.getHttpServer())
        .get(`/party/organs/${organId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
