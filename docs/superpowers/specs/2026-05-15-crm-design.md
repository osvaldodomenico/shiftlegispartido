# CRM ShiftPartido — Design Spec

**Data:** 2026-05-15
**Projeto:** ShiftPartido
**Stack:** NestJS + Prisma + MySQL (backend) · Next.js (web) · Flutter (mobile iOS/Android)
**Abordagem aprovada:** Módulos CRM integrados no sistema existente (Abordagem A)

---

## ⚠️ RESTRIÇÃO DE BANCO DE DADOS

**Localhost (desenvolvimento):** Liberdade total — pode dropar, recriar, resetar migrations conforme necessário.

**DB Online (produção/EasyPanel):** **NUNCA executar `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` ou qualquer operação destrutiva sem autorização explícita do dono.** Todas as migrações para produção devem ser revisadas manualmente antes de aplicar.

> Conexão de desenvolvimento: MySQL **localhost**, usuário **root**.

---

## 1. Contexto e Objetivo

O ShiftPartido já possui backend NestJS com módulos de auth, users, people, financial, documents, contributions e cost-centers. O modelo `people` gerencia contatos com tipos: `filiado | fornecedor | funcionario | candidato | doador | voluntario`.

O CRM adiciona 8 novos módulos para:

- Rastrear interações com contatos (ligações, WhatsApp, reuniões, e-mails)
- Gerenciar funil de recrutamento **configurável** com etapas personalizáveis
- Atribuir e acompanhar tarefas com responsáveis e prazos
- Gerenciar eventos com controle de presença
- Segmentar contatos por tags coloridas
- Importar contatos em massa via CSV
- Exibir KPIs e métricas no dashboard

**Clientes da API:** Next.js web admin (existente + novas páginas CRM) e Flutter mobile app (novo).

---

## 2. Novos Modelos de Dados (Prisma)

> Todos seguem os padrões existentes: `tenant_id` do JWT, `soft delete` via `deleted_at`, `created_by`, `audit_log` em todas as escritas.

### 2.0 Adições ao modelo `people` existente (back-relations)

O modelo `people` em `schema.prisma` deve receber as seguintes relações adicionais (migração aditiva — sem alterar campos):

```prisma
// Adicionar ao model people { ... }
people_tags       people_tags[]
pipeline_entries  pipeline_entries[]
interactions      interactions[]
tasks             tasks[]
event_attendances event_attendances[]
```

---

### 2.1 Tags e Segmentação

```prisma
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
  person_id  BigInt
  tag_id     BigInt
  tenant_id  BigInt    // necessário para scoping e indexação por tenant

  person people  @relation(fields: [person_id], references: [id])
  tag    tags    @relation(fields: [tag_id], references: [id])
  tenant tenants @relation(fields: [tenant_id], references: [id])

  @@id([person_id, tag_id])
  @@index([tenant_id])
  @@index([tag_id])
  @@map("partido_crm_people_tags")
}
```

### 2.2 Pipeline de Recrutamento

```prisma
model pipeline_stages {
  id                BigInt    @id @default(autoincrement())
  tenant_id         BigInt
  name              String    @db.VarChar(100)
  color             String    @db.VarChar(7)
  order             Int
  is_default        Boolean   @default(false)   // contatos novos entram aqui
  is_final          Boolean   @default(false)   // ao chegar aqui, aplica target_people_type
  target_people_type String?  @db.VarChar(50)   // ex: "filiado", "fornecedor" — usado quando is_final=true
  created_by        BigInt
  created_at        DateTime  @default(now())
  updated_at        DateTime? @updatedAt
  deleted_at        DateTime?

  tenant           tenants           @relation(fields: [tenant_id], references: [id])
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

### 2.3 Interações

> Interações são **imutáveis após criação** (append-only). `updated_at` não se aplica — registrar novo interaction ao invés de editar.

```prisma
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
  deleted_at  DateTime?             // soft delete = "cancelar registro errado"

  tenant tenants @relation(fields: [tenant_id], references: [id])
  person people  @relation(fields: [person_id], references: [id])

  @@index([tenant_id, person_id])
  @@index([tenant_id, occurred_at])
  @@index([tenant_id, type])
  @@map("partido_crm_interactions")
}
```

### 2.4 Tarefas

```prisma
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

  tenant   tenants  @relation(fields: [tenant_id], references: [id])
  person   people?  @relation(fields: [person_id], references: [id])
  assignee users    @relation("TaskAssignee", fields: [assigned_to], references: [id])
  creator  users    @relation("TaskCreator", fields: [created_by], references: [id])

  @@index([tenant_id, assigned_to, status])
  @@index([tenant_id, due_date, status])
  @@index([tenant_id, person_id])
  @@map("partido_crm_tasks")
}
```

### 2.5 Notificações In-App

```prisma
enum notification_type {
  task_assigned
  task_overdue
  pipeline_moved
  event_reminder
}

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

