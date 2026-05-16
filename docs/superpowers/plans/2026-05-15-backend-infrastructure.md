# Backend — Infraestrutura: Schema + Auth + Test Setup

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install missing dependencies, configure Jest+Supertest, add all 24 new Prisma models to schema.prisma, run the initial CRM+Electoral migration, and implement auth refresh/logout endpoints.

**Architecture:** Additive-only Prisma migrations. New models follow the existing `partido_` table prefix pattern. JWT refresh uses hashed refresh tokens stored in users table (new columns via ADD COLUMN migration). Test database is a separate MySQL DB (`shiftpartido_test`) using same schema.

**Tech Stack:** NestJS 10, Prisma 5, MySQL localhost:root, Jest 29 + ts-jest, Supertest, @nestjs/schedule, @nestjs/platform-express (multer), csv-parse, bcryptjs (already installed)

---

## Chunk 1: Install Dependencies + Jest Setup

### 1.1 — Install new npm packages

- [ ] From `backend/` directory, run:

```bash
npm install @nestjs/schedule csv-parse
npm install --save-dev @nestjs/testing jest@29 ts-jest@29 @types/jest supertest @types/supertest @types/multer
```

Expected result: `package.json` gains entries under `dependencies` and `devDependencies` for the above packages. No existing packages should be altered.

### 1.2 — Configure Jest in package.json

- [ ] Open `backend/package.json` and add a `jest` config block plus new test scripts. The final `scripts` section and `jest` block should be:

```json
"scripts": {
  "build": "nest build",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "test": "jest --runInBand",
  "test:watch": "jest --watch",
  "test:e2e": "jest --config ./test/jest-e2e.json --runInBand",
  "test:cov": "jest --coverage"
},
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### 1.3 — Create jest.config.ts (unit tests)

- [ ] Create file `backend/jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};

export default config;
```

### 1.4 — Create test/jest-e2e.json (e2e tests config)

- [ ] Create file `backend/test/jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### 1.5 — Create test/helpers/create-test-app.ts

- [ ] Create file `backend/test/helpers/create-test-app.ts`:

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

