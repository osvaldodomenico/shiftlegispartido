"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getElection, getCampaigns } from "@/services/electoral-api";
import type { Election, Campaign, CampaignStatus } from "@/types/electoral";
import { ArrowLeft, Eye, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "Planejamento",
  active: "Ativa",
  finished: "Encerrada",
};

const STATUS_COLORS: Record<CampaignStatus, string> = {
  planning: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  finished: "bg-gray-100 text-gray-600",
};

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [election, setElection] = useState<Election | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [electionData, allCampaigns] = await Promise.all([
          getElection(id),
          getCampaigns(),
        ]);
        setElection(electionData.data as Election);
        // Filtra campanhas da eleição
        const filtered = (allCampaigns.data as Campaign[]).filter(
          (c) => c.election.id === id
        );
        setCampaigns(filtered);
      } catch {
        toast.error("Erro ao carregar dados da eleição");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!election) {
    return (
      <div className="p-6 text-center text-muted-foreground">Eleição não encontrada</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/electoral/elections">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{election.name}</h1>
          <p className="text-muted-foreground text-sm">Detalhes da eleição</p>
        </div>
      </div>

      {/* Metadata card */}
      <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
        <h2 className="text-base font-semibold mb-4">Informações</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Data da Eleição</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(election.election_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">2º Turno</p>
            <p className="font-medium">
              {election.runoff_date
                ? new Date(election.runoff_date).toLocaleDateString("pt-BR")
                : "Não definido"}
            </p>
          </div>
        </div>
      </div>

      {/* Campaigns for this election */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Campanhas ({campaigns.length})</h2>
          <Button size="sm" asChild>
            <Link href="/electoral/campaigns">Ver todas</Link>
          </Button>
        </div>

        <div className="rounded-md border bg-white dark:bg-[#273142]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Candidato</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhuma campanha nesta eleição
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.candidate.name}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[c.status]}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/electoral/campaigns/${c.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
