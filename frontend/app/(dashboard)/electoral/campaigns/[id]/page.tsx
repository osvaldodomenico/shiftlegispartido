"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCampaign,
  getCampaignTeam,
  getCampaignContracts,
  getCampaignSchedule,
  getTseReports,
  createTseReport,
} from "@/services/electoral-api";
import type {
  Campaign,
  TeamMember,
  CampaignContract,
  ScheduleEvent,
  TseReport,
  CampaignStatus,
  TseReportStatus,
  ContractStatus,
  ScheduleEventType,
  ScheduleEventStatus,
} from "@/types/electoral";
import { CampaignBudgetGauge } from "@/components/electoral/CampaignBudgetGauge";
import { TeamMemberList } from "@/components/electoral/TeamMemberList";
import { ContractList } from "@/components/electoral/ContractList";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Plus,
  FileText,
  Users,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value?: number) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("pt-BR");
}
function formatDateTime(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleString("pt-BR");
}

// ─── Labels ───────────────────────────────────────────────────────────────────

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
const EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  corpo_a_corpo: "Corpo a Corpo",
  comicio: "Comício",
  debate: "Debate",
  reuniao: "Reunião",
  outro: "Outro",
};
const EVENT_STATUS_LABELS: Record<ScheduleEventStatus, string> = {
  scheduled: "Agendado",
  done: "Realizado",
  cancelled: "Cancelado",
};
const EVENT_STATUS_COLORS: Record<ScheduleEventStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = "resumo" | "equipe" | "contratos" | "cronograma" | "tse";

const TABS: { id: TabId; label: string }[] = [
  { id: "resumo", label: "Resumo" },
  { id: "equipe", label: "Equipe" },
  { id: "contratos", label: "Contratos" },
  { id: "cronograma", label: "Cronograma" },
  { id: "tse", label: "TSE — Prestação de Contas" },
];

// ─── TSE Create Form ──────────────────────────────────────────────────────────