/**
 * Sobe uma instância NestJS real contra o banco de testes (TEST_DATABASE_URL).
 * Deve ser chamado no beforeAll de cada e2e test.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Mesmo pipe de validação do main.ts
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}
```

### 1.6 — Create test/helpers/auth.helper.ts

- [ ] Create file `backend/test/helpers/auth.helper.ts`:

```typescript
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
```

### 1.7 — Add TEST_DATABASE_URL to .env

- [ ] Open `backend/.env` and add (abaixo das variáveis existentes):

```env
# Banco de dados de testes — schema idêntico ao principal
TEST_DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test"
```

### 1.8 — Ensure DATABASE_URL is switched for e2e tests

- [ ] Create `backend/test/setup-test-db.sh` (script auxiliar, executado manualmente antes de rodar e2e):

```bash
#!/usr/bin/env bash
# Cria o banco de testes e aplica as migrations
set -e
mysql -u root -e "CREATE DATABASE IF NOT EXISTS shiftpartido_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx prisma migrate deploy
echo "✓ shiftpartido_test pronto"
```

- [ ] Make it executable:

```bash
chmod +x backend/test/setup-test-db.sh
```

### 1.9 — Update PrismaService to support test DATABASE_URL

- [ ] Open `backend/src/database/prisma.service.ts`. If the constructor does not already read `DATABASE_URL` from env, verify it uses the standard Prisma approach (which reads `DATABASE_URL` automatically from env). For e2e tests, the test runner must set `DATABASE_URL=TEST_DATABASE_URL` before starting. Add this note as a comment in the file if not already present.

### Chunk 1 Git Commit

- [ ] Stage and commit:

```bash
git add backend/package.json backend/jest.config.ts backend/test/ backend/.env
git commit -m "chore: install Jest 29 + ts-jest + supertest, add e2e test helpers"
```

---

## Chunk 2: Prisma Schema — CRM Models

All additions are **append-only** to `backend/prisma/schema.prisma`. Never drop or alter existing fields.

### 2.0 — Add back-relations to existing `people` model

- [ ] In `backend/prisma/schema.prisma`, locate the `model people { ... }` block. Add the following relation fields **after** the existing `recurring_transactions recurring_transactions[]` line (before the `@@unique` directives):

```prisma
  // CRM back-relations (adicionadas na migração crm_electoral_party_complete)
  people_tags       people_tags[]
  pipeline_entries  pipeline_entries[]
  interactions      interactions[]
  tasks             tasks[]
  event_attendances event_attendances[]
  // Electoral back-relations
  campaign_as_candidate campaigns[]       @relation("CampaignCandidate")
  campaign_as_vendor    campaign_contracts[] @relation("ContractVendor")
  campaign_team         campaign_team[]
  chapter_members       chapter_members[]
  organ_members         organ_members[]
  mandates              mandates[]
```

### 2.1 — Add `tags` and `people_tags` models

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Tags e Segmentação
// ─────────────────────────────────────────────────────────────────────────────

model tags {
  id         BigInt    @id @default(autoincrement())
  tenant_id  BigInt
  name       String    @db.VarChar(100)
  color      String    @db.VarChar(7)    // hex #RRGGBB
  created_by BigInt
  created_at DateTime  @default(now())
  deleted_at DateTime?

  tenant      tenants       @relation(fields: [tenant_id], references: [id])
  people_tags people_tags[]

  @@unique([tenant_id, name])
  @@index([tenant_id])
  @@map("partido_crm_tags")
}

model people_tags {
  person_id BigInt
  tag_id    BigInt
  tenant_id BigInt

  person people  @relation(fields: [person_id], references: [id])
  tag    tags    @relation(fields: [tag_id], references: [id])
  tenant tenants @relation(fields: [tenant_id], references: [id])

  @@id([person_id, tag_id])
  @@index([tenant_id])
  @@index([tag_id])
  @@map("partido_crm_people_tags")
}
```

### 2.2 — Add `pipeline_stages` and `pipeline_entries` models

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Pipeline de Recrutamento
// ─────────────────────────────────────────────────────────────────────────────

model pipeline_stages {
  id                 BigInt    @id @default(autoincrement())
  tenant_id          BigInt
  name               String    @db.VarChar(100)
  color              String    @db.VarChar(7)
  order              Int
  is_default         Boolean   @default(false)   // contatos novos entram aqui
  is_final           Boolean   @default(false)   // conversão → atualiza people.type
  target_people_type String?   @db.VarChar(50)   // ex: "filiado" — usado quando is_final=true
  created_by         BigInt
  created_at         DateTime  @default(now())
  updated_at         DateTime? @updatedAt
  deleted_at         DateTime?

  tenant           tenants            @relation(fields: [tenant_id], references: [id])
  pipeline_entries pipeline_entries[]

  @@unique([tenant_id, name])
  @@index([tenant_id])
  @@index([tenant_id, order])
  @@map("partido_crm_pipeline_stages")
}

model pipeline_entries {
  id         BigInt    @id @default(autoincrement())
  tenant_id  BigInt
  person_id  BigInt
  stage_id   BigInt
  entered_at DateTime  @default(now())
  exited_at  DateTime?
  notes      String?   @db.Text
  created_by BigInt
  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt

  tenant tenants         @relation(fields: [tenant_id], references: [id])
  person people          @relation(fields: [person_id], references: [id])
  stage  pipeline_stages @relation(fields: [stage_id], references: [id])

  @@index([tenant_id, person_id])
  @@index([tenant_id, stage_id])
  @@map("partido_crm_pipeline_entries")
}
```

### 2.3 — Add `interactions` model + enums

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Interações (append-only: nunca editar, só soft delete)
// ─────────────────────────────────────────────────────────────────────────────

model interactions {
  id          BigInt                @id @default(autoincrement())
  tenant_id   BigInt
  person_id   BigInt
  type        interaction_type
  direction   interaction_direction
  summary     String                @db.Text
  occurred_at DateTime
  created_by  BigInt
  created_at  DateTime              @default(now())
  deleted_at  DateTime?

  tenant tenants @relation(fields: [tenant_id], references: [id])
  person people  @relation(fields: [person_id], references: [id])

  @@index([tenant_id, person_id])
  @@index([tenant_id, occurred_at])
  @@index([tenant_id, type])
  @@map("partido_crm_interactions")
}
```

### 2.4 — Add `tasks` model + enums

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Tarefas
// ─────────────────────────────────────────────────────────────────────────────

model tasks {
  id           BigInt        @id @default(autoincrement())
  tenant_id    BigInt
  person_id    BigInt?
  title        String        @db.VarChar(255)
  description  String?       @db.Text
  due_date     DateTime      @db.Date
  status       task_status   @default(pending)
  priority     task_priority @default(medium)
  assigned_to  BigInt
  created_by   BigInt
  created_at   DateTime      @default(now())
  updated_at   DateTime?     @updatedAt
  completed_at DateTime?
  deleted_at   DateTime?

  tenant   tenants @relation(fields: [tenant_id], references: [id])
  person   people? @relation(fields: [person_id], references: [id])
  assignee users   @relation("TaskAssignee", fields: [assigned_to], references: [id])

  @@index([tenant_id, assigned_to, status])
  @@index([tenant_id, due_date, status])
  @@index([tenant_id, person_id])
  @@map("partido_crm_tasks")
}
```

### 2.5 — Add `notifications` model + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Notificações In-App
// ─────────────────────────────────────────────────────────────────────────────

model notifications {
  id          BigInt            @id @default(autoincrement())
  tenant_id   BigInt
  user_id     BigInt
  type        notification_type
  title       String            @db.VarChar(255)
  message     String            @db.Text
  read        Boolean           @default(false)
  entity_type String?           @db.VarChar(50)
  entity_id   BigInt?
  created_at  DateTime          @default(now())

  tenant tenants @relation(fields: [tenant_id], references: [id])
  user   users   @relation(fields: [user_id], references: [id])

  @@index([tenant_id, user_id, read])
  @@index([tenant_id, user_id])
  @@map("partido_crm_notifications")
}
```

### 2.6 — Add `events` and `event_attendances` models + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Eventos e Presença
// ─────────────────────────────────────────────────────────────────────────────

model events {
  id          BigInt    @id @default(autoincrement())
  tenant_id   BigInt
  name        String    @db.VarChar(255)
  description String?   @db.Text
  location    String?   @db.VarChar(255)
  start_at    DateTime
  end_at      DateTime?
  is_active   Boolean   @default(true)
  created_by  BigInt
  created_at  DateTime  @default(now())
  updated_at  DateTime? @updatedAt
  deleted_at  DateTime?

  tenant      tenants             @relation(fields: [tenant_id], references: [id])
  attendances event_attendances[]

  @@index([tenant_id, start_at])
  @@index([tenant_id, is_active])
  @@map("partido_crm_events")
}

model event_attendances {
  id            BigInt                  @id @default(autoincrement())
  event_id      BigInt
  person_id     BigInt
  tenant_id     BigInt
  status        event_attendance_status @default(invited)
  registered_at DateTime                @default(now())
  updated_at    DateTime?               @updatedAt

  event  events  @relation(fields: [event_id], references: [id])
  person people  @relation(fields: [person_id], references: [id])
  tenant tenants @relation(fields: [tenant_id], references: [id])

  @@unique([event_id, person_id])
  @@index([event_id])
  @@index([tenant_id, person_id])
  @@map("partido_crm_event_attendances")
}
```

### 2.7 — Add `device_tokens` model

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Device Tokens FCM (Push Notifications Mobile)
// ─────────────────────────────────────────────────────────────────────────────

model device_tokens {
  id         BigInt    @id @default(autoincrement())
  tenant_id  BigInt
  user_id    BigInt
  token      String    @db.VarChar(512)   // FCM registration token
  platform   String    @db.VarChar(20)    // "android" | "ios"
  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt

  tenant tenants @relation(fields: [tenant_id], references: [id])
  user   users   @relation(fields: [user_id], references: [id])

  @@unique([user_id, token])
  @@index([user_id])
  @@map("partido_crm_device_tokens")
}
```

### 2.8 — Add `crm_imports` model + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM — Importação CSV
// ─────────────────────────────────────────────────────────────────────────────

model crm_imports {
  id         BigInt        @id @default(autoincrement())
  tenant_id  BigInt
  filename   String        @db.VarChar(255)
  status     import_status @default(processing)
  total      Int           @default(0)
  imported   Int           @default(0)
  skipped    Int           @default(0)
  errors     Json?
  created_by BigInt
  created_at DateTime      @default(now())
  updated_at DateTime?     @updatedAt

  tenant tenants @relation(fields: [tenant_id], references: [id])

  @@index([tenant_id])
  @@index([tenant_id, status])
  @@map("partido_crm_imports")
}
```

### 2.9 — Add CRM enums to schema

- [ ] Append to the ENUMS section of `backend/prisma/schema.prisma` (after the existing enums block):

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// CRM Enums
// ─────────────────────────────────────────────────────────────────────────────

enum interaction_type {
  call
  email
  whatsapp
  meeting
  visit
  other
}

enum interaction_direction {
  inbound
  outbound
}

enum task_status {
  pending
  in_progress
  done
  cancelled
}

enum task_priority {
  low
  medium
  high
}

enum notification_type {
  task_assigned
  task_overdue
  pipeline_moved
  event_reminder
}

enum event_attendance_status {
  invited
  confirmed
  attended
  absent
}

enum import_status {
  processing
  done
  failed
}
```

### 2.10 — Update `tenants` back-relations

- [ ] In `model tenants { ... }`, add the new CRM back-relations (after existing `audit_logs audit_logs[]`):

```prisma
  // CRM relations
  tags              tags[]
  people_tags       people_tags[]
  pipeline_stages   pipeline_stages[]
  pipeline_entries  pipeline_entries[]
  interactions      interactions[]
  notifications     notifications[]
  events            events[]
  event_attendances event_attendances[]
  device_tokens     device_tokens[]
  crm_imports       crm_imports[]
  // Electoral + Party relations
  elections          elections[]
  campaigns          campaigns[]
  campaign_team      campaign_team[]
  campaign_contracts campaign_contracts[]
  campaign_contract_payments campaign_contract_payments[]
  campaign_schedule  campaign_schedule[]
  tse_reports        tse_reports[]
  party_chapters     party_chapters[]
  chapter_members    chapter_members[]
  party_organs       party_organs[]
  organ_members      organ_members[]
  mandates           mandates[]
```

### 2.11 — Update `users` back-relations

- [ ] In `model users { ... }`, add new back-relations (after existing ones):

```prisma
  // CRM relations
  tasks_assigned    tasks[]         @relation("TaskAssignee")
  notifications     notifications[]
  device_tokens     device_tokens[]
```

### Chunk 2 Git Commit

- [ ] Stage and commit:

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(schema): add CRM models — tags, pipeline, interactions, tasks, notifications, events, device_tokens, crm_imports"
```

---

## Chunk 3: Prisma Schema — Electoral + Party Models

### 3.1 — Add `elections` model + `election_scope` enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Eleições
// ─────────────────────────────────────────────────────────────────────────────

model elections {
  id            BigInt         @id @default(autoincrement())
  tenant_id     BigInt
  year          Int
  scope         election_scope
  name          String         @db.VarChar(255)
  description   String?        @db.Text
  election_date DateTime?      @db.Date
  runoff_date   DateTime?      @db.Date
  is_active     Boolean        @default(true)
  created_by    BigInt
  created_at    DateTime       @default(now())
  updated_at    DateTime?      @updatedAt
  deleted_at    DateTime?

  tenant    tenants     @relation(fields: [tenant_id], references: [id])
  campaigns campaigns[]

  @@index([tenant_id, year])
  @@index([tenant_id, scope])
  @@map("partido_elections")
}
```

### 3.2 — Add `campaigns` model + `campaign_status` enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Campanhas Eleitorais
// ─────────────────────────────────────────────────────────────────────────────

model campaigns {
  id           BigInt          @id @default(autoincrement())
  tenant_id    BigInt
  election_id  BigInt
  person_id    BigInt          // candidato (people.type = candidato)
  name         String          @db.VarChar(255)
  position     String          @db.VarChar(100)
  number       String?         @db.VarChar(20)
  status       campaign_status @default(planning)
  budget_limit Decimal?        @db.Decimal(14, 2)
  start_date   DateTime?       @db.Date
  end_date     DateTime?       @db.Date
  description  String?         @db.Text
  created_by   BigInt
  created_at   DateTime        @default(now())
  updated_at   DateTime?       @updatedAt
  deleted_at   DateTime?

  tenant                 tenants                  @relation(fields: [tenant_id], references: [id])
  election               elections                @relation(fields: [election_id], references: [id])
  candidate              people                   @relation("CampaignCandidate", fields: [person_id], references: [id])
  transactions           transactions[]
  recurring_transactions recurring_transactions[]
  campaign_team          campaign_team[]
  campaign_contracts     campaign_contracts[]
  campaign_schedule      campaign_schedule[]
  tse_reports            tse_reports[]
  mandates               mandates[]

  @@index([tenant_id, election_id])
  @@index([tenant_id, status])
  @@map("partido_campaigns")
}
```

### 3.3 — Add `campaign_team` model + enums

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Equipe da Campanha
// ─────────────────────────────────────────────────────────────────────────────

model campaign_team {
  id           BigInt                   @id @default(autoincrement())
  tenant_id    BigInt
  campaign_id  BigInt
  person_id    BigInt
  role         team_member_role
  payment_type team_member_payment_type @default(voluntario)
  salary       Decimal?                 @db.Decimal(12, 2)
  start_date   DateTime                 @db.Date
  end_date     DateTime?                @db.Date
  notes        String?                  @db.Text
  created_by   BigInt
  created_at   DateTime                 @default(now())
  updated_at   DateTime?                @updatedAt
  deleted_at   DateTime?

  tenant   tenants   @relation(fields: [tenant_id], references: [id])
  campaign campaigns @relation(fields: [campaign_id], references: [id])
  person   people    @relation(fields: [person_id], references: [id])

  @@unique([campaign_id, person_id])
  @@index([tenant_id, campaign_id])
  @@map("partido_campaign_team")
}
```

### 3.4 — Add `campaign_contracts` and `campaign_contract_payments` models + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Contratos de Campanha (Fornecedores)
// ─────────────────────────────────────────────────────────────────────────────

model campaign_contracts {
  id          BigInt          @id @default(autoincrement())
  tenant_id   BigInt
  campaign_id BigInt
  person_id   BigInt          // fornecedor (people.type = fornecedor)
  description String          @db.VarChar(255)
  object      String          @db.Text
  value       Decimal         @db.Decimal(12, 2)
  status      contract_status @default(draft)
  start_date  DateTime?       @db.Date
  end_date    DateTime?       @db.Date
  tse_code    String?         @db.VarChar(20)
  created_by  BigInt
  created_at  DateTime        @default(now())
  updated_at  DateTime?       @updatedAt
  deleted_at  DateTime?

  tenant   tenants   @relation(fields: [tenant_id], references: [id])
  campaign campaigns @relation(fields: [campaign_id], references: [id])
  vendor   people    @relation("ContractVendor", fields: [person_id], references: [id])
  payments campaign_contract_payments[]

  @@index([tenant_id, campaign_id])
  @@index([tenant_id, status])
  @@map("partido_campaign_contracts")
}

model campaign_contract_payments {
  id             BigInt    @id @default(autoincrement())
  tenant_id      BigInt
  contract_id    BigInt
  transaction_id BigInt?
  amount         Decimal   @db.Decimal(12, 2)
  due_date       DateTime  @db.Date
  paid_at        DateTime? @db.Date
  notes          String?   @db.Text
  created_by     BigInt
  created_at     DateTime  @default(now())

  tenant      tenants            @relation(fields: [tenant_id], references: [id])
  contract    campaign_contracts @relation(fields: [contract_id], references: [id])

  @@index([tenant_id, contract_id])
  @@map("partido_campaign_contract_payments")
}
```

### 3.5 — Add `campaign_schedule` model + enums

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Agenda da Campanha
// ─────────────────────────────────────────────────────────────────────────────

model campaign_schedule {
  id          BigInt                @id @default(autoincrement())
  tenant_id   BigInt
  campaign_id BigInt
  title       String                @db.VarChar(255)
  type        schedule_event_type
  status      schedule_event_status @default(planned)
  location    String?               @db.VarChar(255)
  start_at    DateTime
  end_at      DateTime?
  notes       String?               @db.Text
  created_by  BigInt
  created_at  DateTime              @default(now())
  updated_at  DateTime?             @updatedAt
  deleted_at  DateTime?

  tenant   tenants   @relation(fields: [tenant_id], references: [id])
  campaign campaigns @relation(fields: [campaign_id], references: [id])

  @@index([tenant_id, campaign_id])
  @@index([tenant_id, start_at])
  @@map("partido_campaign_schedule")
}
```

### 3.6 — Add TSE models + enums

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral — Prestação de Contas TSE
// ─────────────────────────────────────────────────────────────────────────────

model tse_codes {
  id          Int     @id @default(autoincrement())
  code        String  @unique @db.VarChar(20)
  description String  @db.VarChar(255)
  type        String  @db.VarChar(10)   // "income" | "expense"
  is_active   Boolean @default(true)

  report_items tse_report_items[]

  @@map("partido_tse_codes")
}

model tse_reports {
  id           BigInt            @id @default(autoincrement())
  tenant_id    BigInt
  campaign_id  BigInt
  type         tse_report_type
  status       tse_report_status @default(draft)
  reference    String            @db.VarChar(50)
  period_start DateTime          @db.Date
  period_end   DateTime          @db.Date
  submitted_at DateTime?
  tse_protocol String?           @db.VarChar(100)
  notes        String?           @db.Text
  created_by   BigInt
  created_at   DateTime          @default(now())
  updated_at   DateTime?         @updatedAt

  tenant   tenants            @relation(fields: [tenant_id], references: [id])
  campaign campaigns          @relation(fields: [campaign_id], references: [id])
  items    tse_report_items[]

  @@index([tenant_id, campaign_id])
  @@map("partido_tse_reports")
}

model tse_report_items {
  id             BigInt   @id @default(autoincrement())
  report_id      BigInt
  transaction_id BigInt
  tse_code_id    Int
  notes          String?  @db.Text
  created_at     DateTime @default(now())

  report    tse_reports @relation(fields: [report_id], references: [id])
  tse_code  tse_codes   @relation(fields: [tse_code_id], references: [id])

  @@index([report_id])
  @@map("partido_tse_report_items")
}
```

### 3.7 — Add `party_chapters` and `chapter_members` models + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Estrutura Partidária — Diretórios (Seções Locais)
// ─────────────────────────────────────────────────────────────────────────────

model party_chapters {
  id        BigInt        @id @default(autoincrement())
  tenant_id BigInt
  name      String        @db.VarChar(255)
  level     chapter_level
  state     String?       @db.VarChar(2)
  city      String?       @db.VarChar(100)
  zone      String?       @db.VarChar(100)
  parent_id BigInt?
  is_active Boolean       @default(true)
  created_by BigInt
  created_at DateTime     @default(now())
  updated_at DateTime?    @updatedAt
  deleted_at DateTime?

  tenant   tenants          @relation(fields: [tenant_id], references: [id])
  parent   party_chapters?  @relation("ChapterHierarchy", fields: [parent_id], references: [id])
  children party_chapters[] @relation("ChapterHierarchy")
  members  chapter_members[]

  @@index([tenant_id, level])
  @@index([tenant_id, parent_id])
  @@map("partido_party_chapters")
}

model chapter_members {
  id         BigInt    @id @default(autoincrement())
  chapter_id BigInt
  person_id  BigInt
  tenant_id  BigInt
  role       String?   @db.VarChar(100)
  joined_at  DateTime  @db.Date
  left_at    DateTime? @db.Date

  chapter party_chapters @relation(fields: [chapter_id], references: [id])
  person  people         @relation(fields: [person_id], references: [id])
  tenant  tenants        @relation(fields: [tenant_id], references: [id])

  @@unique([chapter_id, person_id])
  @@index([tenant_id])
  @@map("partido_chapter_members")
}
```

### 3.8 — Add `party_organs` and `organ_members` models

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Estrutura Partidária — Órgãos Partidários
// ─────────────────────────────────────────────────────────────────────────────

model party_organs {
  id          BigInt    @id @default(autoincrement())
  tenant_id   BigInt
  name        String    @db.VarChar(255)
  description String?   @db.Text
  is_active   Boolean   @default(true)
  created_by  BigInt
  created_at  DateTime  @default(now())
  updated_at  DateTime? @updatedAt
  deleted_at  DateTime?

  tenant  tenants        @relation(fields: [tenant_id], references: [id])
  members organ_members[]

  @@index([tenant_id])
  @@map("partido_party_organs")
}

model organ_members {
  id        BigInt    @id @default(autoincrement())
  organ_id  BigInt
  person_id BigInt
  tenant_id BigInt
  role      String?   @db.VarChar(100)
  joined_at DateTime  @db.Date
  left_at   DateTime? @db.Date

  organ  party_organs @relation(fields: [organ_id], references: [id])
  person people       @relation(fields: [person_id], references: [id])
  tenant tenants      @relation(fields: [tenant_id], references: [id])

  @@unique([organ_id, person_id])
  @@index([tenant_id])
  @@map("partido_organ_members")
}
```

### 3.9 — Add `mandates` model + enum

- [ ] Append to `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Mandatos
// ─────────────────────────────────────────────────────────────────────────────

model mandates {
  id           BigInt         @id @default(autoincrement())
  tenant_id    BigInt
  person_id    BigInt
  campaign_id  BigInt?
  position     String         @db.VarChar(100)
  jurisdiction String         @db.VarChar(255)
  start_date   DateTime       @db.Date
  end_date     DateTime?      @db.Date
  status       mandate_status @default(active)
  notes        String?        @db.Text
  created_by   BigInt
  created_at   DateTime       @default(now())
  updated_at   DateTime?      @updatedAt
  deleted_at   DateTime?

  tenant   tenants    @relation(fields: [tenant_id], references: [id])
  person   people     @relation(fields: [person_id], references: [id])
  campaign campaigns? @relation(fields: [campaign_id], references: [id])

  @@index([tenant_id, person_id])
  @@index([tenant_id, status])
  @@map("partido_mandates")
}
```

### 3.10 — Add Electoral + Party enums

- [ ] Append to the enums section of `backend/prisma/schema.prisma`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// Electoral + Party Enums
// ─────────────────────────────────────────────────────────────────────────────

enum election_scope {
  municipal
  estadual
  federal
  distrital
}

enum campaign_status {
  planning
  active
  suspended
  finished
}

enum team_member_role {
  coordenador_geral
  coordenador_area
  assessor
  cabo_eleitoral
  voluntario
  motorista
  seguranca
  comunicacao
  juridico
  financeiro
  outros
}

enum team_member_payment_type {
  voluntario
  remunerado
  prestador
}

enum contract_status {
  draft
  active
  completed
  cancelled
}

enum schedule_event_type {
  comicio
  caminhada
  reuniao
  corpo_a_corpo
  entrevista
  debate
  panfletagem
  visita
  evento_social
  outro
}

enum schedule_event_status {
  planned
  confirmed
  done
  cancelled
}

enum tse_report_type {
  parcial
  final
  suplementar
}

enum tse_report_status {
  draft
  submitted
  approved
  rejected
  rectified
}

enum chapter_level {
  nacional
  estadual
  municipal
  zonal
  setorial
}

enum mandate_status {
  active
  finished
  renounced
  revoked
  suspended
}
```

### 3.11 — Expand existing document enums (GED — seção 11 do spec)

- [ ] In `backend/prisma/schema.prisma`, locate `enum document_type` and expand:

```prisma
enum document_type {
  ata
  contrato
  pessoal
  financeiro
  procuracao
  declaracao
  estatuto
  regimento
  pesquisa
}
```

- [ ] Locate `enum document_entity_type` and expand:

```prisma
enum document_entity_type {
  people
  financial
  campaign
  general
  election
  mandate
  chapter
  organ
  contract
}
```

**IMPORTANT:** In MySQL, expanding an ENUM requires an `ALTER TABLE ... MODIFY COLUMN` statement. Prisma generates this automatically in the migration SQL. Verify the generated SQL uses `MODIFY COLUMN` not `DROP COLUMN`. Never drop the existing values.

### 3.12 — Add `campaign_id` FK to transactions and recurring_transactions

> The `campaign_id` column already exists in both tables but without a FK constraint. The migration will ADD the FK only.

- [ ] In `backend/prisma/schema.prisma`, locate `model transactions { ... }` and add:

```prisma
  campaign    campaigns? @relation(fields: [campaign_id], references: [id])
```

(The `campaign_id BigInt?` column is already present — only the relation line is new.)

- [ ] In `model recurring_transactions { ... }`, add:

```prisma
  campaign    campaigns? @relation(fields: [campaign_id], references: [id])
```

### 3.13 — Add refresh_token columns to users model

- [ ] In `backend/prisma/schema.prisma`, locate `model users { ... }` and add the following fields (after `last_login_at` or before `deleted_at`):

```prisma
  refresh_token_hash       String?   @db.VarChar(255)
  refresh_token_expires_at DateTime?
```

These will generate an `ALTER TABLE partido_users ADD COLUMN ...` migration (additive only).

### Chunk 3 Git Commit

- [ ] Stage and commit:

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(schema): add Electoral, Party, Mandates models + expand document enums + refresh_token columns"
```

---

## Chunk 4: Run Migration + Generate Client

### 4.1 — Validate schema compiles

- [ ] From `backend/` directory:

```bash
npx prisma validate
```

Expected: no errors. If Prisma reports missing relation errors, check that all back-relations on `people`, `users`, `tenants`, `transactions`, and `recurring_transactions` were correctly added in Chunks 2–3.

### 4.2 — Run migration (development)

- [ ] From `backend/` directory:

```bash
npx prisma migrate dev --name crm_electoral_party_complete
```

Expected: Prisma creates `backend/prisma/migrations/YYYYMMDDHHMMSS_crm_electoral_party_complete/migration.sql` containing only `CREATE TABLE`, `ADD COLUMN`, `ALTER TABLE ... ADD CONSTRAINT`, and `MODIFY COLUMN` statements. **Review the generated SQL before confirming** — reject if any `DROP TABLE` or `DROP COLUMN` appears.

Checklist for reviewing `migration.sql`:
- [ ] Contains `CREATE TABLE partido_crm_tags`
- [ ] Contains `CREATE TABLE partido_crm_people_tags`
- [ ] Contains `CREATE TABLE partido_crm_pipeline_stages`
- [ ] Contains `CREATE TABLE partido_crm_pipeline_entries`
- [ ] Contains `CREATE TABLE partido_crm_interactions`
- [ ] Contains `CREATE TABLE partido_crm_tasks`
- [ ] Contains `CREATE TABLE partido_crm_notifications`
- [ ] Contains `CREATE TABLE partido_crm_events`
- [ ] Contains `CREATE TABLE partido_crm_event_attendances`
- [ ] Contains `CREATE TABLE partido_crm_device_tokens`
- [ ] Contains `CREATE TABLE partido_crm_imports`
- [ ] Contains `CREATE TABLE partido_elections`
- [ ] Contains `CREATE TABLE partido_campaigns`
- [ ] Contains `CREATE TABLE partido_campaign_team`
- [ ] Contains `CREATE TABLE partido_campaign_contracts`
- [ ] Contains `CREATE TABLE partido_campaign_contract_payments`
- [ ] Contains `CREATE TABLE partido_campaign_schedule`
- [ ] Contains `CREATE TABLE partido_tse_codes`
- [ ] Contains `CREATE TABLE partido_tse_reports`
- [ ] Contains `CREATE TABLE partido_tse_report_items`
- [ ] Contains `CREATE TABLE partido_party_chapters`
- [ ] Contains `CREATE TABLE partido_chapter_members`
- [ ] Contains `CREATE TABLE partido_party_organs`
- [ ] Contains `CREATE TABLE partido_organ_members`
- [ ] Contains `CREATE TABLE partido_mandates`
- [ ] Contains `ALTER TABLE partido_users ADD COLUMN refresh_token_hash`
- [ ] Contains `ALTER TABLE partido_users ADD COLUMN refresh_token_expires_at`
- [ ] Contains `MODIFY COLUMN` for `document_type` and `document_entity_type` (no DROP)
- [ ] Does NOT contain any `DROP TABLE` or `DROP COLUMN`

### 4.3 — Generate Prisma Client

- [ ] From `backend/` directory:

```bash
npx prisma generate
```

Expected: client regenerated with all new models and enums available.

### 4.4 — Apply migration to test database

- [ ] From `backend/` directory:

```bash
DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx prisma migrate deploy
```

### Chunk 4 Git Commit

- [ ] Stage and commit:

```bash
git add backend/prisma/migrations/
git commit -m "feat(migration): run crm_electoral_party_complete migration — 24 new models, refresh_token columns, expanded document enums"
```

---

## Chunk 5: Auth — Refresh Token + Logout

### 5.1 — Write the e2e test FIRST (TDD)

- [ ] Create `backend/test/auth.e2e-spec.ts`:

```typescript
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
```

Run the test — it will fail because the endpoints do not exist yet. This is expected (red phase).

```bash
cd backend && DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx jest --config ./test/jest-e2e.json --testPathPattern="auth.e2e-spec" --runInBand
```

### 5.2 — Create `RefreshDto` and `LogoutDto`

- [ ] Create `backend/src/modules/auth/dto/refresh.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

- [ ] Create `backend/src/modules/auth/dto/logout.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### 5.3 — Update `login` to also return refresh_token

- [ ] Open `backend/src/modules/auth/auth.service.ts`. Update the `login` method to generate and store a refresh token.

Full updated `login` method (replace existing):

```typescript
async login(dto: LoginDto, req: Request) {
  const user = await this.usersService.findByEmail(dto.email);

  if (!user) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  if (user.status !== 'active') {
    throw new ForbiddenException('Usuário inativo ou bloqueado');
  }

  const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
  if (!passwordValid) {
    throw new UnauthorizedException('Credenciais inválidas');
  }

  const roles = user.user_roles.map((ur) => ur.roles.name);

  const payload: JwtPayload = {
    userId: Number(user.id),
    tenantId: Number(user.tenant_id),
    roles,
  };

  const accessToken = this.jwtService.sign(payload);

  // Gera refresh token: UUID aleatório + hash bcrypt para armazenamento
  const rawRefreshToken = this.generateRawToken();
  const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  await Promise.all([
    // Persiste hash do refresh token (nunca o valor bruto)
    this.prisma.users.update({
      where: { id: user.id },
      data: {
        refresh_token_hash: refreshTokenHash,
        refresh_token_expires_at: refreshTokenExpiresAt,
      },
    }),
    this.usersService.updateLastLogin(Number(user.id)),
    this.registrarAuditoria({
      tenantId: Number(user.tenant_id),
      userId: Number(user.id),
      action: 'LOGIN',
      entity: 'users',
      entityId: Number(user.id),
      ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
      metadata: { email: user.email },
    }),
  ]);

  return {
    data: {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    },
    message: 'Login realizado com sucesso',
  };
}
```

### 5.4 — Add `refreshToken` and `logout` methods to AuthService

- [ ] In `backend/src/modules/auth/auth.service.ts`, add the following methods (before `registrarAuditoria`):

```typescript
/**
 * Valida o refresh_token bruto contra o hash armazenado e retorna novo access_token.
 * Regras:
 *  - hash deve conferir (bcrypt.compare)
 *  - refresh_token_expires_at não pode estar no passado
 *  - usuário deve estar ativo
 */
