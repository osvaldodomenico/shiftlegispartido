🚀 🧱 ESTRUTURA COMPLETA PERFEITA (SaaS)
root/
├── backend/
├── frontend/
├── docs/
├── ai/
├── infra/
└── README.md


🧠 📚 /docs → CÉREBRO DO SISTEMA
/docs
├── prd.md
├── arquitetura.md
├── database.md
├── design-system.md
├── ui-ux.md
├── regras.md
└── api-contract.md


🤖 ⚙️ /ai → MOTOR DE EXECUÇÃO
/ai
├── ai-playbook.md
├── ai-prompts.md
├── ai-rules.md
├── task-flow.md
└── super-prompts/
    ├── backend.md
    ├── frontend.md
    ├── debug.md
    ├── refactor.md
    ├── security.md
    └── performance.md


⚙️ 🧠 BACKEND (NestJS)
/backend
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── people/
│   │   ├── finance/
│   │   ├── documents/
│   │   └── audit/
│   │
│   ├── common/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── utils/
│   │
│   ├── config/
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── env.ts
│   │
│   ├── database/
│   │   ├── prisma/
│   │   └── migrations/
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env
└── package.json


🔥 PADRÃO INTERNO DE MÓDULO (OBRIGATÓRIO)
Exemplo: /modules/people

/people
├── people.controller.ts
├── people.service.ts
├── people.module.ts
├── dto/
│   ├── create-people.dto.ts
│   └── update-people.dto.ts
├── entities/
│   └── people.entity.ts
└── repository/
    └── people.repository.ts


⚛️ 🎨 FRONTEND (Next.js)
/frontend
├── src/
│   ├── app/                 # rotas
│   │   ├── dashboard/
│   │   ├── pessoas/
│   │   ├── financeiro/
│   │   ├── documentos/
│   │   └── login/
│   │
│   ├── modules/             # domínio
│   │   ├── auth/
│   │   ├── people/
│   │   ├── finance/
│   │   └── documents/
│   │
│   ├── components/          # UI genérica
│   │   ├── ui/
│   │   ├── table/
│   │   ├── form/
│   │   └── layout/
│   │
│   ├── layouts/
│   │   ├── dashboard.layout.tsx
│   │   └── auth.layout.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   └── endpoints/
│   │
│   ├── store/
│   │   ├── auth.ts
│   │   └── global.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useFetch.ts
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   └── format.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── .env
└── package.json


🐳 ☁️ INFRA (DEPLOY)
/infra
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
│
├── nginx/
│   └── nginx.conf
│
└── ci-cd/
    └── pipeline.yml


🧠 PADRÕES GLOBAIS (ESSENCIAL PRA IA)

🔐 Backend
	•	sempre usar tenant_id
	•	sempre DTO
	•	sempre audit
	•	nunca delete físico

⸻

⚛️ Frontend
	•	sempre usar services
	•	nunca chamar API direto no componente
	•	sempre usar store para auth

