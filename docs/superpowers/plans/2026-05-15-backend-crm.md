# CRM Backend Modules — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 9 CRM NestJS modules with TDD

**Architecture:** Each module follows the standard NestJS pattern with PrismaService, soft delete, audit logs, and JWT-sourced tenantId. All routes under `/crm/` prefix.

**Tech Stack:** NestJS 10, Prisma 5, MySQL, Jest, Supertest

---

## Prerequisites (verify before starting)

- [ ] Plan 1 (infrastructure) is complete: `@nestjs/schedule`, `csv-parse`, `multer` installed
- [ ] Prisma schema has all CRM models: `tags`, `people_tags`, `pipeline_stages`, `pipeline_entries`, `interactions`, `tasks`, `notifications`, `device_tokens`, `events`, `event_attendees`, `crm_imports`
- [ ] Enums exist: `interaction_type`, `task_status`, `notification_type`, `import_status`
- [ ] Test DB is seeded: `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx prisma db push`

---

## Shared Patterns (apply to every module)

```typescript
// tenantId always from JWT
const tenantId = actor.tenantId;

// Soft delete filter on every findMany
where: { tenant_id: tenantId, deleted_at: null }

// Atomic update (updateMany + count check)
const result = await this.prisma.model.updateMany({
  where: { id, tenant_id: tenantId, deleted_at: null },
  data: { ...dto, updated_at: new Date() },
});
if (result.count === 0) throw new NotFoundException('Not found');

// Audit log on every write
await this.prisma.audit_logs.create({
  data: {
    tenant_id: tenantId,
    user_id: actor.userId,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'tags' | 'pipeline_stages' | ...,
    entity_id: record.id,
    payload: JSON.stringify(dto),
  },
});

// Response envelope
return { success: true, data: record, message: 'Created' };
return { success: false, message: 'Not found', error: { code: 'NOT_FOUND', details: null } };
```

---

## Chunk 1 — Tags + PeopleTags

**Files:**
- `backend/src/modules/crm/tags/tags.module.ts`
- `backend/src/modules/crm/tags/tags.controller.ts`
- `backend/src/modules/crm/tags/tags.service.ts`
- `backend/src/modules/crm/tags/dto/create-tag.dto.ts`
- `backend/src/modules/crm/tags/dto/update-tag.dto.ts`
- `backend/src/modules/crm/tags/dto/attach-tags.dto.ts`
- `backend/test/crm/tags.e2e-spec.ts`

### Step 1.1 — Write failing e2e tests for Tags

- [ ] Create `backend/test/crm/tags.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

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

  it('POST /crm/tags — cria tag', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Apoiador', color: '#ff0000' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Apoiador');
    expect(res.body.data.tenant_id).toBe(tenantId);
    tagId = res.body.data.id;
  });

  it('GET /crm/tags — lista tags do tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((t: any) => t.id === tagId)).toBe(true);
  });

  it('PATCH /crm/tags/:id — atualiza tag', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ color: '#00ff00' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.color).toBe('#00ff00');
  });

  it('POST /crm/people/:id/tags — vincula tag à pessoa', async () => {
    const res = await request(app.getHttpServer())
      .post(`/crm/people/${peopleId}/tags`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tag_ids: [tagId] })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/people/:id/tags/:tagId — desvincula tag', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/people/${peopleId}/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/tags/:id — soft delete tag', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/tags/${tagId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const deleted = await prisma.tags.findUnique({ where: { id: tagId } });
    expect(deleted?.deleted_at).not.toBeNull();
  });

  it('GET /crm/tags — não retorna tags deletadas', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tags')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.some((t: any) => t.id === tagId)).toBe(false);
  });
});
```

- [ ] Rodar e confirmar que falha: `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=tags.e2e-spec --no-coverage`
- [ ] Esperado: `Cannot GET /crm/tags` ou similar (rotas não existem ainda)

### Step 1.2 — DTOs de Tags

- [ ] Criar `backend/src/modules/crm/tags/dto/create-tag.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a valid hex color' })
  color?: string;
}
```

- [ ] Criar `backend/src/modules/crm/tags/dto/update-tag.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTagDto } from './create-tag.dto';

export class UpdateTagDto extends PartialType(CreateTagDto) {}
```

- [ ] Criar `backend/src/modules/crm/tags/dto/attach-tags.dto.ts`:

```typescript
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AttachTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  tag_ids: string[];
}
```

### Step 1.3 — TagsService

- [ ] Criar `backend/src/modules/crm/tags/tags.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const TAG_SAFE_SELECT = {
  id: true,
  tenant_id: true,
  name: true,
  color: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTagDto, actor: JwtPayload) {
    const existing = await this.prisma.tags.findFirst({
      where: { tenant_id: actor.tenantId, name: dto.name, deleted_at: null },
    });
    if (existing) throw new ConflictException('Tag com esse nome já existe');

    const tag = await this.prisma.tags.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
      },
      select: TAG_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'CREATE',
        entity: 'tags',
        entity_id: tag.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: tag, message: 'Tag criada' };
  }

  async findAll(tenantId: string) {
    const tags = await this.prisma.tags.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      select: TAG_SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
    return { success: true, data: tags };
  }

  async update(id: string, dto: UpdateTagDto, actor: JwtPayload) {
    if (dto.name) {
      const conflict = await this.prisma.tags.findFirst({
        where: { tenant_id: actor.tenantId, name: dto.name, deleted_at: null, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Tag com esse nome já existe');
    }

    const result = await this.prisma.tags.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { ...dto, updated_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Tag não encontrada');

    const tag = await this.prisma.tags.findUnique({ where: { id }, select: TAG_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'UPDATE',
        entity: 'tags',
        entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: tag, message: 'Tag atualizada' };
  }

  async remove(id: string, actor: JwtPayload) {
    const result = await this.prisma.tags.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Tag não encontrada');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'DELETE',
        entity: 'tags',
        entity_id: id,
        payload: null,
      },
    });

    return { success: true, message: 'Tag removida' };
  }

  async attachTags(peopleId: string, dto: AttachTagsDto, actor: JwtPayload) {
    // Verifica que a pessoa pertence ao tenant
    const person = await this.prisma.people.findFirst({
      where: { id: peopleId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    // Upsert para evitar duplicatas
    await Promise.all(
      dto.tag_ids.map((tagId) =>
        this.prisma.people_tags.upsert({
          where: { people_id_tag_id: { people_id: peopleId, tag_id: tagId } },
          create: { tenant_id: actor.tenantId, people_id: peopleId, tag_id: tagId },
          update: {},
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'CREATE',
        entity: 'people_tags',
        entity_id: peopleId,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Tags vinculadas' };
  }

  async detachTag(peopleId: string, tagId: string, actor: JwtPayload) {
    const link = await this.prisma.people_tags.findFirst({
      where: { people_id: peopleId, tag_id: tagId, tenant_id: actor.tenantId },
    });
    if (!link) throw new NotFoundException('Vínculo não encontrado');

    await this.prisma.people_tags.delete({ where: { id: link.id } });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'DELETE',
        entity: 'people_tags',
        entity_id: link.id,
        payload: null,
      },
    });

    return { success: true, message: 'Tag desvinculada' };
  }
}
```

