import { Progress } from "@/components/ui/progress";

interface Props {
  spent: number;
  limit: number;
}

export function CampaignBudgetGauge({ spent, limit }: Props) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = pct >= 90;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>R$ {spent.toLocaleString("pt-BR")}</span>
        <span className="text-muted-foreground">R$ {limit.toLocaleString("pt-BR")}</span>
      </div>
      <Progress value={pct} className={over ? "[&>div]:bg-red-500" : ""} />
    </div>
  );
}