interface TseForm {
  period_start: string;
  period_end: string;
  is_final: boolean;
}
const emptyTseForm: TseForm = { period_start: "", period_end: "", is_final: false };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>("resumo");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [contracts, setContracts] = useState<CampaignContract[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [tseReports, setTseReports] = useState<TseReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [tseOpen, setTseOpen] = useState(false);
  const [tseForm, setTseForm] = useState<TseForm>(emptyTseForm);
  const [tseSaving, setTseSaving] = useState(false);

  const loadCampaign = useCallback(async () => {
    const data = await getCampaign(id);
    setCampaign(data);
  }, [id]);

  const loadTeam = useCallback(async () => {
    try {
      setTeam(await getCampaignTeam(id));
    } catch {
      toast.error("Erro ao carregar equipe");
    }
  }, [id]);

  const loadContracts = useCallback(async () => {
    try {
      setContracts(await getCampaignContracts(id));
    } catch {
      toast.error("Erro ao carregar contratos");
    }
  }, [id]);

  const loadSchedule = useCallback(async () => {
    try {
      setSchedule(await getCampaignSchedule(id));
    } catch {
      toast.error("Erro ao carregar cronograma");
    }
  }, [id]);

  const loadTseReports = useCallback(async () => {
    try {
      setTseReports(await getTseReports(id));
    } catch {
      toast.error("Erro ao carregar relatórios TSE");
    }
  }, [id]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        await loadCampaign();
        await Promise.all([loadTeam(), loadContracts(), loadSchedule(), loadTseReports()]);
      } catch {
        toast.error("Erro ao carregar campanha");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [loadCampaign, loadTeam, loadContracts, loadSchedule, loadTseReports]);

  async function handleCreateTseReport() {
    if (!tseForm.period_start || !tseForm.period_end) {
      toast.error("Período é obrigatório");
      return;
    }
    setTseSaving(true);
    try {
      await createTseReport(id, {
        period_start: tseForm.period_start,
        period_end: tseForm.period_end,
        is_final: tseForm.is_final,
      });
      toast.success("Prestação de contas criada");
      setTseOpen(false);
      setTseForm(emptyTseForm);
      loadTseReports();
    } catch {
      toast.error("Erro ao criar prestação de contas");
    } finally {
      setTseSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">Carregando campanha...</div>
    );
  }
  if (!campaign) {
    return (
      <div className="p-6 text-center text-muted-foreground">Campanha não encontrada</div>
    );
  }

  const totalContratos = contracts.reduce((s, c) => s + (c.value ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/electoral/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {campaign.election?.name} · Candidato: {campaign.candidate?.name}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/electoral/campaigns/${id}/expenses`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Resumo de Despesas
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Resumo ── */}
      {tab === "resumo" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eleição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{campaign.election?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(campaign.election?.election_date)}
                </p>
              </CardContent>
            </Card>
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Candidato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{campaign.candidate?.name ?? "—"}</p>
              </CardContent>
            </Card>
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </Badge>
              </CardContent>
            </Card>
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orçamento Limite</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-lg">{formatBRL(campaign.budget_limit)}</p>
                <p className="text-sm text-muted-foreground">
                  Gasto: {formatBRL(campaign.total_spent ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{contracts.length} contrato(s)</p>
                <p className="text-sm text-muted-foreground">Total: {formatBRL(totalContratos)}</p>
              </CardContent>
            </Card>
            <Card className="card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Equipe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{team.length} membro(s)</p>
              </CardContent>
            </Card>
          </div>

          {campaign.budget_limit && (
            <Card className="card">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Execução do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <CampaignBudgetGauge
                  spent={campaign.total_spent ?? 0}
                  limit={campaign.budget_limit}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Equipe ── */}
      {tab === "equipe" && (
        <TeamMemberList campaignId={id} members={team} onRefresh={loadTeam} />
      )}

      {/* ── Contratos ── */}
      {tab === "contratos" && (
        <Card className="card !p-0 !block border-0 overflow-hidden">
          <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold">
                Contratos com Fornecedores ({contracts.length})
              </CardTitle>
              <Badge variant="outline">{formatBRL(totalContratos)} total contratado</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ContractList campaignId={id} contracts={contracts} onRefresh={loadContracts} />
          </CardContent>
        </Card>
      )}

      {/* ── Cronograma ── */}
      {tab === "cronograma" && (
        <Card className="card !p-0 !block border-0 overflow-hidden">
          <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                Cronograma de Atividades ({schedule.length})
              </CardTitle>
              <Button size="sm" asChild>
                <Link href={`/electoral/campaigns/${id}/schedule`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Abrir Agenda Completa
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {schedule.length === 0 && (
                <p className="px-6 py-8 text-center text-muted-foreground text-sm">
                  Nenhum evento agendado
                </p>
              )}
              {schedule.slice(0, 15).map((ev) => (
                <div key={ev.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_TYPE_LABELS[ev.type]} · {formatDateTime(ev.starts_at)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                  </div>
                  <Badge className={EVENT_STATUS_COLORS[ev.status]}>
                    {EVENT_STATUS_LABELS[ev.status]}
                  </Badge>
                </div>
              ))}
              {schedule.length > 15 && (
                <p className="px-6 py-3 text-center text-sm text-muted-foreground">
                  + {schedule.length - 15} evento(s). Abra a agenda completa para ver todos.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TSE ── */}
      {tab === "tse" && (
        <Card className="card !p-0 !block border-0 overflow-hidden">
          <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold">
                Prestações de Contas TSE ({tseReports.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/electoral/campaigns/${id}/tse`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setTseForm(emptyTseForm);
                    setTseOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Prestação
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Receitas</th>
                  <th className="px-4 py-3 text-left font-medium">Despesas</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tseReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma prestação de contas cadastrada
                    </td>
                  </tr>
                )}
                {tseReports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(r.period_start)} — {formatDate(r.period_end)}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_final ? (
                        <Badge className="bg-purple-100 text-purple-700">Final</Badge>
                      ) : (
                        <Badge className="bg-indigo-100 text-indigo-700">Parcial</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={TSE_STATUS_COLORS[r.status]}>
                        {TSE_STATUS_LABELS[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-green-700 font-medium">
                      {formatBRL(r.total_receitas)}
                    </td>
                    <td className="px-4 py-3 text-red-700 font-medium">
                      {formatBRL(r.total_despesas)}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/electoral/campaigns/${id}/tse/${r.id}`}>
                          Detalhes
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TSE Create Dialog */}
      <Dialog open={tseOpen} onOpenChange={setTseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Prestação de Contas TSE</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início do Período</Label>
                <Input
                  type="date"
                  value={tseForm.period_start}
                  onChange={(e) => setTseForm({ ...tseForm, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim do Período</Label>
                <Input
                  type="date"
                  value={tseForm.period_end}
                  onChange={(e) => setTseForm({ ...tseForm, period_end: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Tipo de Prestação</Label>
              <Select
                value={tseForm.is_final ? "final" : "parcial"}
                onValueChange={(v) => setTseForm({ ...tseForm, is_final: v === "final" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTseOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTseReport} disabled={tseSaving}>
                {tseSaving ? "Criando..." : "Criar Prestação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