### 2.6 Eventos e Presença

```prisma
enum event_attendance_status {
  invited
  confirmed
  attended
  absent
}

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

### 2.7 Device Tokens FCM (Push Notifications Mobile)

Necessário para que o backend envie push via FCM para usuários Flutter.

```prisma
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

Endpoint associado:
```
POST   /crm/device-tokens    body: { token, platform }  → registra token do dispositivo atual
DELETE /crm/device-tokens    body: { token }             → remove no logout
```

### 2.8 Importação CSV

```prisma
// (seção renomeada para 2.8 — conteúdo igual)
enum import_status {
  processing
  done
  failed
}

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

---

## 3. Módulos NestJS

### 3.1 Módulos a criar

Todos organizados em `src/modules/crm/` como namespace lógico.

| Módulo | Diretório | Responsabilidade |
|--------|-----------|-----------------|
| `TagsModule` | `crm/tags/` | CRUD tags + associar a people |
| `PipelineModule` | `crm/pipeline/` | CRUD stages + mover contato + reordenar |
| `InteractionsModule` | `crm/interactions/` | Log append-only de interações |
| `TasksModule` | `crm/tasks/` | CRUD tarefas + notificação ao atribuir |
| `NotificationsModule` | `crm/notifications/` | Listar + marcar lidas — usado por outros módulos |
| `EventsModule` | `crm/events/` | CRUD eventos + controle presença |
| `CrmImportModule` | `crm/import/` | Upload + processar CSV síncrono |
| `CrmDashboardModule` | `crm/dashboard/` | Agregações e KPIs |
| `DeviceTokensModule` | `crm/device-tokens/` | Registrar/remover tokens FCM por dispositivo |

### 3.2 Rotas — todas sob prefixo `/crm/`

```
# Tags
GET    /crm/tags
POST   /crm/tags
PATCH  /crm/tags/:id
DELETE /crm/tags/:id
POST   /crm/people/:id/tags              body: { tagId }
DELETE /crm/people/:id/tags/:tagId

# Pipeline
GET    /crm/pipeline/stages
POST   /crm/pipeline/stages
POST   /crm/pipeline/stages/order        body: { orderedIds: number[] }  ← static antes de :id
PATCH  /crm/pipeline/stages/:id
DELETE /crm/pipeline/stages/:id
POST   /crm/pipeline/move                body: { personId, stageId, notes? }
GET    /crm/pipeline/entries?personId=   histórico de um contato
GET    /crm/pipeline/stages/:stageId/people

# Interações
GET    /crm/interactions?personId=&type=&direction=&from=&to=
POST   /crm/interactions
DELETE /crm/interactions/:id

# Tarefas
GET    /crm/tasks?assignedTo=me&status=&priority=&due=
POST   /crm/tasks
PATCH  /crm/tasks/:id
PATCH  /crm/tasks/:id/complete
DELETE /crm/tasks/:id

# Notificações
GET    /crm/notifications
GET    /crm/notifications/unread-count   ← static antes de /:id
PATCH  /crm/notifications/read-all       ← static antes de /:id
PATCH  /crm/notifications/:id/read

# Eventos
GET    /crm/events
POST   /crm/events
PATCH  /crm/events/:id
DELETE /crm/events/:id
GET    /crm/events/:id/attendances
POST   /crm/events/:id/attendances       body: { personId }
PATCH  /crm/events/:id/attendances/:personId  body: { status }

# Importação CSV
POST   /crm/import/upload                multipart/form-data
GET    /crm/import/history
GET    /crm/import/:id                   detalhes completos
GET    /crm/import/:id/status
GET    /crm/import/:id/errors