### Step 1.4 — TagsController

- [ ] Criar `backend/src/modules/crm/tags/tags.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTagDto, @CurrentUser() actor: JwtPayload) {
    return this.tagsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.tagsService.findAll(actor.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto, @CurrentUser() actor: JwtPayload) {
    return this.tagsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tagsService.remove(id, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/tags/people-tags.controller.ts`:

```typescript
import {
  Controller, Post, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/people')
export class PeopleTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post(':id/tags')
  @HttpCode(HttpStatus.CREATED)
  attach(
    @Param('id') peopleId: string,
    @Body() dto: AttachTagsDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tagsService.attachTags(peopleId, dto, actor);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.OK)
  detach(
    @Param('id') peopleId: string,
    @Param('tagId') tagId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tagsService.detachTag(peopleId, tagId, actor);
  }
}
```

### Step 1.5 — TagsModule

- [ ] Criar `backend/src/modules/crm/tags/tags.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { TagsController } from './tags.controller';
import { PeopleTagsController } from './people-tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [PrismaModule],
  controllers: [TagsController, PeopleTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
```

### Step 1.6 — Rodar testes e verificar verde

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=tags.e2e-spec --no-coverage`
- [ ] Todos os testes devem passar
- [ ] Commit: `feat(crm): implement Tags + PeopleTags module with e2e tests`

---

## Chunk 2 — Pipeline Stages + Entries

**Files:**
- `backend/src/modules/crm/pipeline/pipeline.module.ts`
- `backend/src/modules/crm/pipeline/pipeline-stages.controller.ts`
- `backend/src/modules/crm/pipeline/pipeline-entries.controller.ts`
- `backend/src/modules/crm/pipeline/pipeline.service.ts`
- `backend/src/modules/crm/pipeline/dto/create-stage.dto.ts`
- `backend/src/modules/crm/pipeline/dto/update-stage.dto.ts`
- `backend/src/modules/crm/pipeline/dto/reorder-stages.dto.ts`
- `backend/src/modules/crm/pipeline/dto/create-entry.dto.ts`
- `backend/src/modules/crm/pipeline/dto/update-entry.dto.ts`
- `backend/test/crm/pipeline.e2e-spec.ts`

### Step 2.1 — Testes e2e do Pipeline

- [ ] Criar `backend/test/crm/pipeline.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

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

    const person = await prisma.people.findFirst({ where: { tenant_id: tenantId, deleted_at: null } });
    peopleId = person?.id;
  });

  afterAll(async () => {
    await prisma.pipeline_entries.deleteMany({ where: { tenant_id: tenantId } });
    await prisma.pipeline_stages.deleteMany({ where: { tenant_id: tenantId } });
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
    const deleted = await prisma.pipeline_stages.findUnique({ where: { id: stageId } });
    expect(deleted?.deleted_at).not.toBeNull();
  });
});
```

- [ ] Rodar e confirmar falha: `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=pipeline.e2e-spec --no-coverage`

### Step 2.2 — DTOs do Pipeline

- [ ] Criar `backend/src/modules/crm/pipeline/dto/create-stage.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsInt, IsOptional, IsBoolean, Matches, IsEnum, MaxLength } from 'class-validator';

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  order_index: number;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_final?: boolean;

  @IsOptional()
  @IsEnum(['filiado', 'simpatizante', 'voluntario', 'doador', 'eleitor'])
  target_people_type?: string;
}
```

- [ ] Criar `backend/src/modules/crm/pipeline/dto/update-stage.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateStageDto } from './create-stage.dto';
export class UpdateStageDto extends PartialType(CreateStageDto) {}
```

- [ ] Criar `backend/src/modules/crm/pipeline/dto/reorder-stages.dto.ts`:

```typescript
import { IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class StageOrderItem {
  @IsUUID()
  id: string;

  @IsInt()
  order_index: number;
}

export class ReorderStagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrderItem)
  order: StageOrderItem[];
}
```

- [ ] Criar `backend/src/modules/crm/pipeline/dto/create-entry.dto.ts`:

```typescript
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateEntryDto {
  @IsUUID()
  people_id: string;

  @IsUUID()
  stage_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] Criar `backend/src/modules/crm/pipeline/dto/update-entry.dto.ts`:

```typescript
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  exited_at?: string;
}
```

### Step 2.3 — PipelineService

