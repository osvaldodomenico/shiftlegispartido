⚛️ FRONTEND BASE — REACT + TAILWIND
# ⚛️ Frontend — Plataforma do Diretório

---

## 📦 Stack

- React (Next.js recomendado)
- TailwindCSS
- Axios (API)
- Zustand (estado leve)
- React Hook Form

---

## 📁 Estrutura

src/
├── app/
├── components/
├── layouts/
├── modules/
├── services/
├── store/
├── hooks/
└── styles/

---

# 🎨 1. CONFIG TAILWIND

## tailwind.config.js

```js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#F59E0B",
        background: "#F9FAFB",
      },
    },
  },
};


🧱 2. LAYOUT BASE

layouts/DashboardLayout.tsx
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}


🧭 3. SIDEBAR
export default function Sidebar() {
  const menu = [
    "Dashboard",
    "Pessoas",
    "Financeiro",
    "Documentos",
    "Atas",
    "Campanha",
    "Administração",
  ];

  return (
    <aside className="w-60 bg-white border-r p-4">
      <h1 className="text-xl font-bold mb-6">Diretório</h1>
      <nav className="space-y-2">
        {menu.map((item) => (
          <div
            key={item}
            className="p-2 rounded hover:bg-gray-100 cursor-pointer"
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
}


🔝 4. TOPBAR
export default function Topbar() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <input
        className="border p-2 rounded w-1/3"
        placeholder="Buscar..."
      />

      <div className="flex items-center gap-4">
        <span>🔔</span>
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </header>
  );
}


🔘 5. BOTÃO PADRÃO
export default function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-primary text-white",
    secondary: "bg-white border",
    danger: "bg-danger text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}


📊 6. DASHBOARD
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card title="Saldo" value="R$ 10.000" />
        <Card title="Receitas" value="R$ 5.000" />
        <Card title="Despesas" value="R$ 3.000" />
        <Card title="Contribuições" value="R$ 2.000" />
      </div>

      <div className="bg-white p-4 rounded shadow">
        Gráfico (placeholder)
      </div>
    </DashboardLayout>
  );
}

components/Card.tsx
export function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}


👥 7. TELA DE PESSOAS
app/pessoas/page.tsx

import DashboardLayout from "@/layouts/DashboardLayout";

export default function Pessoas() {
  const pessoas = [
    { id: 1, nome: "João", tipo: "Filiado" },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-xl font-bold mb-4">Pessoas</h1>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Nome</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {pessoas.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-3">{p.nome}</td>
              <td>{p.tipo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardLayout>
  );
}

🔌 8. API SERVICE
services/api.ts


import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


🧠 9. AUTH STORE (ZUSTAND)
store/auth.ts
import { create } from "zustand";

export const useAuth = create((set) => ({
  user: null,
  token: null,

  login: (data) => set(data),
  logout: () => set({ user: null, token: null }),
}));



