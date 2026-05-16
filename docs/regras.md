# 📏 Regras do Sistema

---

## 🧠 1. Regras de Negócio

- Separação entre diretório e campanha
- Fechamento mensal obrigatório (bloqueia edição)
- Exclusão lógica (nunca deletar dados)
- Versionamento obrigatório de documentos
- Workflow de aprovação (operacional → financeiro → admin)

---

## 🔐 2. Regras de Sistema

- Toda entidade deve possuir tenant_id
- Toda query deve filtrar por tenant_id
- Auditoria obrigatória em:
  - login
  - criação
  - edição
  - exclusão
- CPF e dados sensíveis devem ser criptografados
- Controle de acesso baseado em RBAC

---

## 🧱 3. Regras de Código

- Controllers não possuem lógica de negócio
- Services contêm regras de negócio
- DTO obrigatório em todas as rotas
- Validação com class-validator
- Resposta padrão da API:

{
  "success": true,
  "data": {},
  "message": ""
}

---

## ❌ Proibições

- Não usar delete físico
- Não criar query sem tenant_id
- Não expor dados sensíveis
- Não quebrar padrão de resposta