async refreshToken(rawRefreshToken: string): Promise<{ data: { access_token: string }; message: string }> {
  // Busca usuário pelo hash — não é possível buscar pelo valor bruto
  // Estratégia: buscar usuários com refresh_token_hash não nulo e comparar
  // Para evitar full table scan, o token bruto inclui o userId como prefixo: "userId.randomPart"
  const [userIdStr, ...rest] = rawRefreshToken.split('.');
  const userId = Number(userIdStr);

  if (!userId || isNaN(userId)) {
    throw new UnauthorizedException('Refresh token inválido');
  }

  const user = await this.prisma.users.findFirst({
    where: {
      id: userId,
      deleted_at: null,
      status: 'active',
      refresh_token_hash: { not: null },
    },
    include: {
      user_roles: { include: { roles: true } },
    },
  });

  if (!user || !user.refresh_token_hash || !user.refresh_token_expires_at) {
    throw new UnauthorizedException('Refresh token inválido');
  }

  // Verifica expiração
  if (user.refresh_token_expires_at < new Date()) {
    throw new UnauthorizedException('Refresh token expirado');
  }

  // Compara o token bruto com o hash armazenado
  const tokenValid = await bcrypt.compare(rawRefreshToken, user.refresh_token_hash);
  if (!tokenValid) {
    throw new UnauthorizedException('Refresh token inválido');
  }

  const roles = user.user_roles.map((ur) => ur.roles.name);

  const payload: JwtPayload = {
    userId: Number(user.id),
    tenantId: Number(user.tenant_id),
    roles,
  };

  const accessToken = this.jwtService.sign(payload);

  await this.registrarAuditoria({
    tenantId: Number(user.tenant_id),
    userId: Number(user.id),
    action: 'REFRESH_TOKEN',
    entity: 'users',
    entityId: Number(user.id),
    ipAddress: 'api',
    metadata: {},
  });

  return {
    data: { access_token: accessToken },
    message: 'Token renovado com sucesso',
  };
}