- [ ] Criar `backend/src/modules/crm/pipeline/pipeline.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const STAGE_SAFE_SELECT = {
  id: true, tenant_id: true, name: true, order_index: true,
  color: true, is_final: true, target_people_type: true,
  created_at: true, updated_at: true,
};

const ENTRY_SAFE_SELECT = {
  id: true, tenant_id: true, people_id: true, stage_id: true,
  entered_at: true, exited_at: true, notes: true,
  created_at: true, updated_at: true,
  person: { select: { id: true, name: true } },
  stage: { select: { id: true, name: true, color: true } },
};

@Injectable()
export class PipelineService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Stages ----

  async createStage(dto: CreateStageDto, actor: JwtPayload) {
    const stage = await this.prisma.pipeline_stages.create({
      data: {
        tenant_id: actor.tenantId,
        name: dto.name,
        order_index: dto.order_index,
        color: dto.color ?? '#6366f1',
        is_final: dto.is_final ?? false,
        target_people_type: dto.target_people_type as any,
      },
      select: STAGE_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'pipeline_stages', entity_id: stage.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: stage, message: 'Estágio criado' };
  }

  async findAllStages(tenantId: string) {
    const stages = await this.prisma.pipeline_stages.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
      select: STAGE_SAFE_SELECT,
      orderBy: { order_index: 'asc' },
    });
    return { success: true, data: stages };
  }

  async updateStage(id: string, dto: UpdateStageDto, actor: JwtPayload) {
    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { ...dto, updated_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    const stage = await this.prisma.pipeline_stages.findUnique({ where: { id }, select: STAGE_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_stages', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: stage, message: 'Estágio atualizado' };
  }

  async removeStage(id: string, actor: JwtPayload) {
    const result = await this.prisma.pipeline_stages.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Estágio não encontrado');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'DELETE', entity: 'pipeline_stages', entity_id: id, payload: null,
      },
    });

    return { success: true, message: 'Estágio removido' };
  }

  async reorderStages(dto: ReorderStagesDto, actor: JwtPayload) {
    await this.prisma.$transaction(
      dto.order.map((item) =>
        this.prisma.pipeline_stages.updateMany({
          where: { id: item.id, tenant_id: actor.tenantId, deleted_at: null },
          data: { order_index: item.order_index, updated_at: new Date() },
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_stages', entity_id: 'batch-reorder',
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Estágios reordenados' };
  }

  // ---- Entries ----

  async createEntry(dto: CreateEntryDto, actor: JwtPayload) {
    const person = await this.prisma.people.findFirst({
      where: { id: dto.people_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    const stage = await this.prisma.pipeline_stages.findFirst({
      where: { id: dto.stage_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!stage) throw new NotFoundException('Estágio não encontrado');

    const entry = await this.prisma.pipeline_entries.create({
      data: {
        tenant_id: actor.tenantId,
        people_id: dto.people_id,
        stage_id: dto.stage_id,
        notes: dto.notes,
        entered_at: new Date(),
      },
      select: ENTRY_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'pipeline_entries', entity_id: entry.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: entry, message: 'Entrada criada' };
  }

  async findAllEntries(tenantId: string, stageId?: string, peopleId?: string) {
    const entries = await this.prisma.pipeline_entries.findMany({
      where: {
        tenant_id: tenantId,
        ...(stageId && { stage_id: stageId }),
        ...(peopleId && { people_id: peopleId }),
      },
      select: ENTRY_SAFE_SELECT,
      orderBy: { entered_at: 'desc' },
    });
    return { success: true, data: entries };
  }

  async updateEntry(id: string, dto: UpdateEntryDto, actor: JwtPayload) {
    const result = await this.prisma.pipeline_entries.updateMany({
      where: { id, tenant_id: actor.tenantId },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.exited_at && { exited_at: new Date(dto.exited_at) }),
        updated_at: new Date(),
      },
    });
    if (result.count === 0) throw new NotFoundException('Entrada não encontrada');

    const entry = await this.prisma.pipeline_entries.findUnique({ where: { id }, select: ENTRY_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'pipeline_entries', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: entry, message: 'Entrada atualizada' };
  }
}
```

### Step 2.4 — Pipeline Controllers

- [ ] Criar `backend/src/modules/crm/pipeline/pipeline-stages.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/pipeline/stages')
export class PipelineStagesController {
  constructor(private readonly pipelineService: PipelineService) {}

  // ATENÇÃO: rota estática /order deve vir ANTES de /:id
  @Post('order')
  @HttpCode(HttpStatus.OK)
  reorder(@Body() dto: ReorderStagesDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.reorderStages(dto, actor);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStageDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.createStage(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.pipelineService.findAllStages(actor.tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStageDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.updateStage(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.removeStage(id, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/pipeline/pipeline-entries.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/pipeline/entries')
export class PipelineEntriesController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEntryDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.createEntry(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('stage_id') stageId?: string,
    @Query('people_id') peopleId?: string,
  ) {
    return this.pipelineService.findAllEntries(actor.tenantId, stageId, peopleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto, @CurrentUser() actor: JwtPayload) {
    return this.pipelineService.updateEntry(id, dto, actor);
  }
}
```

### Step 2.5 — PipelineModule

- [ ] Criar `backend/src/modules/crm/pipeline/pipeline.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PipelineStagesController } from './pipeline-stages.controller';
import { PipelineEntriesController } from './pipeline-entries.controller';
import { PipelineService } from './pipeline.service';

@Module({
  imports: [PrismaModule],
  controllers: [PipelineStagesController, PipelineEntriesController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
```

### Step 2.6 — Rodar testes e verificar verde

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=pipeline.e2e-spec --no-coverage`
- [ ] Commit: `feat(crm): implement Pipeline Stages + Entries module with e2e tests`

---

## Chunk 3 — Interactions (append-only)

**Files:**
- `backend/src/modules/crm/interactions/interactions.module.ts`
- `backend/src/modules/crm/interactions/interactions.controller.ts`
- `backend/src/modules/crm/interactions/interactions.service.ts`
- `backend/src/modules/crm/interactions/dto/create-interaction.dto.ts`
- `backend/test/crm/interactions.e2e-spec.ts`

### Step 3.1 — Testes e2e de Interactions

- [ ] Criar `backend/test/crm/interactions.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Interactions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let peopleId: string;
  let interactionId: string;

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

    const person = await prisma.people.findFirst({ where: { tenant_id: tenantId, deleted_at: null } });
    peopleId = person?.id;
  });

  afterAll(async () => {
    await prisma.interactions.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('POST /crm/interactions — cria interação', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        people_id: peopleId,
        type: 'reuniao',
        notes: 'Reunião de alinhamento',
        occurred_at: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('reuniao');
    interactionId = res.body.data.id;
  });

  it('GET /crm/interactions — lista interações', async () => {
    const res = await request(app.getHttpServer())
      .get(`/crm/interactions?people_id=${peopleId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((i: any) => i.id === interactionId)).toBe(true);
  });

  it('DELETE /crm/interactions/:id — não existe (append-only)', async () => {
    await request(app.getHttpServer())
      .delete(`/crm/interactions/${interactionId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

- [ ] Rodar e confirmar falha

### Step 3.2 — DTO de Interaction

- [ ] Criar `backend/src/modules/crm/interactions/dto/create-interaction.dto.ts`:

```typescript
import { IsUUID, IsEnum, IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateInteractionDto {
  @IsUUID()
  people_id: string;

  @IsEnum(['reuniao', 'ligacao', 'email', 'visita', 'outro'])
  type: string;

  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsDateString()
  occurred_at: string;
}
```

### Step 3.3 — InteractionsService

- [ ] Criar `backend/src/modules/crm/interactions/interactions.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const INTERACTION_SAFE_SELECT = {
  id: true, tenant_id: true, people_id: true, user_id: true,
  type: true, notes: true, occurred_at: true, created_at: true,
  person: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
};

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInteractionDto, actor: JwtPayload) {
    const person = await this.prisma.people.findFirst({
      where: { id: dto.people_id, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!person) throw new NotFoundException('Pessoa não encontrada');

    const interaction = await this.prisma.interactions.create({
      data: {
        tenant_id: actor.tenantId,
        people_id: dto.people_id,
        user_id: actor.userId,
        type: dto.type as any,
        notes: dto.notes,
        occurred_at: new Date(dto.occurred_at),
      },
      select: INTERACTION_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'interactions', entity_id: interaction.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: interaction, message: 'Interação registrada' };
  }

  async findAll(tenantId: string, peopleId?: string) {
    const interactions = await this.prisma.interactions.findMany({
      where: {
        tenant_id: tenantId,
        ...(peopleId && { people_id: peopleId }),
      },
      select: INTERACTION_SAFE_SELECT,
      orderBy: { occurred_at: 'desc' },
    });
    return { success: true, data: interactions };
  }
}
```

### Step 3.4 — InteractionsController + Module

- [ ] Criar `backend/src/modules/crm/interactions/interactions.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInteractionDto, @CurrentUser() actor: JwtPayload) {
    return this.interactionsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentUser() actor: JwtPayload, @Query('people_id') peopleId?: string) {
    return this.interactionsService.findAll(actor.tenantId, peopleId);
  }
}
```

- [ ] Criar `backend/src/modules/crm/interactions/interactions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

@Module({
  imports: [PrismaModule],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
```

### Step 3.5 — Rodar testes e verificar verde

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=interactions.e2e-spec --no-coverage`
- [ ] Commit: `feat(crm): implement Interactions module (append-only) with e2e tests`

---

## Chunk 4 — Tasks + Notifications

**Files:**
- `backend/src/modules/crm/tasks/tasks.module.ts`
- `backend/src/modules/crm/tasks/tasks.controller.ts`
- `backend/src/modules/crm/tasks/tasks.service.ts`
- `backend/src/modules/crm/tasks/dto/create-task.dto.ts`
- `backend/src/modules/crm/tasks/dto/update-task.dto.ts`
- `backend/src/modules/crm/notifications/notifications.module.ts`
- `backend/src/modules/crm/notifications/notifications.controller.ts`
- `backend/src/modules/crm/notifications/notifications.service.ts`
- `backend/test/crm/tasks.e2e-spec.ts`
- `backend/test/crm/notifications.e2e-spec.ts`

### Step 4.1 — Testes e2e de Tasks

- [ ] Criar `backend/test/crm/tasks.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Tasks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let taskId: string;

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
    userId = loginRes.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.tasks.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('POST /crm/tasks — cria tarefa', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Ligar para apoiador',
        description: 'Confirmar presença no evento',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        assigned_to: userId,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pendente');
    taskId = res.body.data.id;
  });

  it('GET /crm/tasks — lista tarefas', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((t: any) => t.id === taskId)).toBe(true);
  });

  it('GET /crm/tasks?status=pendente — filtra por status', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/tasks?status=pendente')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.every((t: any) => t.status === 'pendente')).toBe(true);
  });

  it('PATCH /crm/tasks/:id — atualiza status para em_andamento', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'em_andamento' })
      .expect(200);

    expect(res.body.data.status).toBe('em_andamento');
  });

  it('DELETE /crm/tasks/:id — soft delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const deleted = await prisma.tasks.findUnique({ where: { id: taskId } });
    expect(deleted?.deleted_at).not.toBeNull();
  });
});
```

- [ ] Rodar e confirmar falha

### Step 4.2 — DTOs de Tasks

- [ ] Criar `backend/src/modules/crm/tasks/dto/create-task.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  people_id?: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(['pendente', 'em_andamento', 'concluida', 'cancelada'])
  status?: string;
}
```

- [ ] Criar `backend/src/modules/crm/tasks/dto/update-task.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

