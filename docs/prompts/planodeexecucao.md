🚀 📦 ai-prompts.md — KIT COMPLETO
# 🚀 PROMPTS REFINADOS — SaaS Diretório

---

## ⚠️ REGRA GLOBAL (SEMPRE USAR)

Sempre começar com:

```plaintext
Use NestJS.
Arquitetura modular.
Siga regras:
- multi-tenant obrigatório (tenant_id)
- auditoria obrigatória
- soft delete (deleted_at)
- controller sem regra de negócio
- service com regra
- DTO obrigatório
- resposta padrão { success, data, message }

🔥 FASE 1 — AUTH

🎯 Criar módulo de autenticação
Crie um módulo de autenticação em NestJS com:

Requisitos:
- Login com email e senha
- Senha usando bcrypt
- JWT com payload contendo:
  - userId
  - tenantId
- Validação de usuário no banco
- Retornar access_token

Estrutura:
- auth.module.ts
- auth.controller.ts
- auth.service.ts
- jwt.strategy.ts

Regras:
- Não colocar lógica no controller
- Usar DTO
- Seguir padrão de resposta

Extras:
- Criar guard JWT


🎯 Validar usuário

Implemente função validateUser:

- Buscar usuário por email
- Comparar senha com bcrypt
- Retornar usuário sem password
- Lançar UnauthorizedException se inválido


🔥 FASE 2 — USERS + RBAC

🎯 CRUD de usuários
Crie módulo de usuários com:

- CRUD completo
- Campos:
  - name
  - email
  - password_hash
  - tenant_id

Regras:
- Sempre filtrar por tenant_id
- Soft delete
- DTO obrigatório
- Hash de senha no create/update

🎯 RBAC
Implemente RBAC com:

- Roles
- Permissions
- Tabela user_roles

Criar:
- RolesGuard
- Decorator @Roles()

Validar:
- usuário só acessa rotas permitidas


🎯 CRUD pessoas
Crie módulo de pessoas com:

Campos:
- name
- cpf
- type
- status

Regras:
- CPF criptografado no banco
- mascarado no retorno
- multi-tenant obrigatório

Extras:
- relacionamento com contacts

🔥 FASE 4 — FINANCEIRO
Crie módulo financeiro com:

Tabela transactions:
- type (income/expense)
- amount
- status
- due_date

Regras:
- nunca deletar
- usar status ao invés de delete
- vincular com pessoa
- filtrar por tenant

Extras:
- fluxo:
  pending → paid → overdue


  🔥 FASE 5 — DOCUMENTOS

🎯 Upload + versionamento
Crie módulo de documentos com:

- upload de arquivo
- versionamento
- flag is_sensitive

Regras:
- salvar caminho (path)
- não sobrescrever arquivo
- criar nova versão sempre

Extras:
- controle de acesso por tenant


🔥 FASE 6 — AUDITORIA

🎯 Auditoria global
Implemente interceptor global de auditoria:

Registrar:
- user_id
- tenant_id
- action
- entity
- metadata

Regras:
- registrar automaticamente em:
  - POST
  - PATCH
  - DELETE


 🔥 FASE 7 — FRONTEND

⸻

🎯 Login
 Crie tela de login em React com:

- email
- senha
- chamada API /auth/login
- salvar token no Zustand
- redirecionar para dashboard


🎯 Proteção de rota
Crie proteção de rota:

- verificar token
- redirecionar para login se não existir


🎯 Página Pessoas
Crie página de pessoas com:

- tabela listando pessoas
- botão criar
- modal de cadastro
- integração com API


💣 PROMPTS DE EVOLUÇÃO (NÍVEL AVANÇADO)

⸻

🔥 Adicionar refresh token
Implemente refresh token:

- gerar refresh token
- endpoint /auth/refresh
- renovar access_token

🔥 Adicionar logs detalhados
Melhore auditoria com:

- ip_address
- user_agent
- timestamp detalhado

🔥 Melhorar segurança
Implemente:

- rate limit
- bloqueio por tentativa
- expiração de sessão


🚀 CHECK FINAL
	•	Auth funcionando
	•	CRUD funcionando
	•	Multi-tenant validado
	•	Auditoria ativa
	•	Front conectado