# Dashboard
GET    /crm/dashboard/kpis
GET    /crm/dashboard/pipeline-funnel
GET    /crm/dashboard/tasks-summary
GET    /crm/dashboard/mobile             versão compacta para Flutter
```

> **Atenção NestJS:** Rotas estáticas (`/order`, `/read-all`, `/unread-count`, `/history`, `/upload`) declaradas **antes** das rotas com parâmetros (`/:id`) no controller para evitar conflito de roteamento.

### 3.3 Expansões no módulo `people` existente

```
GET /people/:id/interactions
GET /people/:id/tasks
GET /people/:id/pipeline-history
GET /people/:id/events
GET /people/:id/tags
GET /people?stage=:stageId&tag=:tagId    novos filtros adicionados ao endpoint existente
```

### 3.4 Novo endpoint em `auth` (necessário para Flutter)

O módulo `auth` atual (`auth.controller.ts`) tem apenas `POST /auth/login` e `GET /auth/me`. O Flutter precisa de refresh token automático.

```
POST /auth/refresh    body: { refreshToken }  → retorna novo accessToken
POST /auth/logout     invalida o refreshToken
```

Adicionar `refresh_token_hash` e `refresh_token_expires_at` na tabela `users` (migração aditiva).

---

## 4. Frontend Next.js — Novas Páginas

### 4.1 Rotas

```
app/(dashboard)/crm/
  page.tsx                         Dashboard KPIs
  contacts/
    page.tsx                       Lista (filtros: tipo, tag, stage, status)
    [id]/page.tsx                  Ficha completa com timeline
  pipeline/
    page.tsx                       Kanban drag-and-drop por etapa
  tasks/
    page.tsx                       Lista (minhas / todas, filtros)
  events/
    page.tsx                       Lista + calendário
    [id]/page.tsx                  Detalhes + lista presença
  import/
    page.tsx                       Wizard CSV: upload → preview → resultado
  settings/
    pipeline/page.tsx              Gerenciar etapas (nome, cor, ordem)
    tags/page.tsx                  Gerenciar tags
```

### 4.2 Componentes principais

- `ContactTimeline` — timeline unificada: interações + tarefas + pipeline + eventos
- `PipelineKanban` — colunas drag-and-drop (`@dnd-kit/core`)
- `TaskList` — lista com filtros e ordenação por prazo/prioridade
- `NotificationBell` — badge + dropdown (polling `GET /crm/notifications/unread-count` a cada 30s via React Query)
- `CsvImportWizard` — upload → preview → resultado com erros
- `KpiCards` — métricas: total contatos por tipo, conversões no funil, tarefas vencidas

---

## 5. Flutter Mobile App

### 5.1 Telas

```
/splash              Loading + verificação de auth
/login               Login JWT
/home                Dashboard compacto (tarefas do dia + KPIs resumidos)
/contacts            Lista + busca + filtros (tipo, stage, tag)
/contacts/:id        Ficha: dados, timeline, etapa, tags
/contacts/:id/interaction/new   Registrar interação rápida
/tasks               Minhas tarefas + filtros status/prazo
/tasks/new           Nova tarefa
/pipeline            Contatos por etapa (lista, não kanban)
/events              Próximos eventos
/events/:id          Detalhes + check-in de presença
/notifications       Central de alertas
/settings            Configurações do app (conta, logout)
```

### 5.2 Stack técnica

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| State management | Riverpod | Moderno, testável, recomendado pela comunidade |
| HTTP client | Dio | Interceptors JWT, fácil refresh |
| Armazenamento seguro | flutter_secure_storage | JWT em KeyChain/Keystore |
| Push notifications | Firebase Cloud Messaging (FCM) | Push nativo iOS/Android |
| Navegação | GoRouter | Roteamento declarativo com guards |
| UI | Material Design 3 | Padrão Flutter atual |

### 5.3 Auth Flutter — fluxo completo

```
1. Login: POST /auth/login → { accessToken, refreshToken }
2. Armazenar ambos em flutter_secure_storage
3. Dio interceptor:
   - Toda request: Authorization: Bearer <accessToken>
   - Se 401: tenta POST /auth/refresh com refreshToken
   - Se refresh OK: atualiza accessToken, reexecuta request original
   - Se refresh 401: logout → /login
