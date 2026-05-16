# Electoral + Party Backend Modules — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all Electoral, Party, and Mandate NestJS modules with TDD

**Architecture:** NestJS modules following existing patterns. Elections contain campaigns; campaigns have team, contracts, schedule, and TSE reports as sub-resources.

**Tech Stack:** NestJS 10, Prisma 5, MySQL, Jest, Supertest

---

## Existing Patterns (follow exactly)

- **Module structure:** `module.ts` + `controller.ts` + `service.ts` + `dto/` folder
- **Module providers:** `[Service, PrismaService, PermissionsService]`
- **tenantId:** always `actor.tenantId` from `@CurrentUser() actor: JwtPayload`
- **Soft delete:** all `findMany`/`findFirst` include `deleted_at: null`
- **Atomic writes:** `updateMany({ where: { id, tenant_id, deleted_at: null } })` then check `count === 0` → throw `NotFoundException`
- **Audit:** call `this.audit(...)` after every create/update/delete, writing to `audit_logs`
- **Response shape:** `{ data, message }` on success (global interceptor wraps with `success: true`)
- **DTO validation:** `class-validator` + `@Type(() => Number)` for numeric fields
- **UUID IDs:** all new models use `String` UUIDs — use plain `@Param('id')`, NOT `ParseIntPipe`
- **Imports:** `import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'`
- **Roles decorator:** `import { Roles } from '../../common/decorators/roles.decorator'`

---

## Chunk 1 — ElectionsModule

### 1.1 — Write failing e2e test

- [ ] Create `backend/test/electoral/elections.e2e-spec.ts`:

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Elections (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = res.body.data.access_token;
  });

  afterAll(async () => { await app.close(); });

  it('POST /elections — creates election', async () => {
    const res = await request(app.getHttpServer())
      .post('/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Eleições Municipais 2026', year: 2026, type: 'municipal' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('planejamento');
    createdId = res.body.data.id;
  });

  it('GET /elections — lists elections', async () => {
    const res = await request(app.getHttpServer())
      .get('/elections')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((e: any) => e.id === createdId)).toBe(true);
  });

  it('PATCH /elections/:id — updates election', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'em_andamento' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('em_andamento');
  });

  it('DELETE /elections/:id — soft deletes election', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/elections/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const list = await request(app.getHttpServer())
      .get('/elections')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data.some((e: any) => e.id === createdId)).toBe(false);
  });

  it('POST /elections — rejects invalid type', async () => {
    const res = await request(app.getHttpServer())
      .post('/elections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', year: 2026, type: 'invalido' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] Run test — must FAIL (module not yet implemented):
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=elections.e2e --forceExit 2>&1 | tail -20
  ```

### 1.2 — Implement ElectionsModule

- [ ] Create `backend/src/modules/elections/dto/create-election.dto.ts`:

```typescript
import { IsString, IsInt, IsEnum, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ElectionType {
  municipal = 'municipal',
  estadual = 'estadual',
  federal = 'federal',
}

export enum ElectionStatus {
  planejamento = 'planejamento',
  em_andamento = 'em_andamento',
  encerrada = 'encerrada',
}

export class CreateElectionDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year: number;

  @IsEnum(ElectionType)
  type: ElectionType;
}
```

- [ ] Create `backend/src/modules/elections/dto/update-election.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateElectionDto, ElectionStatus } from './create-election.dto';

export class UpdateElectionDto extends PartialType(CreateElectionDto) {
  @IsEnum(ElectionStatus)
  @IsOptional()
  status?: ElectionStatus;
}
```

- [ ] Create `backend/src/modules/elections/elections.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

const ELECTION_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  year: true,
  type: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class ElectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateElectionDto, actor: JwtPayload) {
    const election = await this.prisma.elections.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        year: dto.year,
        type: dto.type as any,
      },
      select: ELECTION_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'CREATE_ELECTION', election.id, {
      name: election.name,
      year: election.year,
      type: election.type,
    });

    return { data: election, message: 'Eleição criada com sucesso' };
  }

  async findAll(actor: JwtPayload) {
    const elections = await this.prisma.elections.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: ELECTION_SELECT,
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
    return { data: elections };
  }

  async findOne(id: string, actor: JwtPayload) {
    const election = await this.prisma.elections.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: ELECTION_SELECT,
    });
    if (!election) throw new NotFoundException('Eleição não encontrada');
    return { data: election };
  }

  async update(id: string, dto: UpdateElectionDto, actor: JwtPayload) {
    const count = await this.prisma.elections.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Eleição não encontrada');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_ELECTION', id, dto);
    return this.findOne(id, actor);
  }

  async remove(id: string, actor: JwtPayload) {
    const count = await this.prisma.elections.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Eleição não encontrada');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_ELECTION', id, {});
    return { message: 'Eleição removida com sucesso' };
  }

  private async audit(
    tenantId: string,
    userId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        entity_type: 'election',
        entity_id: entityId,
        metadata,
      },
    });
  }
}
```

- [ ] Create `backend/src/modules/elections/elections.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateElectionDto, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.electionsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateElectionDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.electionsService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.electionsService.remove(id, actor);
  }
}
```

- [ ] Create `backend/src/modules/elections/elections.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [ElectionsController],
  providers: [ElectionsService, PrismaService, PermissionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}
```

- [ ] Add to `backend/src/app.module.ts`:
  ```typescript
  import { ElectionsModule } from './modules/elections/elections.module';
  // add ElectionsModule to @Module({ imports: [...] })
  ```

### 1.3 — Verify Chunk 1

- [ ] Run test — must PASS:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=elections.e2e --forceExit 2>&1 | tail -20
  ```
- [ ] Commit:
  ```bash
  git add backend/src/modules/elections/ backend/test/electoral/elections.e2e-spec.ts backend/src/app.module.ts
  git commit -m "feat(electoral): ElectionsModule with TDD"
  ```

---

## Chunk 2 — CampaignsModule (CRUD + Team + Contracts + Schedule + TSE Reports)

### 2.1 — Write failing e2e tests

- [ ] Create `backend/test/electoral/campaigns.e2e-spec.ts`:

```typescript
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

  afterAll(async () => { await app.close(); });

  // ── CAMPAIGN CRUD ─────────────────────────────────────────────────────────────

  it('POST /campaigns — creates campaign', async () => {
    const res = await request(app.getHttpServer())
      .post('/campaigns')
      .set('Authorization', `Bearer ${token}`)
      .send({ election_id: electionId, people_id: peopleId, name: 'Campanha João Silva 2026', office: 'Vereador', budget: 50000 });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('planejamento');
    campaignId = res.body.data.id;
  });

  it('GET /campaigns — lists campaigns filtered by election_id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns?election_id=${electionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.id === campaignId)).toBe(true);
  });

  it('GET /campaigns/:id — returns full details with election and candidate', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.election).toBeDefined();
    expect(res.body.data.candidate).toBeDefined();
  });

  it('PATCH /campaigns/:id — updates campaign status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ativa', budget: 75000 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ativa');
  });

  // ── TEAM ─────────────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/team — adds team member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/team`)
      .set('Authorization', `Bearer ${token}`)
      .send({ people_id: peopleId, role: 'coordenador', start_date: '2026-01-01' });
    expect(res.status).toBe(201);
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

  // ── CONTRACTS ────────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/contracts — creates contract', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/contracts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ people_id: peopleId, description: 'Contrato gráfico', value: 10000, start_date: '2026-01-01' });
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

  it('PATCH /campaigns/:id/contracts/:contractId — updates status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ativo' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ativo');
  });

  it('DELETE /campaigns/:id/contracts/:contractId — soft deletes', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}/contracts/${contractId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── SCHEDULE ─────────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/schedule — creates event', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Comício Central', start_at: '2026-08-15T18:00:00Z', type: 'comicio', location: 'Praça da República' });
    expect(res.status).toBe(201);
    eventId = res.body.data.id;
  });

  it('GET /campaigns/:id/schedule — lists events', async () => {
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
      .send({ title: 'Comício Central Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Comício Central Atualizado');
  });

  it('DELETE /campaigns/:id/schedule/:eventId — soft deletes event', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}/schedule/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // ── TSE REPORTS ───────────────────────────────────────────────────────────────

  it('POST /campaigns/:id/tse-reports — creates report', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/tse-reports`)
      .set('Authorization', `Bearer ${token}`)
      .send({ period_start: '2026-01-01', period_end: '2026-06-30', report_type: 'prestacao_contas_parcial', data: { receitas: [], despesas: [] } });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('rascunho');
    reportId = res.body.data.id;
  });

  it('GET /campaigns/:id/tse-reports — lists reports', async () => {
    const res = await request(app.getHttpServer())
      .get(`/campaigns/${campaignId}/tse-reports`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((r: any) => r.id === reportId)).toBe(true);
  });

  it('PATCH /campaigns/:id/tse-reports/:reportId — updates report', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/tse-reports/${reportId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ data: { receitas: [{ desc: 'Doação', valor: 1000 }], despesas: [] } });
    expect(res.status).toBe(200);
  });

  it('POST /campaigns/:id/tse-reports/:reportId/submit — marks as submitted', async () => {
    const res = await request(app.getHttpServer())
      .post(`/campaigns/${campaignId}/tse-reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('enviado');
    expect(res.body.data.submitted_at).toBeDefined();
  });

  // ── CAMPAIGN DELETE ───────────────────────────────────────────────────────────

  it('DELETE /campaigns/:id — soft deletes campaign', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

- [ ] Run test — must FAIL:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=campaigns.e2e --forceExit 2>&1 | tail -20
  ```

### 2.2 — Create all DTOs

- [ ] Create `backend/src/modules/campaigns/dto/create-campaign.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum CampaignStatus {
  planejamento = 'planejamento',
  ativa = 'ativa',
  suspensa = 'suspensa',
  encerrada = 'encerrada',
}

export class CreateCampaignDto {
  @IsUUID()
  election_id: string;

  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  office: string;

  @IsOptional()
  @Type(() => Number)
  budget?: number;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/update-campaign.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCampaignDto, CampaignStatus } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/create-team-member.dto.ts`:

```typescript
import { IsString, IsUUID, IsISO8601, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeamMemberDto {
  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(100)
  role: string;

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  salary?: number;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/update-team-member.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamMemberDto } from './create-team-member.dto';
export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
```

- [ ] Create `backend/src/modules/campaigns/dto/create-contract.dto.ts`:

```typescript
import { IsString, IsUUID, IsISO8601, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContractStatus {
  rascunho = 'rascunho',
  ativo = 'ativo',
  encerrado = 'encerrado',
  cancelado = 'cancelado',
}

export class CreateContractDto {
  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @Type(() => Number)
  value: number;

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/update-contract.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { CreateContractDto, ContractStatus } from './create-contract.dto';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsISO8601()
  @IsOptional()
  signed_at?: string;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/create-schedule-event.dto.ts`:

```typescript
import { IsString, IsISO8601, IsOptional, MaxLength } from 'class-validator';

export class CreateScheduleEventDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  start_at: string;

  @IsISO8601()
  @IsOptional()
  end_at?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @MaxLength(100)
  type: string; // "comicio", "reuniao", "entrevista", "visita", etc.
}
```

- [ ] Create `backend/src/modules/campaigns/dto/update-schedule-event.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleEventDto } from './create-schedule-event.dto';
export class UpdateScheduleEventDto extends PartialType(CreateScheduleEventDto) {}
```

- [ ] Create `backend/src/modules/campaigns/dto/create-tse-report.dto.ts`:

```typescript
import { IsString, IsISO8601, IsObject, MaxLength } from 'class-validator';

export class CreateTseReportDto {
  @IsISO8601()
  period_start: string;

  @IsISO8601()
  period_end: string;

  @IsString()
  @MaxLength(100)
  report_type: string; // "prestacao_contas_parcial", "prestacao_contas_final"

  @IsObject()
  data: Record<string, any>;
}
```

- [ ] Create `backend/src/modules/campaigns/dto/update-tse-report.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTseReportDto } from './create-tse-report.dto';
export class UpdateTseReportDto extends PartialType(CreateTseReportDto) {}
```

### 2.3 — Implement CampaignsService

- [ ] Create `backend/src/modules/campaigns/campaigns.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateScheduleEventDto } from './dto/create-schedule-event.dto';
import { UpdateScheduleEventDto } from './dto/update-schedule-event.dto';
import { CreateTseReportDto } from './dto/create-tse-report.dto';
import { UpdateTseReportDto } from './dto/update-tse-report.dto';

const CAMPAIGN_LIST_SELECT = {
  id: true, tenant_id: true, election_id: true, people_id: true,
  name: true, office: true, budget: true, status: true,
  created_at: true, updated_at: true,
} as const;

const CAMPAIGN_DETAIL_SELECT = {
  id: true, tenant_id: true, election_id: true, people_id: true,
  name: true, office: true, budget: true, status: true,
  created_at: true, updated_at: true,
  election: { select: { id: true, name: true, year: true, type: true } },
  candidate: { select: { id: true, name: true, email: true } },
} as const;

const TEAM_SELECT = {
  id: true, campaign_id: true, people_id: true, role: true,
  start_date: true, end_date: true, salary: true, created_at: true,
  person: { select: { id: true, name: true, email: true } },
} as const;

const CONTRACT_SELECT = {
  id: true, campaign_id: true, people_id: true, description: true,
  value: true, status: true, signed_at: true, start_date: true,
  end_date: true, created_at: true,
  supplier: { select: { id: true, name: true, email: true } },
} as const;

