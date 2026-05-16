"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCampaign,
  getCampaignTeam,
  getContracts,
  getTseReports,
} from "@/services/electoral-api";
import type {
  Campaign,
  TeamMember,
  CampaignContract,
  TseReport,
  CampaignStatus,
  TseReportType,
  TseReportStatus,
} from "@/types/electoral";
import { CampaignBudgetGauge } from "@/components/electoral/CampaignBudgetGauge";
import { TeamMemberList } from "@/components/electoral/TeamMemberList";
import { ContractList } from "@/components/electoral/ContractList";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

/* ---- Labels ---- */
const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "Planejamento",
  active: "Ativa",
  finished: "Encerrada",
};
const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  planning: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  finished: "bg-gray-100 text-gray-600",
};
const TSE_TYPE_LABELS: Record<TseReportType, string> = { receita: "Receita", despesa: "Despesa" };
const TSE_STATUS_LABELS: Record<TseReportStatus, string> = {
  draft: "Rascunho",
  submitted: "Enviado",
  accepted: "Aceito",
  rejected: "Rejeitado",
};
const TSE_STATUS_COLORS: Record<TseReportStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

type TabId = "overview" | "team" | "schedule" | "finance" | "tse";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Visão Geral" },
  { id: "team", label: "Equipe" },
  { id: "schedule", label: "Agenda" },
  { id: "finance", label: "Financeiro" },
  { id: "tse", label: "Relatórios TSE" },
];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>("overview");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contracts, setContracts] = useState<CampaignContract[]>([]);
  const [tseReports, setTseReports] = useState<TseReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaign = useCallback(async () => {
    try {
      const data = await getCampaign(id);
      setCampaign(data as Campaign);
    } catch {
      toast.error("Erro ao carregar campanha");
    }
  }, [id]);

  const loadTeam = useCallback(async () => {
    try {
      const data = await getCampaignTeam(id);
      setTeam(data as TeamMember[]);
    } catch {
      toast.error("Erro ao carregar equipe");
    }
  }, [id]);

  const loadContracts = useCallback(async () => {
    try {
      const data = await getContracts(id);
      setContracts(data as CampaignContract[]);
    } catch {
      toast.error("Erro ao carregar contratos");
    }
  }, [id]);

  const loadTseReports = useCallback(async () => {
    try {
      const data = await getTseReports(id);
      setTseReports(data as TseReport[]);
    } catch {
      toast.error("Erro ao carregar relatórios TSE");
    }
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadCampaign(), loadTeam(), loadContracts(), loadTseReports()]);
      setLoading(false);
    }
    init();
  }, [loadCampaign, loadTeam, loadContracts, loadTseReports]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Carregando...</div>;
  }

  if (!campaign) {
    return <div className="p-6 text-center text-muted-foreground">Campanha não encontrada</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/electoral/campaigns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {campaign.election.name} · {campaign.candidate.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
            <h2 className="text-base font-semibold mb-4">Detalhes da Campanha</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Eleição</p>
                <p className="font-medium">{campaign.election.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Candidato</p>
                <p className="font-medium">{campaign.candidate.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Criada em</p>
                <p className="font-medium">
                  {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>

          {campaign.budget_limit && (
            <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
              <h2 className="text-base font-semibold mb-4">Orçamento</h2>
              <CampaignBudgetGauge
                spent={campaign.total_spent ?? 0}
                limit={campaign.budget_limit}
              />
            </div>
          )}
        </div>
      )}

      {tab === "team" && (
        <TeamMemberList
          campaignId={id}
          members={team}
          onRefresh={loadTeam}
        />
      )}

      {tab === "schedule" && (
        <div className="rounded-lg border bg-white dark:bg-[#273142] p-6 text-center space-y-4">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Visualizar e gerenciar a agenda desta campanha</p>
          <Button asChild>
            <Link href={`/electoral/campaigns/${id}/schedule`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Agenda Completa
            </Link>
          </Button>
        </div>
      )}

      {tab === "finance" && (
        <div className="space-y-6">
          {campaign.budget_limit && (
            <div className="rounded-lg border bg-white dark:bg-[#273142] p-6">
              <h2 className="text-base font-semibold mb-4">Orçamento</h2>
              <div className="flex justify-between text-sm mb-2">
                <span>Total gasto</span>
                <span className="font-semibold">
                  R$ {(campaign.total_spent ?? 0).toLocaleString("pt-BR")}
                </span>
              </div>
              <CampaignBudgetGauge
                spent={campaign.total_spent ?? 0}
                limit={campaign.budget_limit}
              />
            </div>
          )}
          <ContractList
            campaignId={id}
            contracts={contracts}
            onRefresh={loadContracts}
          />
        </div>
      )}

      {tab === "tse" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold">Relatórios TSE ({tseReports.length})</h2>
            <Button size="sm" asChild>
              <Link href={`/electoral/campaigns/${id}/tse`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Gerenciar Relatórios
              </Link>
            </Button>
          </div>
          <div className="rounded-md border bg-white dark:bg-[#273142]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Final</th>
                </tr>
              </thead>
              <tbody>
                {tseReports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Nenhum relatório TSE
                    </td>
                  </tr>
                )}
                {tseReports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {new Date(r.period_start).toLocaleDateString("pt-BR")} —{" "}
                      {new Date(r.period_end).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-indigo-100 text-indigo-700">
                        {TSE_TYPE_LABELS[r.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={TSE_STATUS_COLORS[r.status]}>
                        {TSE_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_final ? (
                        <Badge className="bg-purple-100 text-purple-700">Final</Badge>
                      ) : (
                        <span className="text-muted-foreground">Parcial</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