4. GoRouter redirect: se sem token → redireciona para /login
```

> `POST /auth/refresh` e `POST /auth/logout` precisam ser **implementados no backend** (ver seção 3.4). Atualmente o auth controller tem apenas `/auth/login` e `/auth/me`.

---

## 6. Regras de Negócio

### Pipeline

- Exatamente 1 stage com `is_default = true` por tenant (validação no service)
- Ao criar novo contato sem stage especificado → inserir `pipeline_entries` apontando para o stage default
- Ao mover para stage com `is_final = true` e `target_people_type` preenchido:
  - Atualizar `people.type = target_people_type` via `updateMany` (padrão com tenant_id)
  - Gravar `audit_log`
- Não permitir `DELETE` de stage com entries ativas (validar no service antes de deletar)
- Reordenação: `POST /crm/pipeline/stages/order` com `{ orderedIds }` → atualização atômica em transação

### Tarefas

- Criar tarefa com `assigned_to ≠ created_by` → `NotificationsService.create({ type: 'task_assigned', ... })`
- Cron `@Cron('0 8 * * *')` (diário 08:00): query `tasks WHERE status IN (pending, in_progress) AND due_date < today` → criar `notification` tipo `task_overdue`
- Adicionar `@nestjs/schedule` ao `AppModule` se não existir

### Importação CSV

| Campo | Regra |
|-------|-------|
| `name` | Obrigatório, não vazio |
| `email` | Opcional, formato RFC válido se presente |
| `cpf` | Opcional, exatamente 11 dígitos numéricos |
| Identificação | CPF (quando presente) → `cpf_hash`; fallback: email |
| Conflito | Skip (não sobrescreve) — linha adicionada em `errors` |
| Chunk | 100 registros por iteração (síncrono) |
| Resultado | `{ total, imported, skipped, errors: [] }` em `crm_imports` |

### Notificações Web

- Polling `GET /crm/notifications/unread-count` a cada 30s (React Query `refetchInterval`)
- Badge no sidebar com contador

### Notificações Flutter (FCM)

- Backend: `NotificationsService.create()` também dispara FCM push para `task_assigned` e `task_overdue`
- Flutter: `FirebaseMessaging.onMessage` → exibe in-app; `onBackgroundMessage` → notificação nativa

---

## 7. RBAC — Novas Permission Keys

```
crm.contacts.read       Visualizar lista e fichas de contatos
crm.contacts.write      Criar e editar contatos
crm.interactions.write  Registrar interações
crm.pipeline.manage     Mover contatos no funil + configurar etapas
crm.tasks.manage        Criar e editar tarefas
crm.tasks.assign        Atribuir tarefas a outros usuários
crm.events.manage       Criar eventos e gerenciar presenças
crm.tags.manage         Criar e gerenciar tags
crm.import.execute      Executar importações CSV
crm.dashboard.view      Visualizar dashboard e KPIs
```

---

## 8. Estrutura de Arquivos (backend novos)

```
backend/src/modules/crm/
  tags/
    tags.module.ts · tags.controller.ts · tags.service.ts
    dto/create-tag.dto.ts · update-tag.dto.ts
  pipeline/
    pipeline.module.ts · pipeline.controller.ts · pipeline.service.ts
    dto/create-stage.dto.ts · update-stage.dto.ts · move-person.dto.ts · reorder-stages.dto.ts
  interactions/
    interactions.module.ts · interactions.controller.ts · interactions.service.ts
    dto/create-interaction.dto.ts
  tasks/
    tasks.module.ts · tasks.controller.ts · tasks.service.ts
    dto/create-task.dto.ts · update-task.dto.ts
  notifications/
    notifications.module.ts · notifications.controller.ts · notifications.service.ts
  events/
    events.module.ts · events.controller.ts · events.service.ts
    dto/create-event.dto.ts · update-event.dto.ts · update-attendance.dto.ts
  import/
    crm-import.module.ts · crm-import.controller.ts · crm-import.service.ts
    helpers/csv-parser.helper.ts
  dashboard/
    crm-dashboard.module.ts · crm-dashboard.controller.ts · crm-dashboard.service.ts

backend/prisma/
  migrations/20260515000000_crm_modules/migration.sql  ← SOMENTE CREATE TABLE / ADD COLUMN
```

---

## 9. Fases de Implementação

| Fase | Conteúdo | Pré-requisitos |
|------|----------|----------------|
| 1 | Schema Prisma + migração aditiva | — |
| 2 | Auth: refresh token endpoint | Fase 1 |
| 3 | Backend: Tags + Pipeline | Fase 1 |
| 4 | Backend: Interactions + Tasks + Notifications | Fase 1 |
| 5 | Backend: Events + CrmImport + CrmDashboard | Fase 1 |
| 6 | Next.js: contacts, pipeline kanban, tasks | Fases 3–4 |
| 7 | Next.js: events, import wizard, dashboard, settings | Fase 5 |
| 8 | Flutter: projeto base + auth + contacts + interactions | Fases 3–4 |
| 9 | Flutter: tasks + pipeline + events + notifications + FCM | Fase 4–5 |

---

## 10. Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Pipeline etapas | Configurável com `target_people_type` | Flexível para diferentes tipos de funil |
| Notificações web | Polling 30s | Sem dependência de WebSocket |
| Notificações mobile | FCM | Push nativo iOS/Android |
| Import CSV | Síncrono em chunks de 100 | Sem queue externa |
| Flutter state | Riverpod | Moderno, testável |
| Flutter HTTP | Dio | Interceptors JWT para refresh automático |
| Pipeline drag-and-drop web | @dnd-kit/core | Mais mantido que react-beautiful-dnd |
| Cron tarefas vencidas | @nestjs/schedule | Padrão NestJS |
| Migrações | Apenas aditivas | Nunca DROP — proteção de dados produção |
| DB desenvolvimento | MySQL localhost root | Sem VPN/EasyPanel durante dev |

---

## 11. GED — Expansão dos Enums de Documento

Adicionar valores aos enums existentes (migração aditiva — ALTER TABLE, nunca DROP):

```prisma
// Adicionar a enum document_type:
//   procuracao, declaracao, estatuto, regimento, pesquisa

