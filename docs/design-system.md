# 🎨 Design System — Plataforma de Gestão do Diretório

---

## 1. 🎯 Conceito Visual

### Direção estética
- Institucional + moderno
- Confiável (segurança jurídica/financeira)
- Limpo e organizado
- Alta legibilidade

### Referências
- Stripe Dashboard
- Notion
- Linear
- Gov.br (influência institucional)

---

## 2. 🎨 Paleta de Cores

### 🔵 Cores Primárias
- Azul Principal: #1D4ED8
- Azul Hover: #1E40AF
- Azul Light: #DBEAFE

**Uso:**
- Botões primários
- Links
- Destaques
- Ações principais

---

### ⚪ Neutros
- Background: #F9FAFB
- Card: #FFFFFF
- Border: #E5E7EB
- Texto principal: #111827
- Texto secundário: #6B7280

---

### 🚦 Cores de Status
- Verde (sucesso): #16A34A
- Amarelo (alerta): #F59E0B
- Vermelho (erro): #DC2626
- Azul (info): #2563EB

---

### 🔒 Cores de Segurança (opcional)
- Roxo: #7C3AED
- Cinza escuro: #374151

---

## 3. 🔤 Tipografia

### Fonte
- Inter (recomendado)

---

### Escala Tipográfica

| Uso     | Tamanho | Peso |
|--------|--------|------|
| H1     | 32px   | 700  |
| H2     | 24px   | 600  |
| H3     | 20px   | 600  |
| H4     | 16px   | 600  |
| Texto  | 14px   | 400  |
| Pequeno| 12px   | 400  |

---

### Regras
- Mínimo: 12px
- Line-height: 1.5
- Evitar ALL CAPS (exceto labels)

---

## 4. 📏 Espaçamento (Grid System)

### Base: 8px

| Nome | Valor |
|------|------|
| XS   | 4px  |
| SM   | 8px  |
| MD   | 16px |
| LG   | 24px |
| XL   | 32px |
| XXL  | 48px |

---

### Regras
- Usar múltiplos de 8
- Padding padrão:
  - Cards: 16px ou 24px
  - Seções: 24px ou 32px

---

## 5. 🧱 Componentes

---

### 🔘 Botões

#### Tipos
- Primário → fundo azul, texto branco
- Secundário → fundo branco, borda cinza
- Ghost → sem fundo
- Perigo → vermelho

#### Estados
- Default
- Hover
- Active
- Disabled

---

### 🧾 Inputs

#### Tipos
- Texto
- Select
- Data
- Upload

#### Estados
- Normal
- Focus (borda azul)
- Erro (borda vermelha)
- Disabled

---

### 📊 Tabelas

#### Estrutura
- Header fixo
- Linhas com hover
- Paginação

#### Regras
- Ações sempre à direita
- Status com badge colorido

---

### 🏷️ Badges (Status)

- Verde → Pago / Ativo
- Amarelo → Pendente
- Vermelho → Atrasado
- Cinza → Inativo

---

### 🧱 Cards

#### Estrutura
- Título
- Conteúdo
- Ações (opcional)

#### Estilo
- Fundo branco
- Borda leve
- Sombra suave

---

## 6. 🧭 Navegação

---

### Sidebar
- Fundo branco
- Ícones + texto

#### Item ativo
- Fundo azul claro
- Texto azul

---

### Topbar
- Altura: 64px

#### Elementos
- Busca
- Notificações
- Perfil do usuário

---

## 7. 🧠 UX Padrões

---

### Feedback do usuário
- Loading → skeleton
- Sucesso → toast verde
- Erro → toast vermelho

---

### Confirmações obrigatórias
- Excluir
- Aprovar
- Fechar mês

---

### Mascaramento de dados

CPF: ***.999.***-**

---

## 8. 🔐 Segurança Visual

---

### Elementos
- Ícone de cadeado para dados sensíveis
- Logs visíveis
- Destaque em ações críticas

---

### Exemplos
- "Visualização restrita"
- "Ação registrada em auditoria"

---

## 9. 📱 Responsividade

---

### Breakpoints
- Mobile: < 768px
- Tablet: 768–1024px
- Desktop: 1024px+

---

### Regras
- Sidebar colapsa
- Tabelas viram cards
- Priorizar ações principais

---

## 10. 🎯 Padrão Final

---

### Sensação do sistema
- Segurança
- Controle
- Organização
- Transparência
- Profissionalismo

---

## 🚀 Próximos Passos

Você pode evoluir para:

### 🔥 Figma
- Componentes reais
- Protótipo navegável

### 🔥 Frontend
- React + Tailwind
- Componentização

---