const SCHEDULE_SELECT = {
  id: true, campaign_id: true, title: true, description: true,
  start_at: true, end_at: true, location: true, type: true, created_at: true,
} as const;

const TSE_SELECT = {
  id: true, campaign_id: true, period_start: true, period_end: true,
  report_type: true, status: true, data: true, submitted_at: true, created_at: true,
} as const;

const TSE_LIST_SELECT = {
  id: true, campaign_id: true, period_start: true, period_end: true,
  report_type: true, status: true, submitted_at: true, created_at: true,
} as const;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CAMPAIGN CRUD ─────────────────────────────────────────────────────────────

  async create(dto: CreateCampaignDto, actor: JwtPayload) {
    const election = await this.prisma.elections.findFirst({
      where: { id: dto.election_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!election) throw new BadRequestException('Eleição não encontrada neste tenant');

    const person = await this.prisma.people.findFirst({
      where: { id: dto.people_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new BadRequestException('Candidato não encontrado neste tenant');

    const campaign = await this.prisma.campaigns.create({
      data: {
        tenant_id: actor.tenantId,
        election_id: dto.election_id,
        people_id: dto.people_id,
        name: dto.name,
        office: dto.office,
        budget: dto.budget ?? 0,
      },
      select: CAMPAIGN_LIST_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'CREATE_CAMPAIGN', campaign.id, {
      name: campaign.name, office: campaign.office,
    });
    return { data: campaign, message: 'Campanha criada com sucesso' };
  }

  async findAll(actor: JwtPayload, electionId?: string) {
    const campaigns = await this.prisma.campaigns.findMany({
      where: {
        tenant_id: actor.tenantId,
        deleted_at: null,
        ...(electionId && { election_id: electionId }),
      },
      select: CAMPAIGN_LIST_SELECT,
      orderBy: { name: 'asc' },
    });
    return { data: campaigns };
  }

  async findOne(id: string, actor: JwtPayload) {
    const campaign = await this.prisma.campaigns.findFirst({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      select: CAMPAIGN_DETAIL_SELECT,
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return { data: campaign };
  }

  async update(id: string, dto: UpdateCampaignDto, actor: JwtPayload) {
    const count = await this.prisma.campaigns.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.office !== undefined && { office: dto.office }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Campanha não encontrada');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_CAMPAIGN', id, dto);
    return this.findOne(id, actor);
  }

  async remove(id: string, actor: JwtPayload) {
    const count = await this.prisma.campaigns.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Campanha não encontrada');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_CAMPAIGN', id, {});
    return { message: 'Campanha removida com sucesso' };
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────────

  async addTeamMember(campaignId: string, dto: CreateTeamMemberDto, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const member = await this.prisma.campaign_team.create({
      data: {
        tenant_id: actor.tenantId,
        campaign_id: campaignId,
        people_id: dto.people_id,
        role: dto.role,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        salary: dto.salary ?? null,
      },
      select: TEAM_SELECT,
    });
    await this.audit(actor.tenantId, actor.userId, 'ADD_TEAM_MEMBER', member.id, { role: member.role });
    return { data: member, message: 'Membro adicionado à equipe' };
  }

  async listTeam(campaignId: string, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const members = await this.prisma.campaign_team.findMany({
      where: { campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      select: TEAM_SELECT,
    });
    return { data: members };
  }

  async updateTeamMember(
    campaignId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
    actor: JwtPayload,
  ) {
    const count = await this.prisma.campaign_team.updateMany({
      where: { id: memberId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.start_date !== undefined && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date !== undefined && { end_date: new Date(dto.end_date) }),
        ...(dto.salary !== undefined && { salary: dto.salary }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Membro não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_TEAM_MEMBER', memberId, dto);
    const member = await this.prisma.campaign_team.findFirst({
      where: { id: memberId, deleted_at: null },
      select: TEAM_SELECT,
    });
    return { data: member, message: 'Membro atualizado' };
  }

  async removeTeamMember(campaignId: string, memberId: string, actor: JwtPayload) {
    const count = await this.prisma.campaign_team.updateMany({
      where: { id: memberId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Membro não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'REMOVE_TEAM_MEMBER', memberId, {});
    return { message: 'Membro removido da equipe' };
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────────

  async createContract(campaignId: string, dto: CreateContractDto, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const contract = await this.prisma.campaign_contracts.create({
      data: {
        tenant_id: actor.tenantId,
        campaign_id: campaignId,
        people_id: dto.people_id,
        description: dto.description,
        value: dto.value,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
      },
      select: CONTRACT_SELECT,
    });
    await this.audit(actor.tenantId, actor.userId, 'CREATE_CONTRACT', contract.id, {
      description: contract.description, value: contract.value,
    });
    return { data: contract, message: 'Contrato criado com sucesso' };
  }

  async listContracts(campaignId: string, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const contracts = await this.prisma.campaign_contracts.findMany({
      where: { campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      select: CONTRACT_SELECT,
      orderBy: { created_at: 'desc' },
    });
    return { data: contracts };
  }

  async updateContract(
    campaignId: string,
    contractId: string,
    dto: UpdateContractDto,
    actor: JwtPayload,
  ) {
    const count = await this.prisma.campaign_contracts.updateMany({
      where: { id: contractId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.signed_at !== undefined && { signed_at: new Date(dto.signed_at) }),
        ...(dto.start_date !== undefined && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date !== undefined && { end_date: new Date(dto.end_date) }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Contrato não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_CONTRACT', contractId, dto);
    const contract = await this.prisma.campaign_contracts.findFirst({
      where: { id: contractId, deleted_at: null },
      select: CONTRACT_SELECT,
    });
    return { data: contract, message: 'Contrato atualizado' };
  }

  async removeContract(campaignId: string, contractId: string, actor: JwtPayload) {
    const count = await this.prisma.campaign_contracts.updateMany({
      where: { id: contractId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Contrato não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_CONTRACT', contractId, {});
    return { message: 'Contrato removido com sucesso' };
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────────────

  async createScheduleEvent(campaignId: string, dto: CreateScheduleEventDto, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const event = await this.prisma.campaign_schedule.create({
      data: {
        tenant_id: actor.tenantId,
        campaign_id: campaignId,
        title: dto.title,
        description: dto.description ?? null,
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : null,
        location: dto.location ?? null,
        type: dto.type,
      },
      select: SCHEDULE_SELECT,
    });
    await this.audit(actor.tenantId, actor.userId, 'CREATE_SCHEDULE_EVENT', event.id, { title: event.title });
    return { data: event, message: 'Evento criado com sucesso' };
  }

  async listSchedule(campaignId: string, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const events = await this.prisma.campaign_schedule.findMany({
      where: { campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      select: SCHEDULE_SELECT,
      orderBy: { start_at: 'asc' },
    });
    return { data: events };
  }

  async updateScheduleEvent(
    campaignId: string,
    eventId: string,
    dto: UpdateScheduleEventDto,
    actor: JwtPayload,
  ) {
    const count = await this.prisma.campaign_schedule.updateMany({
      where: { id: eventId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.start_at !== undefined && { start_at: new Date(dto.start_at) }),
        ...(dto.end_at !== undefined && { end_at: new Date(dto.end_at) }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.type !== undefined && { type: dto.type }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Evento não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_SCHEDULE_EVENT', eventId, dto);
    const event = await this.prisma.campaign_schedule.findFirst({
      where: { id: eventId },
      select: SCHEDULE_SELECT,
    });
    return { data: event, message: 'Evento atualizado' };
  }

  async removeScheduleEvent(campaignId: string, eventId: string, actor: JwtPayload) {
    const count = await this.prisma.campaign_schedule.updateMany({
      where: { id: eventId, campaign_id: campaignId, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Evento não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_SCHEDULE_EVENT', eventId, {});
    return { message: 'Evento removido com sucesso' };
  }

  // ── TSE REPORTS ───────────────────────────────────────────────────────────────

  async createTseReport(campaignId: string, dto: CreateTseReportDto, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const report = await this.prisma.tse_reports.create({
      data: {
        tenant_id: actor.tenantId,
        campaign_id: campaignId,
        period_start: new Date(dto.period_start),
        period_end: new Date(dto.period_end),
        report_type: dto.report_type,
        status: 'rascunho',
        data: dto.data,
      },
      select: TSE_SELECT,
    });
    await this.audit(actor.tenantId, actor.userId, 'CREATE_TSE_REPORT', report.id, { report_type: report.report_type });
    return { data: report, message: 'Relatório TSE criado com sucesso' };
  }

  async listTseReports(campaignId: string, actor: JwtPayload) {
    await this.assertCampaignOwned(campaignId, actor.tenantId);
    const reports = await this.prisma.tse_reports.findMany({
      where: { campaign_id: campaignId, tenant_id: actor.tenantId },
      select: TSE_LIST_SELECT,
      orderBy: { created_at: 'desc' },
    });
    return { data: reports };
  }

  async updateTseReport(
    campaignId: string,
    reportId: string,
    dto: UpdateTseReportDto,
    actor: JwtPayload,
  ) {
    const existing = await this.prisma.tse_reports.findFirst({
      where: { id: reportId, campaign_id: campaignId, tenant_id: actor.tenantId },
    });
    if (!existing) throw new NotFoundException('Relatório não encontrado');
    if (existing.status === 'enviado') {
      throw new BadRequestException('Relatório já enviado não pode ser editado');
    }
    await this.prisma.tse_reports.update({
      where: { id: reportId },
      data: {
        ...(dto.period_start !== undefined && { period_start: new Date(dto.period_start) }),
        ...(dto.period_end !== undefined && { period_end: new Date(dto.period_end) }),
        ...(dto.report_type !== undefined && { report_type: dto.report_type }),
        ...(dto.data !== undefined && { data: dto.data }),
      },
    });
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_TSE_REPORT', reportId, dto);
    const report = await this.prisma.tse_reports.findFirst({
      where: { id: reportId },
      select: TSE_SELECT,
    });
    return { data: report, message: 'Relatório atualizado' };
  }

  async submitTseReport(campaignId: string, reportId: string, actor: JwtPayload) {
    const existing = await this.prisma.tse_reports.findFirst({
      where: { id: reportId, campaign_id: campaignId, tenant_id: actor.tenantId },
    });
    if (!existing) throw new NotFoundException('Relatório não encontrado');
    if (existing.status === 'enviado') throw new BadRequestException('Relatório já enviado');

    await this.prisma.tse_reports.update({
      where: { id: reportId },
      data: { status: 'enviado', submitted_at: new Date() },
    });
    await this.audit(actor.tenantId, actor.userId, 'SUBMIT_TSE_REPORT', reportId, {});
    const report = await this.prisma.tse_reports.findFirst({
      where: { id: reportId },
      select: TSE_SELECT,
    });
    return { data: report, message: 'Relatório enviado ao TSE com sucesso' };
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────────

  private async assertCampaignOwned(campaignId: string, tenantId: string) {
    const campaign = await this.prisma.campaigns.findFirst({
      where: { id: campaignId, tenant_id: tenantId, deleted_at: null },
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
  }

  private async audit(
    tenantId: string,
    userId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    await this.prisma.audit_logs.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        action,
        entity_type: 'campaign',
        entity_id: entityId,
        metadata,
      },
    });
  }
}
```

### 2.4 — Implement CampaignsController

- [ ] Create `backend/src/modules/campaigns/campaigns.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateScheduleEventDto } from './dto/create-schedule-event.dto';
import { UpdateScheduleEventDto } from './dto/update-schedule-event.dto';
import { CreateTseReportDto } from './dto/create-tse-report.dto';
import { UpdateTseReportDto } from './dto/update-tse-report.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCampaignDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload, @Query('election_id') electionId?: string) {
    return this.campaignsService.findAll(actor, electionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.findOne(id, actor);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.remove(id, actor);
  }

  // ── TEAM ─────────────────────────────────────────────────────────────────────

  @Post(':id/team')
  @HttpCode(HttpStatus.CREATED)
  addTeamMember(@Param('id') id: string, @Body() dto: CreateTeamMemberDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.addTeamMember(id, dto, actor);
  }

  @Get(':id/team')
  listTeam(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listTeam(id, actor);
  }

  @Patch(':id/team/:memberId')
  updateTeamMember(
    @Param('id') id: string, @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberDto, @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateTeamMember(id, memberId, dto, actor);
  }

  @Delete(':id/team/:memberId')
  @HttpCode(HttpStatus.OK)
  removeTeamMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.removeTeamMember(id, memberId, actor);
  }

  // ── CONTRACTS ────────────────────────────────────────────────────────────────

  @Post(':id/contracts')
  @HttpCode(HttpStatus.CREATED)
  createContract(@Param('id') id: string, @Body() dto: CreateContractDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.createContract(id, dto, actor);
  }

  @Get(':id/contracts')
  listContracts(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listContracts(id, actor);
  }

  @Patch(':id/contracts/:contractId')
  updateContract(
    @Param('id') id: string, @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto, @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateContract(id, contractId, dto, actor);
  }

  @Delete(':id/contracts/:contractId')
  @HttpCode(HttpStatus.OK)
  removeContract(@Param('id') id: string, @Param('contractId') contractId: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.removeContract(id, contractId, actor);
  }

  // ── SCHEDULE ─────────────────────────────────────────────────────────────────

  @Post(':id/schedule')
  @HttpCode(HttpStatus.CREATED)
  createScheduleEvent(@Param('id') id: string, @Body() dto: CreateScheduleEventDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.createScheduleEvent(id, dto, actor);
  }

  @Get(':id/schedule')
  listSchedule(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listSchedule(id, actor);
  }

  @Patch(':id/schedule/:eventId')
  updateScheduleEvent(
    @Param('id') id: string, @Param('eventId') eventId: string,
    @Body() dto: UpdateScheduleEventDto, @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateScheduleEvent(id, eventId, dto, actor);
  }

  @Delete(':id/schedule/:eventId')
  @HttpCode(HttpStatus.OK)
  removeScheduleEvent(@Param('id') id: string, @Param('eventId') eventId: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.removeScheduleEvent(id, eventId, actor);
  }

  // ── TSE REPORTS ───────────────────────────────────────────────────────────────

  @Post(':id/tse-reports')
  @HttpCode(HttpStatus.CREATED)
  createTseReport(@Param('id') id: string, @Body() dto: CreateTseReportDto, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.createTseReport(id, dto, actor);
  }

  @Get(':id/tse-reports')
  listTseReports(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.listTseReports(id, actor);
  }

  @Patch(':id/tse-reports/:reportId')
  updateTseReport(
    @Param('id') id: string, @Param('reportId') reportId: string,
    @Body() dto: UpdateTseReportDto, @CurrentUser() actor: JwtPayload,
  ) {
    return this.campaignsService.updateTseReport(id, reportId, dto, actor);
  }

  @Post(':id/tse-reports/:reportId/submit')
  @HttpCode(HttpStatus.OK)
  submitTseReport(@Param('id') id: string, @Param('reportId') reportId: string, @CurrentUser() actor: JwtPayload) {
    return this.campaignsService.submitTseReport(id, reportId, actor);
  }
}
```

- [ ] Create `backend/src/modules/campaigns/campaigns.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, PrismaService, PermissionsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
```

- [ ] Add to `backend/src/app.module.ts`:
  ```typescript
  import { CampaignsModule } from './modules/campaigns/campaigns.module';
  // add CampaignsModule to imports
  ```

### 2.5 — Verify Chunk 2

- [ ] Run test — must PASS:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=campaigns.e2e --forceExit 2>&1 | tail -20
  ```
- [ ] Commit:
  ```bash
  git add backend/src/modules/campaigns/ backend/test/electoral/campaigns.e2e-spec.ts backend/src/app.module.ts
  git commit -m "feat(electoral): CampaignsModule with team, contracts, schedule, TSE reports (TDD)"
  ```

---

## Chunk 3 — PartyModule (Chapters + Organs)

### 3.1 — Write failing e2e test

- [ ] Create `backend/test/electoral/party.e2e-spec.ts`:

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Party (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let chapterId: string;
  let childChapterId: string;
  let organId: string;
  let peopleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = loginRes.body.data.access_token;

    const pRes = await request(app.getHttpServer())
      .get('/people?limit=1')
      .set('Authorization', `Bearer ${token}`);
    peopleId = pRes.body.data[0]?.id;
  });

  afterAll(async () => { await app.close(); });

  it('POST /party/chapters — creates root chapter', async () => {
    const res = await request(app.getHttpServer())
      .post('/party/chapters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Diretório Municipal SP', city: 'São Paulo', state: 'SP' });
    expect(res.status).toBe(201);
    chapterId = res.body.data.id;
  });

  it('POST /party/chapters — creates child chapter', async () => {
    const res = await request(app.getHttpServer())
      .post('/party/chapters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Zona Sul SP', city: 'São Paulo', state: 'SP', parent_id: chapterId });
    expect(res.status).toBe(201);
    childChapterId = res.body.data.id;
  });

  it('GET /party/chapters — returns tree with children nested', async () => {
    const res = await request(app.getHttpServer())
      .get('/party/chapters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const root = res.body.data.find((c: any) => c.id === chapterId);
    expect(root).toBeDefined();
    expect(root.children.some((c: any) => c.id === childChapterId)).toBe(true);
  });

  it('PATCH /party/chapters/:id — updates chapter', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/party/chapters/${chapterId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Diretório Municipal São Paulo' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Diretório Municipal São Paulo');
  });

  it('POST /party/chapters/:id/members — adds member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/party/chapters/${chapterId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ people_id: peopleId, role: 'presidente' });
    expect(res.status).toBe(201);
  });

  it('DELETE /party/chapters/:id/members/:peopleId — removes member', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/party/chapters/${chapterId}/members/${peopleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /party/chapters/:id — soft deletes chapter', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/party/chapters/${childChapterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('POST /party/organs — creates organ', async () => {
    const res = await request(app.getHttpServer())
      .post('/party/organs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Executiva Municipal', description: 'Órgão executivo municipal' });
    expect(res.status).toBe(201);
    organId = res.body.data.id;
  });

  it('GET /party/organs — lists organs', async () => {
    const res = await request(app.getHttpServer())
      .get('/party/organs')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((o: any) => o.id === organId)).toBe(true);
  });

  it('PATCH /party/organs/:id — updates organ', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/party/organs/${organId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Executiva Municipal SP' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Executiva Municipal SP');
  });

  it('POST /party/organs/:id/members — adds member', async () => {
    const res = await request(app.getHttpServer())
      .post(`/party/organs/${organId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ people_id: peopleId, role: 'presidente', start_date: '2026-01-01' });
    expect(res.status).toBe(201);
  });

  it('DELETE /party/organs/:id/members/:peopleId — removes member', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/party/organs/${organId}/members/${peopleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /party/organs/:id — soft deletes organ', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/party/organs/${organId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

- [ ] Run test — must FAIL:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=party.e2e --forceExit 2>&1 | tail -20
  ```

### 3.2 — Implement PartyModule

- [ ] Create `backend/src/modules/party/dto/create-chapter.dto.ts`:

```typescript
import { IsString, IsOptional, IsUUID, MaxLength, Length } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @Length(2, 2)
  state: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;
}
```

- [ ] Create `backend/src/modules/party/dto/update-chapter.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateChapterDto } from './create-chapter.dto';
export class UpdateChapterDto extends PartialType(CreateChapterDto) {}
```

- [ ] Create `backend/src/modules/party/dto/add-chapter-member.dto.ts`:

```typescript
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class AddChapterMemberDto {
  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  role?: string;
}
```

- [ ] Create `backend/src/modules/party/dto/create-organ.dto.ts`:

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateOrganDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

- [ ] Create `backend/src/modules/party/dto/update-organ.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganDto } from './create-organ.dto';
export class UpdateOrganDto extends PartialType(CreateOrganDto) {}
```

- [ ] Create `backend/src/modules/party/dto/add-organ-member.dto.ts`:

```typescript
import { IsUUID, IsString, IsISO8601, IsOptional, MaxLength } from 'class-validator';

export class AddOrganMemberDto {
  @IsUUID()
  people_id: string;

  @IsString()
  @MaxLength(100)
  role: string;

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;
}
```

- [ ] Create `backend/src/modules/party/party.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddChapterMemberDto } from './dto/add-chapter-member.dto';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { AddOrganMemberDto } from './dto/add-organ-member.dto';

const CHAPTER_SELECT = {
  id: true, tenant_id: true, name: true, city: true, state: true,
  parent_id: true, created_at: true, updated_at: true,
} as const;

const ORGAN_SELECT = {
  id: true, tenant_id: true, name: true, description: true,
  created_at: true, updated_at: true,
} as const;

@Injectable()
export class PartyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CHAPTERS ──────────────────────────────────────────────────────────────────

  async createChapter(dto: CreateChapterDto, actor: JwtPayload) {
    if (dto.parent_id) {
      const parent = await this.prisma.party_chapters.findFirst({
        where: { id: dto.parent_id, tenant_id: actor.tenantId, deleted_at: null },
      });
      if (!parent) throw new NotFoundException('Diretório pai não encontrado');
    }

    const chapter = await this.prisma.party_chapters.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        city: dto.city,
        state: dto.state,
        parent_id: dto.parent_id ?? null,
      },
      select: CHAPTER_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'CREATE_CHAPTER', chapter.id, { name: chapter.name });
    return { data: chapter, message: 'Diretório criado com sucesso' };
  }

  // Retorna apenas raízes com children aninhados (1 nível)
  async findAllChapters(actor: JwtPayload) {
    const all = await this.prisma.party_chapters.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: {
        ...CHAPTER_SELECT,
        children: { select: CHAPTER_SELECT, where: { deleted_at: null } },
      },
      orderBy: { name: 'asc' },
    });
    return { data: all.filter((c) => c.parent_id === null) };
  }

  async updateChapter(id: string, dto: UpdateChapterDto, actor: JwtPayload) {
    const count = await this.prisma.party_chapters.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.parent_id !== undefined && { parent_id: dto.parent_id }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Diretório não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_CHAPTER', id, dto);
    const chapter = await this.prisma.party_chapters.findFirst({ where: { id }, select: CHAPTER_SELECT });
    return { data: chapter, message: 'Diretório atualizado' };
  }

  async removeChapter(id: string, actor: JwtPayload) {
    const count = await this.prisma.party_chapters.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Diretório não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_CHAPTER', id, {});
    return { message: 'Diretório removido com sucesso' };
  }

  async addChapterMember(chapterId: string, dto: AddChapterMemberDto, actor: JwtPayload) {
    const chapter = await this.prisma.party_chapters.findFirst({
      where: { id: chapterId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!chapter) throw new NotFoundException('Diretório não encontrado');

    try {
      const member = await this.prisma.chapter_members.create({
        data: { chapter_id: chapterId, people_id: dto.people_id, role: dto.role ?? null },
        select: { id: true, chapter_id: true, people_id: true, role: true, joined_at: true },
      });
      await this.audit(actor.tenantId, actor.userId, 'ADD_CHAPTER_MEMBER', member.id, { people_id: dto.people_id });
      return { data: member, message: 'Membro adicionado ao diretório' };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Pessoa já é membro deste diretório');
      throw e;
    }
  }

  async removeChapterMember(chapterId: string, peopleId: string, actor: JwtPayload) {
    const deleted = await this.prisma.chapter_members.deleteMany({
      where: { chapter_id: chapterId, people_id: peopleId },
    });
    if (deleted.count === 0) throw new NotFoundException('Membro não encontrado neste diretório');
    await this.audit(actor.tenantId, actor.userId, 'REMOVE_CHAPTER_MEMBER', chapterId, { people_id: peopleId });
    return { message: 'Membro removido do diretório' };
  }

  // ── ORGANS ────────────────────────────────────────────────────────────────────

  async createOrgan(dto: CreateOrganDto, actor: JwtPayload) {
    const organ = await this.prisma.party_organs.create({
      data: { tenant_id: actor.tenantId, name: dto.name, description: dto.description ?? null },
      select: ORGAN_SELECT,
    });
    await this.audit(actor.tenantId, actor.userId, 'CREATE_ORGAN', organ.id, { name: organ.name });
    return { data: organ, message: 'Órgão criado com sucesso' };
  }

  async findAllOrgans(actor: JwtPayload) {
    const organs = await this.prisma.party_organs.findMany({
      where: { tenant_id: actor.tenantId, deleted_at: null },
      select: ORGAN_SELECT,
      orderBy: { name: 'asc' },
    });
    return { data: organs };
  }

  async updateOrgan(id: string, dto: UpdateOrganDto, actor: JwtPayload) {
    const count = await this.prisma.party_organs.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Órgão não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_ORGAN', id, dto);
    const organ = await this.prisma.party_organs.findFirst({ where: { id }, select: ORGAN_SELECT });
    return { data: organ, message: 'Órgão atualizado' };
  }

  async removeOrgan(id: string, actor: JwtPayload) {
    const count = await this.prisma.party_organs.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Órgão não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_ORGAN', id, {});
    return { message: 'Órgão removido com sucesso' };
  }

  async addOrganMember(organId: string, dto: AddOrganMemberDto, actor: JwtPayload) {
    const organ = await this.prisma.party_organs.findFirst({
      where: { id: organId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!organ) throw new NotFoundException('Órgão não encontrado');

    try {
      const member = await this.prisma.organ_members.create({
        data: {
          organ_id: organId,
          people_id: dto.people_id,
          role: dto.role,
          start_date: new Date(dto.start_date),
          end_date: dto.end_date ? new Date(dto.end_date) : null,
        },
        select: { id: true, organ_id: true, people_id: true, role: true, start_date: true, end_date: true },
      });
      await this.audit(actor.tenantId, actor.userId, 'ADD_ORGAN_MEMBER', member.id, { people_id: dto.people_id, role: dto.role });
      return { data: member, message: 'Membro adicionado ao órgão' };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Pessoa já é membro deste órgão');
      throw e;
    }
  }

  async removeOrganMember(organId: string, peopleId: string, actor: JwtPayload) {
    const deleted = await this.prisma.organ_members.deleteMany({
      where: { organ_id: organId, people_id: peopleId },
    });
    if (deleted.count === 0) throw new NotFoundException('Membro não encontrado neste órgão');
    await this.audit(actor.tenantId, actor.userId, 'REMOVE_ORGAN_MEMBER', organId, { people_id: peopleId });
    return { message: 'Membro removido do órgão' };
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────────

  private async audit(tenantId: string, userId: string, action: string, entityId: string, metadata: object) {
    await this.prisma.audit_logs.create({
      data: { tenant_id: tenantId, user_id: userId, action, entity_type: 'party', entity_id: entityId, metadata },
    });
  }
}
```

- [ ] Create `backend/src/modules/party/party.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PartyService } from './party.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { AddChapterMemberDto } from './dto/add-chapter-member.dto';
import { CreateOrganDto } from './dto/create-organ.dto';
import { UpdateOrganDto } from './dto/update-organ.dto';
import { AddOrganMemberDto } from './dto/add-organ-member.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('party')
export class PartyController {
  constructor(private readonly partyService: PartyService) {}

  @Post('chapters')
  @HttpCode(HttpStatus.CREATED)
  createChapter(@Body() dto: CreateChapterDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.createChapter(dto, actor);
  }

  @Get('chapters')
  findAllChapters(@CurrentUser() actor: JwtPayload) {
    return this.partyService.findAllChapters(actor);
  }

  @Patch('chapters/:id')
  updateChapter(@Param('id') id: string, @Body() dto: UpdateChapterDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.updateChapter(id, dto, actor);
  }

  @Delete('chapters/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  removeChapter(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeChapter(id, actor);
  }

  @Post('chapters/:id/members')
  @HttpCode(HttpStatus.CREATED)
  addChapterMember(@Param('id') id: string, @Body() dto: AddChapterMemberDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.addChapterMember(id, dto, actor);
  }

  @Delete('chapters/:id/members/:peopleId')
  @HttpCode(HttpStatus.OK)
  removeChapterMember(@Param('id') id: string, @Param('peopleId') peopleId: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeChapterMember(id, peopleId, actor);
  }

  @Post('organs')
  @HttpCode(HttpStatus.CREATED)
  createOrgan(@Body() dto: CreateOrganDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.createOrgan(dto, actor);
  }

  @Get('organs')
  findAllOrgans(@CurrentUser() actor: JwtPayload) {
    return this.partyService.findAllOrgans(actor);
  }

  @Patch('organs/:id')
  updateOrgan(@Param('id') id: string, @Body() dto: UpdateOrganDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.updateOrgan(id, dto, actor);
  }

  @Delete('organs/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  removeOrgan(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeOrgan(id, actor);
  }

  @Post('organs/:id/members')
  @HttpCode(HttpStatus.CREATED)
  addOrganMember(@Param('id') id: string, @Body() dto: AddOrganMemberDto, @CurrentUser() actor: JwtPayload) {
    return this.partyService.addOrganMember(id, dto, actor);
  }

  @Delete('organs/:id/members/:peopleId')
  @HttpCode(HttpStatus.OK)
  removeOrganMember(@Param('id') id: string, @Param('peopleId') peopleId: string, @CurrentUser() actor: JwtPayload) {
    return this.partyService.removeOrganMember(id, peopleId, actor);
  }
}
```

- [ ] Create `backend/src/modules/party/party.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PartyService } from './party.service';
import { PartyController } from './party.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [PartyController],
  providers: [PartyService, PrismaService, PermissionsService],
  exports: [PartyService],
})
export class PartyModule {}
```

- [ ] Add to `backend/src/app.module.ts`:
  ```typescript
  import { PartyModule } from './modules/party/party.module';
  // add PartyModule to imports
  ```

### 3.3 — Verify Chunk 3

- [ ] Run test — must PASS:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=party.e2e --forceExit 2>&1 | tail -20
  ```
- [ ] Commit:
  ```bash
  git add backend/src/modules/party/ backend/test/electoral/party.e2e-spec.ts backend/src/app.module.ts
  git commit -m "feat(party): PartyModule chapters and organs (TDD)"
  ```

---

## Chunk 4 — MandatesModule + final app.module.ts registration

### 4.1 — Write failing e2e test

- [ ] Create `backend/test/electoral/mandates.e2e-spec.ts`:

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

describe('Mandates (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let mandateId: string;
  let peopleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = loginRes.body.data.access_token;

    const pRes = await request(app.getHttpServer())
      .get('/people?limit=1')
      .set('Authorization', `Bearer ${token}`);
    peopleId = pRes.body.data[0]?.id;
  });

  afterAll(async () => { await app.close(); });

  it('POST /mandates — creates mandate', async () => {
    const res = await request(app.getHttpServer())
      .post('/mandates')
      .set('Authorization', `Bearer ${token}`)
      .send({ people_id: peopleId, office: 'Vereador', city: 'São Paulo', state: 'SP', start_date: '2025-01-01', party_code: '20' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    mandateId = res.body.data.id;
  });

  it('GET /mandates — lists mandates', async () => {
    const res = await request(app.getHttpServer())
      .get('/mandates')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.some((m: any) => m.id === mandateId)).toBe(true);
  });

  it('GET /mandates?people_id — filters by person', async () => {
    const res = await request(app.getHttpServer())
      .get(`/mandates?people_id=${peopleId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((m: any) => m.people_id === peopleId)).toBe(true);
  });

  it('PATCH /mandates/:id — updates mandate', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/mandates/${mandateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ end_date: '2028-12-31' });
    expect(res.status).toBe(200);
    expect(res.body.data.end_date).toBeDefined();
  });

  it('DELETE /mandates/:id — soft deletes mandate', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/mandates/${mandateId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const list = await request(app.getHttpServer())
      .get('/mandates')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.data.some((m: any) => m.id === mandateId)).toBe(false);
  });
});
```

- [ ] Run test — must FAIL:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=mandates.e2e --forceExit 2>&1 | tail -20
  ```

### 4.2 — Implement MandatesModule

- [ ] Create `backend/src/modules/mandates/dto/create-mandate.dto.ts`:

```typescript
import { IsString, IsUUID, IsISO8601, IsOptional, MaxLength, Length } from 'class-validator';

export class CreateMandateDto {
  @IsUUID()
  people_id: string;

  @IsUUID()
  @IsOptional()
  campaign_id?: string;

  @IsString()
  @MaxLength(100)
  office: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsString()
  @Length(2, 2)
  state: string;

  @IsISO8601()
  start_date: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  party_code?: string;
}
```

- [ ] Create `backend/src/modules/mandates/dto/update-mandate.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateMandateDto } from './create-mandate.dto';
export class UpdateMandateDto extends PartialType(CreateMandateDto) {}
```

- [ ] Create `backend/src/modules/mandates/mandates.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';

const MANDATE_SELECT = {
  id: true, tenant_id: true, people_id: true, campaign_id: true,
  office: true, city: true, state: true, start_date: true, end_date: true,
  party_code: true, created_at: true, updated_at: true,
  person: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class MandatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMandateDto, actor: JwtPayload) {
    const person = await this.prisma.people.findFirst({
      where: { id: dto.people_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada neste tenant');

    const mandate = await this.prisma.mandates.create({
      data: {
        tenant_id: actor.tenantId,
        people_id: dto.people_id,
        campaign_id: dto.campaign_id ?? null,
        office: dto.office,
        city: dto.city,
        state: dto.state,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        party_code: dto.party_code ?? null,
      },
      select: MANDATE_SELECT,
    });

    await this.audit(actor.tenantId, actor.userId, 'CREATE_MANDATE', mandate.id, { office: mandate.office, city: mandate.city });
    return { data: mandate, message: 'Mandato criado com sucesso' };
  }

  async findAll(actor: JwtPayload, peopleId?: string) {
    const mandates = await this.prisma.mandates.findMany({
      where: {
        tenant_id: actor.tenantId,
        deleted_at: null,
        ...(peopleId && { people_id: peopleId }),
      },
      select: MANDATE_SELECT,
      orderBy: { start_date: 'desc' },
    });
    return { data: mandates };
  }

  async update(id: string, dto: UpdateMandateDto, actor: JwtPayload) {
    const count = await this.prisma.mandates.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: {
        ...(dto.office !== undefined && { office: dto.office }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.start_date !== undefined && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date !== undefined && { end_date: new Date(dto.end_date) }),
        ...(dto.party_code !== undefined && { party_code: dto.party_code }),
        ...(dto.campaign_id !== undefined && { campaign_id: dto.campaign_id }),
      },
    });
    if (count.count === 0) throw new NotFoundException('Mandato não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'UPDATE_MANDATE', id, dto);
    const mandate = await this.prisma.mandates.findFirst({ where: { id }, select: MANDATE_SELECT });
    return { data: mandate, message: 'Mandato atualizado' };
  }

  async remove(id: string, actor: JwtPayload) {
    const count = await this.prisma.mandates.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (count.count === 0) throw new NotFoundException('Mandato não encontrado');
    await this.audit(actor.tenantId, actor.userId, 'DELETE_MANDATE', id, {});
    return { message: 'Mandato removido com sucesso' };
  }

  private async audit(tenantId: string, userId: string, action: string, entityId: string, metadata: object) {
    await this.prisma.audit_logs.create({
      data: { tenant_id: tenantId, user_id: userId, action, entity_type: 'mandate', entity_id: entityId, metadata },
    });
  }
}
```

- [ ] Create `backend/src/modules/mandates/mandates.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { CreateMandateDto } from './dto/create-mandate.dto';
import { UpdateMandateDto } from './dto/update-mandate.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('mandates')
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMandateDto, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload, @Query('people_id') peopleId?: string) {
    return this.mandatesService.findAll(actor, peopleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMandateDto, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.update(id, dto, actor);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.mandatesService.remove(id, actor);
  }
}
```

- [ ] Create `backend/src/modules/mandates/mandates.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { MandatesController } from './mandates.controller';
import { PrismaService } from '../../database/prisma.service';
import { PermissionsService } from '../../common/services/permissions.service';

@Module({
  controllers: [MandatesController],
  providers: [MandatesService, PrismaService, PermissionsService],
  exports: [MandatesService],
})
export class MandatesModule {}
```

### 4.3 — Final app.module.ts registration

- [ ] Ensure all four new modules are in `backend/src/app.module.ts` imports:
  ```typescript
  import { ElectionsModule } from './modules/elections/elections.module';
  import { CampaignsModule } from './modules/campaigns/campaigns.module';
  import { PartyModule } from './modules/party/party.module';
  import { MandatesModule } from './modules/mandates/mandates.module';

  @Module({
    imports: [
      // ... existing modules ...
      ElectionsModule,
      CampaignsModule,
      PartyModule,
      MandatesModule,
    ],
  })
  export class AppModule {}
  ```

### 4.4 — Verify Chunk 4

- [ ] Run mandates test — must PASS:
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=mandates.e2e --forceExit 2>&1 | tail -20
  ```
- [ ] Commit:
  ```bash
  git add backend/src/modules/mandates/ backend/test/electoral/mandates.e2e-spec.ts backend/src/app.module.ts
  git commit -m "feat(electoral): MandatesModule + final app.module.ts registration (TDD)"
  ```

---

## Final Verification

- [ ] Run all new e2e suites together (use `--runInBand` to avoid port conflicts):
  ```bash
  cd backend && DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest \
    --testPathPattern="elections.e2e|campaigns.e2e|party.e2e|mandates.e2e" \
    --forceExit --runInBand 2>&1 | tail -40
  ```
- [ ] Confirm all 4 test suites pass with 0 failures
- [ ] Confirm no TypeScript errors:
  ```bash
  cd backend && npx tsc --noEmit 2>&1 | head -30
  ```

---

## File Index

| Module | Files |
|--------|-------|
| Elections | `backend/src/modules/elections/elections.module.ts` |
| | `backend/src/modules/elections/elections.service.ts` |
| | `backend/src/modules/elections/elections.controller.ts` |
| | `backend/src/modules/elections/dto/create-election.dto.ts` |
| | `backend/src/modules/elections/dto/update-election.dto.ts` |
| Campaigns | `backend/src/modules/campaigns/campaigns.module.ts` |
| | `backend/src/modules/campaigns/campaigns.service.ts` |
| | `backend/src/modules/campaigns/campaigns.controller.ts` |
| | `backend/src/modules/campaigns/dto/create-campaign.dto.ts` |
| | `backend/src/modules/campaigns/dto/update-campaign.dto.ts` |
| | `backend/src/modules/campaigns/dto/create-team-member.dto.ts` |
| | `backend/src/modules/campaigns/dto/update-team-member.dto.ts` |
| | `backend/src/modules/campaigns/dto/create-contract.dto.ts` |
| | `backend/src/modules/campaigns/dto/update-contract.dto.ts` |
| | `backend/src/modules/campaigns/dto/create-schedule-event.dto.ts` |
| | `backend/src/modules/campaigns/dto/update-schedule-event.dto.ts` |
| | `backend/src/modules/campaigns/dto/create-tse-report.dto.ts` |
| | `backend/src/modules/campaigns/dto/update-tse-report.dto.ts` |
| Party | `backend/src/modules/party/party.module.ts` |
| | `backend/src/modules/party/party.service.ts` |
| | `backend/src/modules/party/party.controller.ts` |
| | `backend/src/modules/party/dto/create-chapter.dto.ts` |
| | `backend/src/modules/party/dto/update-chapter.dto.ts` |
| | `backend/src/modules/party/dto/add-chapter-member.dto.ts` |
| | `backend/src/modules/party/dto/create-organ.dto.ts` |
| | `backend/src/modules/party/dto/update-organ.dto.ts` |
| | `backend/src/modules/party/dto/add-organ-member.dto.ts` |
| Mandates | `backend/src/modules/mandates/mandates.module.ts` |
| | `backend/src/modules/mandates/mandates.service.ts` |
| | `backend/src/modules/mandates/mandates.controller.ts` |
| | `backend/src/modules/mandates/dto/create-mandate.dto.ts` |
| | `backend/src/modules/mandates/dto/update-mandate.dto.ts` |
| Tests | `backend/test/electoral/elections.e2e-spec.ts` |
| | `backend/test/electoral/campaigns.e2e-spec.ts` |
| | `backend/test/electoral/party.e2e-spec.ts` |
| | `backend/test/electoral/mandates.e2e-spec.ts` |
| Wiring | `backend/src/app.module.ts` |