// Adicionar a enum document_entity_type (já tem: people, financial, campaign, general):
//   election, mandate, chapter, organ, contract
```

O módulo `documents` existente não precisa de alterações — apenas as novas entidades poderão usar entity_type ao criar documentos via API.

---

## 12. Módulos Eleitorais

### 12.1 Eleições

```prisma
enum election_scope {
  municipal
  estadual
  federal
  distrital
}

model elections {
  id          BigInt         @id @default(autoincrement())
  tenant_id   BigInt
  year        Int
  scope       election_scope
  name        String         @db.VarChar(255)  // ex: "Eleições Municipais 2024"
  description String?        @db.Text
  election_date DateTime?    @db.Date
  runoff_date   DateTime?    @db.Date          // 2º turno
  is_active   Boolean        @default(true)
  created_by  BigInt
  created_at  DateTime       @default(now())
  updated_at  DateTime?      @updatedAt
  deleted_at  DateTime?

  tenant    tenants     @relation(fields: [tenant_id], references: [id])
  campaigns campaigns[]

  @@index([tenant_id, year])
  @@index([tenant_id, scope])
  @@map("partido_elections")
}
```

### 12.2 Campanhas Eleitorais

O campo `campaign_id` já existe em `transactions` e `recurring_transactions` mas sem FK. Esta migração adiciona o modelo e a FK.

```prisma
enum campaign_status {
  planning
  active
  suspended
  finished
}

model campaigns {
  id             BigInt          @id @default(autoincrement())
  tenant_id      BigInt
  election_id    BigInt
  person_id      BigInt          // candidato (people.type = candidato)
  name           String          @db.VarChar(255)
  position       String          @db.VarChar(100)  // "Vereador", "Deputado Federal"
  number         String?         @db.VarChar(20)   // número eleitoral
  status         campaign_status @default(planning)
  budget_limit   Decimal?        @db.Decimal(14, 2) // limite legal TSE
  start_date     DateTime?       @db.Date
  end_date       DateTime?       @db.Date
  description    String?         @db.Text
  created_by     BigInt
  created_at     DateTime        @default(now())
  updated_at     DateTime?       @updatedAt
  deleted_at     DateTime?

  tenant               tenants                @relation(fields: [tenant_id], references: [id])
  election             elections              @relation(fields: [election_id], references: [id])
  candidate            people                 @relation("CampaignCandidate", fields: [person_id], references: [id])
  transactions         transactions[]
  recurring_transactions recurring_transactions[]
  campaign_team        campaign_team[]
  campaign_contracts   campaign_contracts[]
  campaign_schedule    campaign_schedule[]
  tse_reports          tse_reports[]
  mandates             mandates[]

  @@index([tenant_id, election_id])
  @@index([tenant_id, person_id])
  @@index([tenant_id, status])
  @@map("partido_campaigns")
}
```

> **Migração FK aditiva:** Adicionar `CONSTRAINT fk_transactions_campaign FOREIGN KEY (campaign_id) REFERENCES partido_campaigns(id)` nas tabelas `partido_transactions` e `partido_recurring_transactions`.

### 12.3 Equipe da Campanha (Contratação)

```prisma
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
  voluntario      // sem remuneração
  remunerado      // contrato de trabalho / RPA
  prestador       // PJ / nota fiscal
}

model campaign_team {
  id            BigInt                    @id @default(autoincrement())
  tenant_id     BigInt
  campaign_id   BigInt
  person_id     BigInt                    // pode ser filiado, voluntário ou novo cadastro
  role          team_member_role
  payment_type  team_member_payment_type  @default(voluntario)
  salary        Decimal?                  @db.Decimal(12, 2) // se remunerado
  start_date    DateTime                  @db.Date
  end_date      DateTime?                 @db.Date
  notes         String?                   @db.Text
  created_by    BigInt
  created_at    DateTime                  @default(now())
  updated_at    DateTime?                 @updatedAt
  deleted_at    DateTime?

  tenant   tenants   @relation(fields: [tenant_id], references: [id])
  campaign campaigns @relation(fields: [campaign_id], references: [id])
  person   people    @relation(fields: [person_id], references: [id])

  @@unique([campaign_id, person_id])
  @@index([tenant_id, campaign_id])
  @@map("partido_campaign_team")
}
```

### 12.4 Contratos de Campanha (Fornecedores)

```prisma
enum contract_status {
  draft
  active
  completed
  cancelled
}