/**
 * Invalida o refresh_token limpando o hash no banco.
 * O token bruto é validado antes da invalidação para evitar logout de terceiros.
 */
async logout(rawRefreshToken: string): Promise<{ data: null; message: string }> {
  const [userIdStr] = rawRefreshToken.split('.');
  const userId = Number(userIdStr);

  if (!userId || isNaN(userId)) {
    // Retorna sucesso mesmo com token inválido — evita enumeração de usuários
    return { data: null, message: 'Logout realizado com sucesso' };
  }

  const user = await this.prisma.users.findFirst({
    where: {
      id: userId,
      deleted_at: null,
      refresh_token_hash: { not: null },
    },
  });

  if (user?.refresh_token_hash) {
    const tokenValid = await bcrypt.compare(rawRefreshToken, user.refresh_token_hash);
    if (tokenValid) {
      await this.prisma.users.update({
        where: { id: userId },
        data: {
          refresh_token_hash: null,
          refresh_token_expires_at: null,
        },
      });

      await this.registrarAuditoria({
        tenantId: Number(user.tenant_id),
        userId: Number(user.id),
        action: 'LOGOUT',
        entity: 'users',
        entityId: Number(user.id),
        ipAddress: 'api',
        metadata: {},
      });
    }
  }

  return { data: null, message: 'Logout realizado com sucesso' };
}

