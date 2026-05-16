import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, CheckSquare, AlertCircle, MessageSquare, Calendar } from "lucide-react";
import type { CrmKpis } from "@/types/crm";

interface Props {
  kpis: CrmKpis;
}

const items = [
  { key: "total_contacts", label: "Total de Contatos", icon: Users, color: "text-blue-500" },
  { key: "new_contacts_this_month", label: "Novos este Mês", icon: UserPlus, color: "text-green-500" },
  { key: "open_tasks", label: "Tarefas Abertas", icon: CheckSquare, color: "text-yellow-500" },
  { key: "overdue_tasks", label: "Tarefas Atrasadas", icon: AlertCircle, color: "text-red-500" },
  { key: "interactions_this_week", label: "Interações esta Semana", icon: MessageSquare, color: "text-purple-500" },
  { key: "upcoming_events", label: "Próximos Eventos", icon: Calendar, color: "text-indigo-500" },
] as const;

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardContent className="p-6 flex items-center gap-4">
            <Icon className={`h-10 w-10 ${color}`} />
            <div>
              <p className="text-3xl font-bold">{kpis[key] ?? 0}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
