🚀 📄 api-contract.md (PRONTO PRA PRODUÇÃO + IA)

Aqui está o seu arquivo completo 👇

# 🔌 API Contract — Plataforma do Diretório

---

## 🎯 Objetivo

Padronizar todas as respostas da API, autenticação, erros e comportamento entre frontend e backend.

---

## 📦 1. Padrão de Resposta

### ✅ Sucesso

```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso"
}


❌ Erro
{
  "success": false,
  "message": "Descrição do erro",
  "error": {
    "code": "ERROR_CODE",
    "details": []
  }
}


🔐 2. Autenticação
Tipo:
	•	Bearer Token (JWT)

Header obrigatório:
Authorization: Bearer <token>


Payload do Token:
{
  "userId": 1,
  "tenantId": 10,
  "role": "admin"
}

🏢 3. Multi-Tenant
	•	Toda requisição autenticada deve usar tenantId do token
	•	Nunca aceitar tenant_id vindo do frontend
	•	Backend deve injetar automaticamente

⸻

📄 4. Paginação

Request:
GET /people?page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100
    }
  }
}


🔍 5. Filtros

Exemplo:
GET /people?name=joao&status=active


🧾 6. CRUD Padrão

Criar
POST /people

Listar
GET /people

Detalhar
GET /people/:id

Atualizar
PATCH /people/:id

Soft Delete
DELETE /people/:id

	•	Não remove do banco
	•	Atualiza deleted_at


📊 7. Status Padrão

Financeiro:
	•	pending
	•	paid
	•	overdue

⸻

Pessoa:
	•	active
	•	inactive

⸻

📂 8. Upload de Arquivos

Endpoint:
POST /documents/upload

Response:
{
  "success": true,
  "data": {
    "url": "https://..."
  }
}


⚠️ 9. Códigos de Erro
	•	UNAUTHORIZED
	•	FORBIDDEN
	•	NOT_FOUND
	•	VALIDATION_ERROR
	•	INTERNAL_ERROR

⸻

🧠 10. Validação
	•	Todos endpoints devem usar DTO
	•	Retornar erro estruturado
	•	Nunca retornar erro genérico sem contexto

⸻

🔔 11. Auditoria
	•	Toda ação crítica deve gerar log
	•	Não retorna para frontend, mas é obrigatório no backend

⸻

🔒 12. Segurança
	•	Nunca expor:
	•	senha
	•	CPF completo
	•	dados sensíveis
	•	Sempre mascarar dados no retorno

⸻

🚀 13. Convenções
	•	endpoints em plural (/users, /people)
	•	usar kebab-case em rotas
	•	usar camelCase em JSON

⸻

💣 14. Proibições
	•	❌ Não retornar dados fora do padrão
	•	❌ Não aceitar tenant_id no body
	•	❌ Não usar delete físico

---

# 🧠 COMO USAR ISSO COM IA

Sempre referencie:

```plaintext
Use /docs/api-contract.md

Implemente endpoint de pessoas

💣 IMPACTO REAL DISSO

Com esse arquivo:

✅ Frontend e backend falam a mesma língua
✅ IA não inventa resposta
✅ Integração fica automática
✅ Bugs caem drasticamente