/**
 * Gera um token bruto que inclui o userId como prefixo para lookup eficiente.
 * Formato: "{userId}.{randomBase64}"
 * O userId é inserido pelo chamador (login method) após geração do userId.
 * Nota: este método gera a parte aleatória; o prefixo userId é concatenado no login.
 */
private generateRawToken(): string {
  // crypto.randomBytes retorna bytes aleatórios seguros
  const { randomBytes } = require('crypto');
  return randomBytes(40).toString('base64url');
}
```

> **IMPORTANTE:** O formato do raw refresh token precisa incluir o `userId` como prefixo para evitar full table scan. Ajuste o `login` method para concatenar: `rawRefreshToken = \`${user.id}.${this.generateRawToken()}\``.

- [ ] Update the `login` method line that generates the raw token to:

```typescript
const rawRefreshToken = `${user.id}.${this.generateRawToken()}`;
```

### 5.5 — Add new endpoints to AuthController

- [ ] Open `backend/src/modules/auth/auth.controller.ts`. Add imports and new endpoints:

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  @Get('me')
  me(@CurrentUser() currentUser: JwtPayload) {
    return this.authService.me(currentUser);
  }

  /**
   * Renova o access_token usando um refresh_token válido.
   * @Public — não requer JWT no header (o refresh_token é a credencial).
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * Invalida o refresh_token (logout explícito).
   * @Public — o refresh_token expirado/inválido não deve impedir o logout.
   */
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
```

### 5.6 — Run the e2e test (green phase)

- [ ] From `backend/` directory:

```bash
DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx jest --config ./test/jest-e2e.json --testPathPattern="auth.e2e-spec" --runInBand
```

Expected: all 4 tests pass. If login returns 401, verify the test seed user exists in `shiftpartido_test`. If Prisma complains about missing columns, run `DATABASE_URL="mysql://root@localhost:3306/shiftpartido_test" npx prisma migrate deploy` first.

### 5.7 — Unit test AuthService.refreshToken (optional, fast feedback)

- [ ] Create `backend/src/modules/auth/auth.service.spec.ts`:

```typescript
/**
 * Testes unitários do AuthService — refresh e logout.
 * Usa mocks de PrismaService e JwtService (sem banco real).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock mínimo do PrismaService
const mockUser = {
  id: BigInt(1),
  tenant_id: BigInt(1),
  status: 'active',
  password_hash: '',
  refresh_token_hash: '',
  refresh_token_expires_at: new Date(Date.now() + 1000 * 60 * 60),
  deleted_at: null,
  user_roles: [],
};

const prismaMock = {
  users: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  audit_logs: {
    create: jest.fn(),
  },
};

const jwtMock = {
  sign: jest.fn(() => 'mocked.jwt.token'),
};

describe('AuthService — refreshToken + logout', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UsersService', useValue: {} },
        { provide: JwtService, useValue: jwtMock },
        { provide: 'PrismaService', useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve lançar UnauthorizedException para token sem userId prefix', async () => {
    await expect(service.refreshToken('sem-prefixo-userid')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('deve lançar UnauthorizedException para token expirado', async () => {
    const expiredUser = {
      ...mockUser,
      refresh_token_hash: await bcrypt.hash('1.tokenvalido', 10),
      refresh_token_expires_at: new Date(Date.now() - 1000),
    };
    prismaMock.users.findFirst.mockResolvedValueOnce(expiredUser);

    await expect(service.refreshToken('1.tokenvalido')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
```

### Chunk 5 Git Commit

- [ ] Stage and commit:

```bash
git add backend/src/modules/auth/ backend/test/auth.e2e-spec.ts
git commit -m "feat(auth): implement refresh token + logout endpoints with bcrypt hash storage"
```

---

## Summary: Models Added

| # | Model | Table | Chunk |
|---|-------|-------|-------|
| 1 | tags | partido_crm_tags | 2 |
| 2 | people_tags | partido_crm_people_tags | 2 |
| 3 | pipeline_stages | partido_crm_pipeline_stages | 2 |
| 4 | pipeline_entries | partido_crm_pipeline_entries | 2 |
| 5 | interactions | partido_crm_interactions | 2 |
| 6 | tasks | partido_crm_tasks | 2 |
| 7 | notifications | partido_crm_notifications | 2 |
| 8 | events | partido_crm_events | 2 |
| 9 | event_attendances | partido_crm_event_attendances | 2 |
| 10 | device_tokens | partido_crm_device_tokens | 2 |
| 11 | crm_imports | partido_crm_imports | 2 |
| 12 | elections | partido_elections | 3 |
| 13 | campaigns | partido_campaigns | 3 |
| 14 | campaign_team | partido_campaign_team | 3 |
| 15 | campaign_contracts | partido_campaign_contracts | 3 |
| 16 | campaign_contract_payments | partido_campaign_contract_payments | 3 |
| 17 | campaign_schedule | partido_campaign_schedule | 3 |
| 18 | tse_codes | partido_tse_codes | 3 |
| 19 | tse_reports | partido_tse_reports | 3 |
| 20 | tse_report_items | partido_tse_report_items | 3 |
| 21 | party_chapters | partido_party_chapters | 3 |
| 22 | chapter_members | partido_chapter_members | 3 |
| 23 | party_organs | partido_party_organs | 3 |
| 24 | organ_members | partido_organ_members | 3 |
| 25 | mandates | partido_mandates | 3 |

**Total: 25 new models** (spec mentions 24 but `campaign_contract_payments` is a separate model from `campaign_contracts`).

## New Enums Added

CRM: `interaction_type`, `interaction_direction`, `task_status`, `task_priority`, `notification_type`, `event_attendance_status`, `import_status`

Electoral: `election_scope`, `campaign_status`, `team_member_role`, `team_member_payment_type`, `contract_status`, `schedule_event_type`, `schedule_event_status`, `tse_report_type`, `tse_report_status`

Party + Mandates: `chapter_level`, `mandate_status`

Expanded: `document_type` (+5 values), `document_entity_type` (+5 values)

## Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `backend/package.json` | Jest config + test scripts adicionados |
| `backend/jest.config.ts` | Criado |
| `backend/test/jest-e2e.json` | Criado |
| `backend/test/helpers/create-test-app.ts` | Criado |
| `backend/test/helpers/auth.helper.ts` | Criado |
| `backend/test/setup-test-db.sh` | Criado |
| `backend/test/auth.e2e-spec.ts` | Criado |
| `backend/.env` | TEST_DATABASE_URL adicionado |
| `backend/prisma/schema.prisma` | 25 novos models + enums + back-relations + colunas refresh_token |
| `backend/prisma/migrations/...crm_electoral_party_complete/` | Gerado pelo migrate dev |
| `backend/src/modules/auth/auth.service.ts` | refreshToken + logout + generateRawToken |
| `backend/src/modules/auth/auth.controller.ts` | POST /auth/refresh + POST /auth/logout |
| `backend/src/modules/auth/dto/refresh.dto.ts` | Criado |
| `backend/src/modules/auth/dto/logout.dto.ts` | Criado |
| `backend/src/modules/auth/auth.service.spec.ts` | Criado |