### Step 4.3 — TasksService

- [ ] Criar `backend/src/modules/crm/tasks/tasks.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { Cron, CronExpression } from '@nestjs/schedule';

const TASK_SAFE_SELECT = {
  id: true, tenant_id: true, title: true, description: true,
  status: true, due_date: true, people_id: true, assigned_to: true,
  created_by: true, created_at: true, updated_at: true,
  person: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  creator: { select: { id: true, name: true } },
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto, actor: JwtPayload) {
    const task = await this.prisma.tasks.create({
      data: {
        tenant_id: actor.tenantId,
        created_by: actor.userId,
        title: dto.title,
        description: dto.description,
        people_id: dto.people_id,
        assigned_to: dto.assigned_to,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        status: (dto.status as any) ?? 'pendente',
      },
      select: TASK_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'tasks', entity_id: task.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: task, message: 'Tarefa criada' };
  }

  async findAll(tenantId: string, status?: string, assignedTo?: string, peopleId?: string) {
    const tasks = await this.prisma.tasks.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        ...(status && { status: status as any }),
        ...(assignedTo && { assigned_to: assignedTo }),
        ...(peopleId && { people_id: peopleId }),
      },
      select: TASK_SAFE_SELECT,
      orderBy: [{ due_date: 'asc' }, { created_at: 'desc' }],
    });
    return { success: true, data: tasks };
  }

  async update(id: string, dto: UpdateTaskDto, actor: JwtPayload) {
    const data: any = { updated_at: new Date() };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.assigned_to !== undefined) data.assigned_to = dto.assigned_to;
    if (dto.due_date !== undefined) data.due_date = new Date(dto.due_date);

    const result = await this.prisma.tasks.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data,
    });
    if (result.count === 0) throw new NotFoundException('Tarefa não encontrada');

    const task = await this.prisma.tasks.findUnique({ where: { id }, select: TASK_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'tasks', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: task, message: 'Tarefa atualizada' };
  }

  async remove(id: string, actor: JwtPayload) {
    const result = await this.prisma.tasks.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Tarefa não encontrada');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'DELETE', entity: 'tasks', entity_id: id, payload: null,
      },
    });

    return { success: true, message: 'Tarefa removida' };
  }

  // Cron: marca tarefas vencidas como atrasadas via notificação (roda às 08:00 todo dia)
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async notifyOverdueTasks() {
    const overdue = await this.prisma.tasks.findMany({
      where: {
        deleted_at: null,
        status: 'pendente',
        due_date: { lt: new Date() },
        assigned_to: { not: null },
      },
      select: { id: true, tenant_id: true, title: true, assigned_to: true },
    });

    for (const task of overdue) {
      await this.prisma.notifications.create({
        data: {
          tenant_id: task.tenant_id,
          user_id: task.assigned_to!,
          title: 'Tarefa em atraso',
          body: `A tarefa "${task.title}" está vencida.`,
          type: 'alerta',
          entity_id: task.id,
          entity_type: 'tasks',
        },
      });
    }
  }
}
```

### Step 4.4 — TasksController + Module

