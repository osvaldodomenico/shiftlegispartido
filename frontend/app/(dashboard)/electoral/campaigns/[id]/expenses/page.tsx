"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCampaign, getCampaignContracts, getTseReports, getTseReportItems } from "@/services/electoral-api";
import type { Campaign, CampaignContract, TseReportItem, ContractStatus } from "@/types/electoral";
import { ArrowLeft, Download } from "lucide-react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function formatDate(str?: string) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("pt-BR");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory = "todos" | "contratos" | "pessoal" | "publicidade" | "material" | "outros";

interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  category: Exclude<ExpenseCategory, "todos">;
  amount: number;
  source: "contrato" | "tse";
  reference?: string;
  document?: string;
  tseCode?: string;
}

const CATEGORY_LABELS: Record<Exclude<ExpenseCategory, "todos">, string> = {
  contratos: "Contratos",
  pessoal: "Pessoal",
  publicidade: "Publicidade",
  material: "Material",
  outros: "Outros",
};

const CATEGORY_COLORS: Record<Exclude<ExpenseCategory, "todos">, string> = {
  contratos: "bg-blue-100 text-blue-700",
  pessoal: "bg-purple-100 text-purple-700",
  publicidade: "bg-orange-100 text-orange-700",
  material: "bg-yellow-100 text-yellow-700",
  outros: "bg-gray-100 text-gray-600",
};

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  finished: "Encerrado",
  cancelled: "Cancelado",
};

// Classify TSE code into expense category
function classifyTseCode(code?: string): Exclude<ExpenseCategory, "todos"> {
  if (!code) return "outros";
  const c = code.toLowerCase();
  if (c.includes("pessoal") || c.startsWith("2.")) return "pessoal";
  if (c.includes("publicidade") || c.includes("propaganda") || c.startsWith("3.")) return "publicidade";
  if (c.includes("material") || c.startsWith("4.")) return "material";
  return "outros";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignExpensesPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contracts, setContracts] = useState<CampaignContract[]>([]);
  const [tseItems, setTseItems] = useState<TseReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ExpenseCategory>("todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [camp, conts, reports] = await Promise.all([
        getCampaign(id),
        getCampaignContracts(id),
        getTseReports(id),
      ]);
      setCampaign(camp);
      setContracts(conts);

      // Load TSE despesa items from all reports
      const allItems: TseReportItem[] = [];
      await Promise.all(
        reports.map(async (r) => {
          try {
            const items = await getTseReportItems(id, r.id);
            allItems.push(...items.filter((i) => i.type === "despesa"));
          } catch {
            // Ignore individual report fetch errors
          }
        })
      );
      setTseItems(allItems);
    } catch {
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Build unified expense rows
  const rows: ExpenseRow[] = useMemo(() => {
    const contractRows: ExpenseRow[] = contracts
      .filter((c) => c.status !== "cancelled")
      .map((c) => ({
        id: `contract-${c.id}`,
        date: c.signed_at ?? "",
        description: c.description || `Contrato — ${c.supplier?.name}`,
        category: "contratos",
        amount: c.value,
        source: "contrato",
        reference: c.supplier?.name,
        document: c.supplier_document,
      }));

    const tseRows: ExpenseRow[] = tseItems.map((i) => ({
      id: `tse-${i.id}`,
      date: i.date,
      description: i.description || i.tse_code?.description || "—",
      category: classifyTseCode(i.tse_code?.code),
      amount: i.amount,
      source: "tse",
      reference: i.invoice_ref,
      document: i.document,
      tseCode: i.tse_code?.code,
    }));

    return [...contractRows, ...tseRows].sort((a, b) =>
      (b.date || "").localeCompare(a.date || "")
    );
  }, [contracts, tseItems]);

  const filtered = useMemo(
    () => (category === "todos" ? rows : rows.filter((r) => r.category === category)),
    [rows, category]
  );

  const totalFiltered = filtered.reduce((s, r) => s + r.amount, 0);
  const totalAll = rows.reduce((s, r) => s + r.amount, 0);

  // Category totals
  const categoryTotals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) {
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
    }
    return acc;
  }, [rows]);

  function handleExport() {
    const header = "Data,Descrição,Categoria,Valor,Fonte,Documento,Referência";
    const csvRows = filtered.map((r) =>
      [
        formatDate(r.date),
        `"${r.description.replace(/"/g, '""')}"`,
        CATEGORY_LABELS[r.category],
        r.amount.toFixed(2).replace(".", ","),
        r.source === "contrato" ? "Contrato" : "TSE",
        r.document ?? "",
        r.reference ?? "",
      ].join(",")
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `despesas-campanha-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/electoral/campaigns/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Resumo de Despesas</h1>
            <p className="text-muted-foreground text-sm">
              {campaign?.name ?? "Carregando..."} · Visão consolidada de despesas eleitorais
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || rows.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Budget gauge */}
      {campaign?.budget_limit && (
        <Card className="card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orçamento da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-medium">{formatBRL(totalAll)} gastos</span>
              <span className="text-muted-foreground">
                Limite: {formatBRL(campaign.budget_limit)}
              </span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalAll / campaign.budget_limit > 0.9 ? "bg-red-500" : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(100, (totalAll / campaign.budget_limit) * 100).toFixed(1)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalAll / campaign.budget_limit) * 100).toFixed(1)}% do orçamento utilizado
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(CATEGORY_LABELS) as Exclude<ExpenseCategory, "todos">[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat === category ? "todos" : cat)}
            className={`text-left p-3 rounded-lg border transition-colors ${
              category === cat ? "border-primary bg-primary/5" : "border-neutral-200 dark:border-slate-700 hover:border-primary/50"
            }`}
          >
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
            <p className="font-semibold mt-1">{formatBRL(categoryTotals[cat] ?? 0)}</p>
            <Badge className={`${CATEGORY_COLORS[cat]} mt-1 text-xs`}>
              {rows.filter((r) => r.category === cat).length} item(s)
            </Badge>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="card !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold">
              {category === "todos" ? "Todas as Despesas" : CATEGORY_LABELS[category]}
              {" "}({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{formatBRL(totalFiltered)}</span>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {(Object.entries(CATEGORY_LABELS) as [Exclude<ExpenseCategory, "todos">, string][]).map(
                    ([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="px-6 py-8 text-center text-muted-foreground">Carregando...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <p className="font-medium">Nenhuma despesa encontrada</p>
              <p className="text-sm mt-1">Nenhum contrato ou lançamento TSE de despesa cadastrado</p>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <Table className="table-auto border-spacing-0 border-separate">
              <TableHeader>
                <TableRow className="border-0">
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 first:border-l last:border-r border-b-0 py-3">
                    Data
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 py-3">
                    Descrição
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 py-3">
                    Categoria
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 py-3">
                    Fonte
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 py-3">
                    Cód. TSE
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 py-3">
                    Documento
                  </TableHead>
                  <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 last:border-r border-b-0 py-3 text-right">
                    Valor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <TableCell className="py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="py-3 font-medium max-w-xs truncate">
                      {row.description}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={CATEGORY_COLORS[row.category]}>
                        {CATEGORY_LABELS[row.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {row.source === "contrato" ? "Contrato" : "Lançamento TSE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      {row.tseCode ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {row.document ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-right font-semibold">
                      {formatBRL(row.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold border-t-2">
                  <TableCell colSpan={6} className="py-3 text-right">Total</TableCell>
                  <TableCell className="py-3 text-right">{formatBRL(totalFiltered)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
