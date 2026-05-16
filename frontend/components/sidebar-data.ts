import {
  Building2,
  CalendarDays,
  CreditCard,
  FilePlus2,
  House,
  Mail,
  UserRound,
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
          title: "Nova Transação",
          url: "/finance/transactions/new",
          circleColor: "bg-primary",
        },
        {
          title: "Aprovações",
          url: "/finance/approvals",
          circleColor: "bg-amber-500",
        },
      ],
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