- [ ] Criar `backend/src/modules/crm/tasks/tasks.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('status') status?: string,
    @Query('assigned_to') assignedTo?: string,
    @Query('people_id') peopleId?: string,
  ) {
    return this.tasksService.findAll(actor.tenantId, status, assignedTo, peopleId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.tasksService.remove(id, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/tasks/tasks.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

### Step 4.5 — Testes e2e de Notifications

- [ ] Criar `backend/test/crm/notifications.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let userId: string;
  let notificationId: string;

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
    userId = loginRes.body.data.user.id;

    // Seed: cria notificação diretamente
    const notif = await prisma.notifications.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        title: 'Teste',
        body: 'Notificação de teste',
        type: 'info',
      },
    });
    notificationId = notif.id;
  });

  afterAll(async () => {
    await prisma.notifications.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('GET /crm/notifications — lista notificações do usuário', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/notifications')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((n: any) => n.id === notificationId)).toBe(true);
  });

  it('PATCH /crm/notifications/:id/read — marca como lida', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const notif = await prisma.notifications.findUnique({ where: { id: notificationId } });
    expect(notif?.read).toBe(true);
  });

  it('PATCH /crm/notifications/read-all — marca todas como lidas', async () => {
    const res = await request(app.getHttpServer())
      .patch('/crm/notifications/read-all')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
```

- [ ] Rodar e confirmar falha

### Step 4.6 — NotificationsService + Controller + Module

- [ ] Criar `backend/src/modules/crm/notifications/notifications.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const NOTIFICATION_SAFE_SELECT = {
  id: true, tenant_id: true, user_id: true,
  title: true, body: true, type: true, read: true,
  entity_id: true, entity_type: true, created_at: true,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(actor: JwtPayload) {
    const notifications = await this.prisma.notifications.findMany({
      where: { tenant_id: actor.tenantId, user_id: actor.userId },
      select: NOTIFICATION_SAFE_SELECT,
      orderBy: [{ read: 'asc' }, { created_at: 'desc' }],
    });
    return { success: true, data: notifications };
  }

  async markOneRead(id: string, actor: JwtPayload) {
    const result = await this.prisma.notifications.updateMany({
      where: { id, user_id: actor.userId, tenant_id: actor.tenantId },
      data: { read: true },
    });
    if (result.count === 0) throw new NotFoundException('Notificação não encontrada');
    return { success: true, message: 'Notificação marcada como lida' };
  }

  async markAllRead(actor: JwtPayload) {
    await this.prisma.notifications.updateMany({
      where: { user_id: actor.userId, tenant_id: actor.tenantId, read: false },
      data: { read: true },
    });
    return { success: true, message: 'Todas as notificações marcadas como lidas' };
  }
}
```

- [ ] Criar `backend/src/modules/crm/notifications/notifications.controller.ts`:

```typescript
import { Controller, Get, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() actor: JwtPayload) {
    return this.notificationsService.findAll(actor);
  }

  // ATENÇÃO: rota estática /read-all deve vir ANTES de /:id/read
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() actor: JwtPayload) {
    return this.notificationsService.markAllRead(actor);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markOneRead(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.notificationsService.markOneRead(id, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/notifications/notifications.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

### Step 4.7 — Rodar todos os testes e verificar verde

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern="tasks.e2e-spec|notifications.e2e-spec" --no-coverage`
- [ ] Commit: `feat(crm): implement Tasks + Notifications modules with cron and e2e tests`

---

## Chunk 5 — Events + Attendees

**Files:**
- `backend/src/modules/crm/events/events.module.ts`
- `backend/src/modules/crm/events/events.controller.ts`
- `backend/src/modules/crm/events/events.service.ts`
- `backend/src/modules/crm/events/dto/create-event.dto.ts`
- `backend/src/modules/crm/events/dto/update-event.dto.ts`
- `backend/src/modules/crm/events/dto/add-attendees.dto.ts`
- `backend/test/crm/events.e2e-spec.ts`

### Step 5.1 — Testes e2e de Events

- [ ] Criar `backend/test/crm/events.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let peopleId: string;
  let eventId: string;

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

    const person = await prisma.people.findFirst({ where: { tenant_id: tenantId, deleted_at: null } });
    peopleId = person?.id;
  });

  afterAll(async () => {
    await prisma.event_attendees.deleteMany({ where: { event: { tenant_id: tenantId } } });
    await prisma.events.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('POST /crm/events — cria evento', async () => {
    const start = new Date(Date.now() + 86400000);
    const end = new Date(Date.now() + 90000000);

    const res = await request(app.getHttpServer())
      .post('/crm/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Reunião de filiados',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        location: 'Sede do partido',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Reunião de filiados');
    eventId = res.body.data.id;
  });

  it('GET /crm/events — lista eventos', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/events')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.some((e: any) => e.id === eventId)).toBe(true);
  });

  it('POST /crm/events/:id/attendees — adiciona participante', async () => {
    const res = await request(app.getHttpServer())
      .post(`/crm/events/${eventId}/attendees`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ people_ids: [peopleId] })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/events/:id/attendees/:peopleId — remove participante', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/events/${eventId}/attendees/${peopleId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('PATCH /crm/events/:id — atualiza evento', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ location: 'Nova sede' })
      .expect(200);

    expect(res.body.data.location).toBe('Nova sede');
  });

  it('DELETE /crm/events/:id — soft delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const deleted = await prisma.events.findUnique({ where: { id: eventId } });
    expect(deleted?.deleted_at).not.toBeNull();
  });
});
```

- [ ] Rodar e confirmar falha

### Step 5.2 — DTOs de Events

- [ ] Criar `backend/src/modules/crm/events/dto/create-event.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsDateString()
  start_at: string;

  @IsOptional()
  @IsDateString()
  end_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

- [ ] Criar `backend/src/modules/crm/events/dto/update-event.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
export class UpdateEventDto extends PartialType(CreateEventDto) {}
```

- [ ] Criar `backend/src/modules/crm/events/dto/add-attendees.dto.ts`:

```typescript
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AddAttendeesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  people_ids: string[];
}
```

### Step 5.3 — EventsService