model campaign_contracts {
  id            BigInt          @id @default(autoincrement())
  tenant_id     BigInt
  campaign_id   BigInt
  person_id     BigInt          // fornecedor (people.type = fornecedor)
  description   String          @db.VarChar(255)
  object        String          @db.Text          // objeto do contrato
  value         Decimal         @db.Decimal(14, 2)
  status        contract_status @default(draft)
  signed_at     DateTime?       @db.Date
  start_date    DateTime?       @db.Date
  end_date      DateTime?       @db.Date
  tse_code      String?         @db.VarChar(20)   // código TSE da despesa
  created_by    BigInt
  created_at    DateTime        @default(now())
  updated_at    DateTime?       @updatedAt
  deleted_at    DateTime?

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
  transaction_id BigInt?   // FK → transactions (lançamento financeiro)
  amount         Decimal   @db.Decimal(12, 2)
  due_date       DateTime  @db.Date
  paid_at        DateTime? @db.Date
  notes          String?   @db.Text
  created_by     BigInt
  created_at     DateTime  @default(now())

  tenant      tenants                @relation(fields: [tenant_id], references: [id])
  contract    campaign_contracts     @relation(fields: [contract_id], references: [id])
  transaction transactions?          @relation(fields: [transaction_id], references: [id])

  @@index([tenant_id, contract_id])
  @@map("partido_campaign_contract_payments")
}
```

### 12.5 Agenda da Campanha

```prisma
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

model campaign_schedule {
  id          BigInt                 @id @default(autoincrement())
  tenant_id   BigInt
  campaign_id BigInt
  title       String                 @db.VarChar(255)
  type        schedule_event_type
  status      schedule_event_status  @default(planned)
  location    String?                @db.VarChar(255)
  start_at    DateTime
  end_at      DateTime?
  notes       String?                @db.Text
  created_by  BigInt
  created_at  DateTime               @default(now())
  updated_at  DateTime?              @updatedAt
  deleted_at  DateTime?

  tenant   tenants   @relation(fields: [tenant_id], references: [id])
  campaign campaigns @relation(fields: [campaign_id], references: [id])

  @@index([tenant_id, campaign_id])
  @@index([tenant_id, start_at])
  @@map("partido_campaign_schedule")
}
```

### 12.6 Prestação de Contas TSE

```prisma
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

// Códigos TSE de receita/despesa (tabela de referência — seeded)
model tse_codes {
  id          Int     @id @default(autoincrement())
  code        String  @db.VarChar(20)  @unique
  description String  @db.VarChar(255)
  type        String  @db.VarChar(10)  // "income" | "expense"
  is_active   Boolean @default(true)

  report_items tse_report_items[]

  @@map("partido_tse_codes")
}

model tse_reports {
  id             BigInt            @id @default(autoincrement())
  tenant_id      BigInt
  campaign_id    BigInt
  type           tse_report_type
  status         tse_report_status @default(draft)
  reference      String            @db.VarChar(50) // ex: "2024-1P"
  period_start   DateTime          @db.Date
  period_end     DateTime          @db.Date
  submitted_at   DateTime?
  tse_protocol   String?           @db.VarChar(100)
  notes          String?           @db.Text
  created_by     BigInt
  created_at     DateTime          @default(now())
  updated_at     DateTime?         @updatedAt

  tenant   tenants    @relation(fields: [tenant_id], references: [id])
  campaign campaigns  @relation(fields: [campaign_id], references: [id])
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

  report      tse_reports  @relation(fields: [report_id], references: [id])
  transaction transactions @relation(fields: [transaction_id], references: [id])
  tse_code    tse_codes    @relation(fields: [tse_code_id], references: [id])

  @@unique([report_id, transaction_id])
  @@index([report_id])
  @@map("partido_tse_report_items")
}
```

---

## 13. Estrutura Partidária

### 13.1 Diretórios (Seções Locais)

```prisma
enum chapter_level {
  nacional
  estadual
  municipal
  zonal
  setorial
}

