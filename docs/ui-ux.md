# 🎨 UI/UX — Plataforma de Gestão do Diretório

---

## 🧱 1. Estrutura Global

### Layout base

┌───────────────────────────────┐  
│ Topbar                        │  
│ Logo | Busca | Notificações   │  
├───────────────┬───────────────┤  
│ Sidebar       │ Conteúdo      │  
│               │               │  
│ Menu          │ Tela ativa    │  
│               │               │  
└───────────────┴───────────────┘  

---

## 🧭 2. Sidebar (Menu lateral)

Itens:

- Dashboard
- Pessoas
- Financeiro
- Doações
- Contribuições
- Documentos
- Atas
- Campanha
- Relatórios
- Administração

---

## 🔝 3. Topbar

Elementos:

- Campo de busca global
- Ícone de notificações
- Avatar do usuário
- Menu dropdown (perfil / logout)

---

## 📊 4. Dashboard

### Componentes:

- Cards:
  - Saldo atual
  - Receitas
  - Despesas
  - Contribuições

- Gráfico:
  - Fluxo de caixa

- Lista:
  - Últimas movimentações

---

## 👥 5. Tela Pessoas

### Lista:

Tabela com:

- Nome
- Tipo (Filiado / Funcionário / Fornecedor)
- Status
- Ações (editar / visualizar)

### Ações:

- Botão "Nova Pessoa"
- Clique abre modal ou página

---

## 💰 6. Tela Financeiro

### Tabs:

- Contas a pagar
- Contas a receber
- Fluxo de caixa

### Tabela:

- Data
- Pessoa
- Valor
- Status
- Ações

### Ações:

- Criar lançamento
- Editar
- Marcar como pago

---

## 📂 7. Documentos

### Layout:

- Sidebar de pastas
- Lista ou grid de arquivos

### Ações:

- Upload
- Nova pasta
- Versionar documento

---

## 📝 8. Atas

### Lista:

- Título
- Data
- Status (rascunho / aprovado / assinado)

### Fluxo:

- Criar ata
- Revisar
- Aprovar
- Assinar

---

## 🗳️ 9. Campanha

### Dashboard:

- Total arrecadado
- Total gasto
- Pendências

### Submenus:

- Financeiro
- Jurídico
- Equipe

---

## ⚙️ 10. Administração

### Seções:

- Usuários
- Perfis (RBAC)
- Auditoria

---

## ⚠️ 11. Estados de Interface (OBRIGATÓRIO)

Toda tela deve ter:

### Loading
- Skeleton ou spinner

### Empty
- Mensagem "Nenhum dado encontrado"

### Error
- Mensagem clara + botão tentar novamente

---

## 🎯 12. Regras de UX

- Sempre mostrar feedback (toast)
- Confirmar ações críticas
- Mascarar CPF
- Evitar múltiplos cliques
- Paginação em tabelas grandes

---

## 🧩 13. Componentes Obrigatórios

- Button
- Input
- Table
- Modal
- Card
- Badge
- Toast

---

## 🚀 14. Padrão de Navegação

- Sidebar fixa
- Conteúdo dinâmico
- Breadcrumb opcional