- [ ] Criar `backend/src/modules/crm/events/events.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AddAttendeesDto } from './dto/add-attendees.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

const EVENT_SAFE_SELECT = {
  id: true, tenant_id: true, title: true, description: true,
  start_at: true, end_at: true, location: true,
  created_by: true, created_at: true, updated_at: true,
  creator: { select: { id: true, name: true } },
  attendees: {
    select: {
      id: true,
      person: { select: { id: true, name: true } },
    },
  },
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, actor: JwtPayload) {
    const event = await this.prisma.events.create({
      data: {
        tenant_id: actor.tenantId,
        created_by: actor.userId,
        title: dto.title,
        description: dto.description,
        start_at: new Date(dto.start_at),
        end_at: dto.end_at ? new Date(dto.end_at) : undefined,
        location: dto.location,
      },
      select: EVENT_SAFE_SELECT,
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'events', entity_id: event.id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: event, message: 'Evento criado' };
  }

  async findAll(tenantId: string, startFrom?: string, startTo?: string) {
    const events = await this.prisma.events.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        ...(startFrom && { start_at: { gte: new Date(startFrom) } }),
        ...(startTo && { start_at: { lte: new Date(startTo) } }),
      },
      select: EVENT_SAFE_SELECT,
      orderBy: { start_at: 'asc' },
    });
    return { success: true, data: events };
  }

  async update(id: string, dto: UpdateEventDto, actor: JwtPayload) {
    const data: any = { updated_at: new Date() };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.start_at !== undefined) data.start_at = new Date(dto.start_at);
    if (dto.end_at !== undefined) data.end_at = new Date(dto.end_at);

    const result = await this.prisma.events.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data,
    });
    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    const event = await this.prisma.events.findUnique({ where: { id }, select: EVENT_SAFE_SELECT });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'UPDATE', entity: 'events', entity_id: id,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, data: event, message: 'Evento atualizado' };
  }

  async remove(id: string, actor: JwtPayload) {
    const result = await this.prisma.events.updateMany({
      where: { id, tenant_id: actor.tenantId, deleted_at: null },
      data: { deleted_at: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Evento não encontrado');

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'DELETE', entity: 'events', entity_id: id, payload: null,
      },
    });

    return { success: true, message: 'Evento removido' };
  }

  async addAttendees(eventId: string, dto: AddAttendeesDto, actor: JwtPayload) {
    const event = await this.prisma.events.findFirst({
      where: { id: eventId, tenant_id: actor.tenantId, deleted_at: null },
    });
    if (!event) throw new NotFoundException('Evento não encontrado');

    await Promise.all(
      dto.people_ids.map((peopleId) =>
        this.prisma.event_attendees.upsert({
          where: { event_id_people_id: { event_id: eventId, people_id: peopleId } },
          create: { event_id: eventId, people_id: peopleId },
          update: {},
        }),
      ),
    );

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'CREATE', entity: 'event_attendees', entity_id: eventId,
        payload: JSON.stringify(dto),
      },
    });

    return { success: true, message: 'Participantes adicionados' };
  }

  async removeAttendee(eventId: string, peopleId: string, actor: JwtPayload) {
    const attendee = await this.prisma.event_attendees.findFirst({
      where: { event_id: eventId, people_id: peopleId },
    });
    if (!attendee) throw new NotFoundException('Participante não encontrado');

    await this.prisma.event_attendees.delete({ where: { id: attendee.id } });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId, user_id: actor.userId,
        action: 'DELETE', entity: 'event_attendees', entity_id: attendee.id, payload: null,
      },
    });

    return { success: true, message: 'Participante removido' };
  }
}
```

### Step 5.4 — EventsController + Module