model party_chapters {
  id          BigInt        @id @default(autoincrement())
  tenant_id   BigInt
  name        String        @db.VarChar(255)
  level       chapter_level
  state       String?       @db.VarChar(2)
  city        String?       @db.VarChar(100)
  zone        String?       @db.VarChar(100)   // zona eleitoral
  parent_id   BigInt?                            // hierarquia: municipal → estadual → nacional
  is_active   Boolean       @default(true)
  created_by  BigInt
  created_at  DateTime      @default(now())
  updated_at  DateTime?     @updatedAt
  deleted_at  DateTime?

  tenant   tenants         @relation(fields: [tenant_id], references: [id])
  parent   party_chapters? @relation("ChapterHierarchy", fields: [parent_id], references: [id])
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
  role       String?   @db.VarChar(100)  // "presidente", "secretário", "tesoureiro"
  joined_at  DateTime  @db.Date
  left_at    DateTime? @db.Date

  chapter party_chapters @relation(fields: [chapter_id], references: [id])
  person  people         @relation(fields: [person_id], references: [id])
  tenant  tenants        @relation(fields: [tenant_id], references: [id])

  @@unique([chapter_id, person_id])
  @@index([tenant_id, chapter_id])
  @@index([tenant_id, person_id])
  @@map("partido_chapter_members")
}
```

### 13.2 Órgãos Partidários

```prisma
model party_organs {
  id          BigInt    @id @default(autoincrement())
  tenant_id   BigInt
  name        String    @db.VarChar(255)  // "Comissão Executiva Nacional"
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

---

## 14. Mandatos

```prisma
enum mandate_status {
  active
  finished
  renounced
  revoked
  suspended
}

model mandates {
  id           BigInt         @id @default(autoincrement())
  tenant_id    BigInt
  person_id    BigInt
  campaign_id  BigInt?        // campanha que originou o mandato
  position     String         @db.VarChar(100)  // "Vereador", "Deputado Federal"
  jurisdiction String         @db.VarChar(255)  // "São Paulo - SP", "Câmara Federal"
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

---

## 15. Módulos NestJS — Adicionais (Eleitorais + Partidários)

Organizados em `src/modules/electoral/` e `src/modules/party/`:

| Módulo | Diretório | Rotas base |
|--------|-----------|-----------|
| `ElectionsModule` | `electoral/elections/` | `/electoral/elections` |
| `CampaignsModule` | `electoral/campaigns/` | `/electoral/campaigns` |
| `CampaignTeamModule` | `electoral/campaign-team/` | `/electoral/campaigns/:id/team` |
| `CampaignContractsModule` | `electoral/campaign-contracts/` | `/electoral/campaigns/:id/contracts` |
| `CampaignScheduleModule` | `electoral/campaign-schedule/` | `/electoral/campaigns/:id/schedule` |
| `TseReportsModule` | `electoral/tse-reports/` | `/electoral/campaigns/:id/tse` |
| `PartyChaptersModule` | `party/chapters/` | `/party/chapters` |
| `PartyOrgansModule` | `party/organs/` | `/party/organs` |
| `MandatesModule` | `mandates/` | `/mandates` |

### Rotas eleitorais

```
# Eleições
GET    /electoral/elections
POST   /electoral/elections
PATCH  /electoral/elections/:id
DELETE /electoral/elections/:id

# Campanhas
GET    /electoral/campaigns
POST   /electoral/campaigns
PATCH  /electoral/campaigns/:id
DELETE /electoral/campaigns/:id
GET    /electoral/campaigns/:id/summary   (candidato + equipe + financeiro + TSE)

# Equipe da Campanha
GET    /electoral/campaigns/:id/team
POST   /electoral/campaigns/:id/team
PATCH  /electoral/campaigns/:id/team/:memberId
DELETE /electoral/campaigns/:id/team/:memberId

# Contratos
GET    /electoral/campaigns/:id/contracts
POST   /electoral/campaigns/:id/contracts
PATCH  /electoral/campaigns/:id/contracts/:contractId
DELETE /electoral/campaigns/:id/contracts/:contractId
POST   /electoral/campaigns/:id/contracts/:contractId/payments

# Agenda da Campanha
GET    /electoral/campaigns/:id/schedule
POST   /electoral/campaigns/:id/schedule
PATCH  /electoral/campaigns/:id/schedule/:eventId
DELETE /electoral/campaigns/:id/schedule/:eventId

# Prestação de Contas TSE
GET    /electoral/tse-codes              lista de códigos TSE (referência)
GET    /electoral/campaigns/:id/tse
POST   /electoral/campaigns/:id/tse
PATCH  /electoral/campaigns/:id/tse/:reportId
POST   /electoral/campaigns/:id/tse/:reportId/items
DELETE /electoral/campaigns/:id/tse/:reportId/items/:itemId
POST   /electoral/campaigns/:id/tse/:reportId/submit

# Diretórios
GET    /party/chapters
GET    /party/chapters/tree              hierarquia completa
POST   /party/chapters
PATCH  /party/chapters/:id
DELETE /party/chapters/:id
GET    /party/chapters/:id/members
POST   /party/chapters/:id/members
PATCH  /party/chapters/:id/members/:memberId
DELETE /party/chapters/:id/members/:memberId

# Órgãos
GET    /party/organs
POST   /party/organs
PATCH  /party/organs/:id
DELETE /party/organs/:id
GET    /party/organs/:id/members
POST   /party/organs/:id/members
PATCH  /party/organs/:id/members/:memberId

# Mandatos
GET    /mandates
POST   /mandates
PATCH  /mandates/:id
DELETE /mandates/:id
GET    /mandates?personId=:id            mandatos de uma pessoa
```

---

## 16. Novas Páginas Frontend (Next.js)

```
app/(dashboard)/electoral/
  elections/
    page.tsx                  Lista de eleições
    [id]/page.tsx             Detalhes + campanhas da eleição
  campaigns/
    page.tsx                  Lista de campanhas (com filtro por eleição)
    [id]/
      page.tsx                Dashboard da campanha
      team/page.tsx           Equipe + contratos
      schedule/page.tsx       Agenda
      finance/page.tsx        Financeiro (gastos vs. orçamento)
      tse/page.tsx            Prestação de contas TSE
      tse/[reportId]/page.tsx Detalhes do relatório TSE

app/(dashboard)/party/
  chapters/
    page.tsx                  Árvore de diretórios
    [id]/page.tsx             Detalhes + membros
  organs/
    page.tsx                  Lista + membros

app/(dashboard)/mandates/
  page.tsx                    Lista de mandatos
  [id]/page.tsx               Ficha do mandato
```

---

## 17. Novas Telas Flutter

```
# Eleitorais
/electoral/campaigns         Lista de campanhas ativas
/electoral/campaigns/:id     Dashboard compacto da campanha
/electoral/campaigns/:id/schedule  Agenda do dia
/electoral/campaigns/:id/team      Lista da equipe

# Partido
/party/chapters              Lista de diretórios
/party/organs                Lista de órgãos

# Mandatos
/mandates                    Lista de eleitos
```

---

## 18. RBAC — Permission Keys Adicionais

```
electoral.elections.read      electoral.elections.manage
electoral.campaigns.read      electoral.campaigns.manage
electoral.team.manage         electoral.contracts.manage
electoral.schedule.manage     electoral.tse.manage
electoral.tse.submit

party.chapters.read           party.chapters.manage
party.organs.read             party.organs.manage

mandates.read                 mandates.manage
```

---

## 19. Fases de Implementação — Sistema Completo

| Fase | Conteúdo | Dependências |
|------|----------|-------------|
| 1 | Schema Prisma completo (CRM + Electoral + Party) + migração | — |
| 2 | Dependencies install + Jest/Supertest setup | — |
| 3 | Auth: refresh token + logout | Fase 1 |
| 4 | CRM: Tags + Pipeline (backend) | Fase 1 |
| 5 | CRM: Interactions + Tasks + Notifications (backend) | Fase 1 |
| 6 | CRM: Events + Import + Dashboard (backend) | Fase 1 |
| 7 | CRM: Device Tokens (FCM backend) | Fase 1 |
| 8 | Electoral: Elections + Campaigns (backend) | Fase 1 |
| 9 | Electoral: Campaign Team + Contracts + Schedule (backend) | Fase 8 |
| 10 | Electoral: TSE Reports + Códigos TSE seed (backend) | Fase 8 |
| 11 | Party: Chapters + Organs (backend) | Fase 1 |
| 12 | Mandates (backend) | Fase 8 |
| 13 | People module extensions (filtros CRM) | Fases 4–7 |
| 14 | AppModule: registrar todos os novos módulos | Fases 3–13 |
| 15 | Next.js: CRM pages (contacts, pipeline, tasks, events, import, dashboard) | Fases 4–7 |
| 16 | Next.js: Electoral pages (elections, campaigns, team, schedule, tse) | Fases 8–10 |
| 17 | Next.js: Party pages (chapters, organs) + Mandates page | Fases 11–12 |
| 18 | Flutter: project setup + auth + CRM (contacts, interactions, tasks) | Fases 4–7 |
| 19 | Flutter: electoral + party + notifications + FCM | Fases 8–12 |

---

## 20. Resumo Completo do Sistema

### Módulos existentes (não tocar sem necessidade)
auth · users · people · financial · financial-categories · cost-centers · financial-period-closings · recurring-transactions · contributions · documents · company

### Módulos CRM (novos — seções 2–7 deste spec)
tags · pipeline · interactions · tasks · notifications · events · crm-import · crm-dashboard · device-tokens

### Módulos Eleitorais (novos — seção 12)
elections · campaigns · campaign-team · campaign-contracts · campaign-schedule · tse-reports

### Módulos Partidários (novos — seção 13)
party-chapters · party-organs

### Módulos Mandatos (novos — seção 14)
mandates

### Total de novos modelos Prisma
CRM: 10 modelos + Electoral: 9 modelos + Party: 4 modelos + Mandate: 1 modelo = **24 novos modelos**

### Total de novos módulos NestJS
CRM: 9 + Electoral: 6 + Party: 2 + Mandates: 1 = **18 novos módulos**
