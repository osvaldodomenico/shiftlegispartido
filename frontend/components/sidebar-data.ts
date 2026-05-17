import {
  Building2,
  CalendarDays,
  CreditCard,
  FilePlus2,
  FileText,
  HandCoins,
  House,
  Mail,
  UserRound,
  Users,
  KanbanSquare,
  CheckSquare,
  CalendarCheck,
  Upload,
  Settings2,
  Vote,
  Megaphone,
  Network,
  Landmark,
  ScrollText,
} from "lucide-react";

export const data = {
  navMain: [
    {
      label: "Principal",
    },
    {
      title: "Painel",
      url: "/dashboard",
      icon: House,
    },
    {
      title: "Financeiro",
      url: "#",
      icon: CreditCard,
      isActive: true,
      items: [
        {
          title: "Transações",
          url: "/finance/transactions",
          circleColor: "bg-blue-500",
        },
        {
          title: "Nova Transação",
          url: "/finance/transactions/new",
          circleColor: "bg-primary",
        },
        {
          title: "Aprovações",
          url: "/finance/approvals",
          circleColor: "bg-amber-500",
        },
        {
          title: "Conciliação Bancária",
          url: "/bank-reconciliation",
          circleColor: "bg-teal-500",
        },
      ],
    },
    {
      label: "Partidário",
    },
    {
      title: "Contribuições",
      url: "/contributions",
      icon: HandCoins,
    },
    {
      label: "CRM",
    },
    {
      title: "CRM",
      url: "#",
      icon: Users,
      permission: "crm.contacts.read",
      items: [
        {
          title: "Dashboard",
          url: "/crm",
          circleColor: "bg-primary",
        },
        {
          title: "Contatos",
          url: "/crm/contacts",
          circleColor: "bg-blue-500",
          permission: "crm.contacts.read",
        },
        {
          title: "Pipeline",
          url: "/crm/pipeline",
          circleColor: "bg-violet-500",
          permission: "crm.pipeline.manage",
        },
        {
          title: "Tarefas",
          url: "/crm/tasks",
          circleColor: "bg-amber-500",
          permission: "crm.tasks.manage",
        },
        {
          title: "Eventos",
          url: "/crm/events",
          circleColor: "bg-green-500",
        },
        {
          title: "Importar",
          url: "/crm/import",
          circleColor: "bg-orange-500",
          permission: "crm.import.execute",
        },
        {
          title: "Configurações",
          url: "/crm/settings/pipeline",
          circleColor: "bg-slate-400",
        },
      ],
    },
    {
      label: "Electoral",
    },
    {
      title: "Electoral",
      url: "#",
      icon: Vote,
      items: [
        {
          title: "Eleições",
          url: "/electoral/elections",
          circleColor: "bg-primary",
        },
        {
          title: "Campanhas",
          url: "/electoral/campaigns",
          circleColor: "bg-blue-500",
        },
      ],
    },
    {
      label: "Partido",
    },
    {
      title: "Partido",
      url: "#",
      icon: Landmark,
      items: [
        {
          title: "Diretórios",
          url: "/party/chapters",
          circleColor: "bg-primary",
        },
        {
          title: "Órgãos",
          url: "/party/organs",
          circleColor: "bg-blue-500",
        },
      ],
    },
    {
      title: "Mandatos",
      url: "/mandates",
      icon: ScrollText,
    },
    {
      label: "Gestão",
    },
    {
      title: "Empresa",
      url: "/company",
      icon: Building2,
    },
    {
      title: "Documentos (GED)",
      url: "/documents",
      icon: FileText,
    },
    {
      title: "Perfil",
      url: "/view-profile",
      icon: UserRound,
    },
    {
      title: "Calendário",
      url: "/calendar",
      icon: CalendarDays,
    },
    {
      title: "Comunicação",
      url: "/email",
      icon: Mail,
    },
    {
      label: "Sistema",
    },
    {
      title: "Acesso",
      url: "/auth/login",
      icon: FilePlus2,
    },
  ],
};