- [ ] Criar `backend/src/modules/crm/events/events.controller.ts`:

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AddAttendeesDto } from './dto/add-attendees.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentUser() actor: JwtPayload,
    @Query('start_from') startFrom?: string,
    @Query('start_to') startTo?: string,
  ) {
    return this.eventsService.findAll(actor.tenantId, startFrom, startTo);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.eventsService.remove(id, actor);
  }

  @Post(':id/attendees')
  @HttpCode(HttpStatus.CREATED)
  addAttendees(
    @Param('id') eventId: string,
    @Body() dto: AddAttendeesDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.addAttendees(eventId, dto, actor);
  }

  @Delete(':id/attendees/:peopleId')
  @HttpCode(HttpStatus.OK)
  removeAttendee(
    @Param('id') eventId: string,
    @Param('peopleId') peopleId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.eventsService.removeAttendee(eventId, peopleId, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/events/events.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
```

### Step 5.5 — Rodar testes e verificar verde

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern=events.e2e-spec --no-coverage`
- [ ] Commit: `feat(crm): implement Events + Attendees module with e2e tests`

---

## Chunk 6 — Device Tokens + CSV Import + Dashboard + Registro no AppModule

**Files:**
- `backend/src/modules/crm/device-tokens/device-tokens.module.ts`
- `backend/src/modules/crm/device-tokens/device-tokens.controller.ts`
- `backend/src/modules/crm/device-tokens/device-tokens.service.ts`
- `backend/src/modules/crm/device-tokens/dto/register-device-token.dto.ts`
- `backend/src/modules/crm/crm-import/crm-import.module.ts`
- `backend/src/modules/crm/crm-import/crm-import.controller.ts`
- `backend/src/modules/crm/crm-import/crm-import.service.ts`
- `backend/src/modules/crm/crm-dashboard/crm-dashboard.module.ts`
- `backend/src/modules/crm/crm-dashboard/crm-dashboard.controller.ts`
- `backend/src/modules/crm/crm-dashboard/crm-dashboard.service.ts`
- `backend/src/app.module.ts` (modificar)
- `backend/test/crm/device-tokens.e2e-spec.ts`
- `backend/test/crm/crm-import.e2e-spec.ts`
- `backend/test/crm/crm-dashboard.e2e-spec.ts`

### Step 6.1 — Device Tokens

- [ ] Criar `backend/src/modules/crm/device-tokens/dto/register-device-token.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  device_token: string;

  @IsEnum(['ios', 'android'])
  platform: string;
}
```

- [ ] Criar `backend/src/modules/crm/device-tokens/device-tokens.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDeviceTokenDto, actor: JwtPayload) {
    const token = await this.prisma.device_tokens.upsert({
      where: { user_id_device_token: { user_id: actor.userId, device_token: dto.device_token } },
      create: {
        user_id: actor.userId,
        tenant_id: actor.tenantId,
        device_token: dto.device_token,
        platform: dto.platform,
      },
      update: { platform: dto.platform, updated_at: new Date() },
      select: { id: true, device_token: true, platform: true, created_at: true },
    });

    return { success: true, data: token, message: 'Device token registrado' };
  }

  async unregister(deviceToken: string, actor: JwtPayload) {
    const result = await this.prisma.device_tokens.deleteMany({
      where: { device_token: deviceToken, user_id: actor.userId, tenant_id: actor.tenantId },
    });
    if (result.count === 0) throw new NotFoundException('Device token não encontrado');
    return { success: true, message: 'Device token removido' };
  }
}
```

- [ ] Criar `backend/src/modules/crm/device-tokens/device-tokens.controller.ts`:

```typescript
import { Controller, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDeviceTokenDto, @CurrentUser() actor: JwtPayload) {
    return this.deviceTokensService.register(dto, actor);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  unregister(@Param('token') token: string, @CurrentUser() actor: JwtPayload) {
    return this.deviceTokensService.unregister(token, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/device-tokens/device-tokens.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeviceTokensController],
  providers: [DeviceTokensService],
  exports: [DeviceTokensService],
})
export class DeviceTokensModule {}
```

### Step 6.2 — Testes e2e de Device Tokens

- [ ] Criar `backend/test/crm/device-tokens.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Device Tokens (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  const testToken = 'test-device-token-abc123';

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
  });

  afterAll(async () => {
    await prisma.device_tokens.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('POST /crm/device-tokens — registra token', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/device-tokens')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_token: testToken, platform: 'ios' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.device_token).toBe(testToken);
  });

  it('POST /crm/device-tokens — upsert (idempotente)', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/device-tokens')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ device_token: testToken, platform: 'android' })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('DELETE /crm/device-tokens/:token — remove token', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/crm/device-tokens/${testToken}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
```

### Step 6.3 — CSV Import Service

- [ ] Criar `backend/src/modules/crm/crm-import/crm-import.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

// Colunas esperadas no CSV: name, email, phone, type, cpf (opcional)
interface CsvRow {
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
}

@Injectable()
export class CrmImportService {
  constructor(private readonly prisma: PrismaService) {}

  async startImport(file: Express.Multer.File, actor: JwtPayload) {
    // Cria registro de importação com status pending
    const importRecord = await this.prisma.crm_imports.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        filename: file.originalname,
        status: 'pending',
      },
    });

    // Processa em background (fire and forget)
    this.processImport(importRecord.id, file.buffer, actor).catch((err) =>
      console.error(`Import ${importRecord.id} failed:`, err),
    );

    return {
      success: true,
      data: { id: importRecord.id, status: 'pending' },
      message: 'Importação iniciada',
    };
  }

  private async processImport(importId: string, buffer: Buffer, actor: JwtPayload) {
    await this.prisma.crm_imports.update({
      where: { id: importId },
      data: { status: 'processing' },
    });

    const rows: CsvRow[] = await this.parseCsv(buffer);
    let successRows = 0;
    let errorRows = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) throw new Error('Campo "name" obrigatório');

        await this.prisma.people.create({
          data: {
            tenant_id: actor.tenantId,
            name: row.name.trim(),
            email: row.email?.trim() || null,
            phone: row.phone?.trim() || null,
            type: (row.type as any) || 'simpatizante',
          },
        });
        successRows++;
      } catch (err: any) {
        errorRows++;
        errors.push({ row: i + 2, message: err.message });
      }
    }

    await this.prisma.crm_imports.update({
      where: { id: importId },
      data: {
        status: errorRows > 0 && successRows === 0 ? 'error' : 'done',
        total_rows: rows.length,
        success_rows: successRows,
        error_rows: errorRows,
        errors: errors.length > 0 ? errors : null,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        tenant_id: actor.tenantId,
        user_id: actor.userId,
        action: 'CREATE',
        entity: 'crm_imports',
        entity_id: importId,
        payload: JSON.stringify({ success_rows: successRows, error_rows: errorRows }),
      },
    });
  }

  private parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', (row: CsvRow) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  async getImportStatus(id: string, actor: JwtPayload) {
    const record = await this.prisma.crm_imports.findFirst({
      where: { id, tenant_id: actor.tenantId },
      select: {
        id: true, filename: true, status: true,
        total_rows: true, success_rows: true, error_rows: true,
        errors: true, created_at: true, updated_at: true,
      },
    });
    if (!record) throw new NotFoundException('Importação não encontrada');
    return { success: true, data: record };
  }
}
```

- [ ] Criar `backend/src/modules/crm/crm-import/crm-import.controller.ts`:

```typescript
import {
  Controller, Post, Get, Param,
  UseInterceptors, UploadedFile,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CrmImportService } from './crm-import.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';
import { memoryStorage } from 'multer';

@Controller('crm/import')
export class CrmImportController {
  constructor(private readonly crmImportService: CrmImportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() actor: JwtPayload) {
    return this.crmImportService.startImport(file, actor);
  }

  @Get(':id')
  getStatus(@Param('id') id: string, @CurrentUser() actor: JwtPayload) {
    return this.crmImportService.getImportStatus(id, actor);
  }
}
```

- [ ] Criar `backend/src/modules/crm/crm-import/crm-import.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { CrmImportController } from './crm-import.controller';
import { CrmImportService } from './crm-import.service';

@Module({
  imports: [PrismaModule, MulterModule.register()],
  controllers: [CrmImportController],
  providers: [CrmImportService],
  exports: [CrmImportService],
})
export class CrmImportModule {}
```

### Step 6.4 — Testes e2e de CSV Import

- [ ] Criar `backend/test/crm/crm-import.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/services/prisma.service';

describe('CRM Import (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tenantId: string;
  let importId: string;

  const csvContent = `name,email,phone,type
Maria Teste,maria@test.com,11999990000,simpatizante
João Inválido,,
`;

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
  });

  afterAll(async () => {
    await prisma.crm_imports.deleteMany({ where: { tenant_id: tenantId } });
    await app.close();
  });

  it('POST /crm/import — inicia importação CSV', async () => {
    const res = await request(app.getHttpServer())
      .post('/crm/import')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from(csvContent), 'people.csv')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('pending');
    importId = res.body.data.id;
  });

  it('GET /crm/import/:id — consulta status da importação', async () => {
    // Aguarda processamento (max 3s)
    await new Promise((r) => setTimeout(r, 3000));

    const res = await request(app.getHttpServer())
      .get(`/crm/import/${importId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(['done', 'error', 'processing']).toContain(res.body.data.status);
  });
});
```

### Step 6.5 — CRM Dashboard Service + Controller + Module

- [ ] Criar `backend/src/modules/crm/crm-dashboard/crm-dashboard.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';

@Injectable()
export class CrmDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const [
      totalPeople,
      activeTasks,
      overdueTasks,
      upcomingEvents,
      recentInteractions,
      totalTags,
      pipelineStages,
    ] = await Promise.all([
      // Total de pessoas ativas
      this.prisma.people.count({
        where: { tenant_id: tenantId, deleted_at: null },
      }),

      // Tarefas pendentes ou em andamento
      this.prisma.tasks.count({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          status: { in: ['pendente', 'em_andamento'] },
        },
      }),

      // Tarefas vencidas (due_date no passado, ainda pendentes)
      this.prisma.tasks.count({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          status: 'pendente',
          due_date: { lt: new Date() },
        },
      }),

      // Eventos futuros (próximos 30 dias)
      this.prisma.events.count({
        where: {
          tenant_id: tenantId,
          deleted_at: null,
          start_at: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Interações nos últimos 7 dias
      this.prisma.interactions.count({
        where: {
          tenant_id: tenantId,
          occurred_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Total de tags ativas
      this.prisma.tags.count({
        where: { tenant_id: tenantId, deleted_at: null },
      }),

      // Contagem de pessoas por estágio do pipeline
      this.prisma.pipeline_stages.findMany({
        where: { tenant_id: tenantId, deleted_at: null },
        select: {
          id: true,
          name: true,
          color: true,
          order_index: true,
          _count: { select: { entries: true } },
        },
        orderBy: { order_index: 'asc' },
      }),
    ]);

    return {
      success: true,
      data: {
        people: { total: totalPeople },
        tasks: { active: activeTasks, overdue: overdueTasks },
        events: { upcoming_30_days: upcomingEvents },
        interactions: { last_7_days: recentInteractions },
        tags: { total: totalTags },
        pipeline: pipelineStages.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order_index: s.order_index,
          people_count: s._count.entries,
        })),
      },
    };
  }
}
```

- [ ] Criar `backend/src/modules/crm/crm-dashboard/crm-dashboard.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { CrmDashboardService } from './crm-dashboard.service';
import { CurrentUser, JwtPayload } from '../../../common/decorators/current-user.decorator';

@Controller('crm/dashboard')
export class CrmDashboardController {
  constructor(private readonly crmDashboardService: CrmDashboardService) {}

  @Get()
  getDashboard(@CurrentUser() actor: JwtPayload) {
    return this.crmDashboardService.getDashboard(actor.tenantId);
  }
}
```

- [ ] Criar `backend/src/modules/crm/crm-dashboard/crm-dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { CrmDashboardController } from './crm-dashboard.controller';
import { CrmDashboardService } from './crm-dashboard.service';

@Module({
  imports: [PrismaModule],
  controllers: [CrmDashboardController],
  providers: [CrmDashboardService],
  exports: [CrmDashboardService],
})
export class CrmDashboardModule {}
```

### Step 6.6 — Testes e2e do Dashboard

- [ ] Criar `backend/test/crm/crm-dashboard.e2e-spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CRM Dashboard (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    authToken = loginRes.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /crm/dashboard — retorna KPIs', async () => {
    const res = await request(app.getHttpServer())
      .get('/crm/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('people');
    expect(res.body.data).toHaveProperty('tasks');
    expect(res.body.data).toHaveProperty('events');
    expect(res.body.data).toHaveProperty('interactions');
    expect(res.body.data).toHaveProperty('pipeline');
    expect(Array.isArray(res.body.data.pipeline)).toBe(true);
  });
});
```

### Step 6.7 — Registrar todos os módulos em app.module.ts

- [ ] Abrir `backend/src/app.module.ts` e adicionar os imports dos 9 módulos CRM:

```typescript
// Adicionar estes imports no topo do app.module.ts
import { TagsModule } from './modules/crm/tags/tags.module';
import { PipelineModule } from './modules/crm/pipeline/pipeline.module';
import { InteractionsModule } from './modules/crm/interactions/interactions.module';
import { TasksModule } from './modules/crm/tasks/tasks.module';
import { NotificationsModule } from './modules/crm/notifications/notifications.module';
import { EventsModule } from './modules/crm/events/events.module';
import { DeviceTokensModule } from './modules/crm/device-tokens/device-tokens.module';
import { CrmImportModule } from './modules/crm/crm-import/crm-import.module';
import { CrmDashboardModule } from './modules/crm/crm-dashboard/crm-dashboard.module';

// Adicionar no array imports[] do @Module():
// TagsModule,
// PipelineModule,
// InteractionsModule,
// TasksModule,
// NotificationsModule,
// EventsModule,
// DeviceTokensModule,
// CrmImportModule,
// CrmDashboardModule,
```

### Step 6.8 — Rodar todos os testes do CRM

- [ ] `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern="device-tokens|crm-import|crm-dashboard" --no-coverage`
- [ ] Rodar suite completa: `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern="crm" --no-coverage`
- [ ] Todos devem passar

### Step 6.9 — Build de verificação

- [ ] `cd /Users/domenico/Documents/Documentos\ -\ MacBook\ Air\ de\ Osvaldo/Projetos/sistemas/Eco\ Sistema\ Legis/ShiftPartido/backend && npx tsc --noEmit`
- [ ] Nenhum erro de TypeScript

### Step 6.10 — Commit final

- [ ] `feat(crm): implement Device Tokens, CSV Import, Dashboard + register all CRM modules in AppModule`

---

## Checklist Final

- [ ] Chunk 1 (Tags + PeopleTags): testes passando, commit feito
- [ ] Chunk 2 (Pipeline): testes passando, commit feito
- [ ] Chunk 3 (Interactions): testes passando, commit feito
- [ ] Chunk 4 (Tasks + Notifications + cron): testes passando, commit feito
- [ ] Chunk 5 (Events + Attendees): testes passando, commit feito
- [ ] Chunk 6 (Device Tokens + Import + Dashboard + AppModule): testes passando, commit feito
- [ ] `npx tsc --noEmit` — zero erros
- [ ] Suite completa: `DATABASE_URL=mysql://root@localhost/shiftpartido_test npx jest --testPathPattern="crm" --no-coverage` — todos verdes

---

## Referência Rápida de Rotas

| Método | Rota | Módulo |
|--------|------|--------|
| GET | /crm/tags | Tags |
| POST | /crm/tags | Tags |
| PATCH | /crm/tags/:id | Tags |
| DELETE | /crm/tags/:id | Tags |
| POST | /crm/people/:id/tags | PeopleTags |
| DELETE | /crm/people/:id/tags/:tagId | PeopleTags |
| GET | /crm/pipeline/stages | Pipeline |
| POST | /crm/pipeline/stages | Pipeline |
| POST | /crm/pipeline/stages/order | Pipeline (static before :id) |
| PATCH | /crm/pipeline/stages/:id | Pipeline |
| DELETE | /crm/pipeline/stages/:id | Pipeline |
| GET | /crm/pipeline/entries | Pipeline |
| POST | /crm/pipeline/entries | Pipeline |
| PATCH | /crm/pipeline/entries/:id | Pipeline |
| GET | /crm/interactions | Interactions |
| POST | /crm/interactions | Interactions |
| GET | /crm/tasks | Tasks |
| POST | /crm/tasks | Tasks |
| PATCH | /crm/tasks/:id | Tasks |
| DELETE | /crm/tasks/:id | Tasks |
| GET | /crm/notifications | Notifications |
| PATCH | /crm/notifications/read-all | Notifications (static before :id) |
| PATCH | /crm/notifications/:id/read | Notifications |
| GET | /crm/events | Events |
| POST | /crm/events | Events |
| PATCH | /crm/events/:id | Events |
| DELETE | /crm/events/:id | Events |
| POST | /crm/events/:id/attendees | Events |
| DELETE | /crm/events/:id/attendees/:peopleId | Events |
| POST | /crm/device-tokens | DeviceTokens |
| DELETE | /crm/device-tokens/:token | DeviceTokens |
| POST | /crm/import | CrmImport |
| GET | /crm/import/:id | CrmImport |
| GET | /crm/dashboard | CrmDashboard |
