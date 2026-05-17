"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Contribution,
    CreateContributionDto,
    createContribution,
    getContributions,
} from "@/services/contributions.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "danger";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
    active: "success",
    inactive: "secondary",
    overdue: "danger",
};

const STATUS_LABEL: Record<string, string> = {
    active: "Ativo",
    inactive: "Inativo",
    overdue: "Inadimplente",
};

const TYPE_LABEL: Record<string, string> = {
    filiacao: "Filiação",
    mensalidade: "Mensalidade",
    doacao: "Doação",
    outro: "Outro",
};

const FREQUENCY_LABEL: Record<string, string> = {
    monthly: "Mensal",
    quarterly: "Trimestral",
    annual: "Anual",
    once: "Único",
};

function formatBRL(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function formatDate(value: string | null): string {
    if (!value) return "—";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="flex flex-col gap-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
        </div>
    );
}

// ─── linha da tabela ──────────────────────────────────────────────────────────

function ContributionRow({ c, isLast }: { c: Contribution; isLast: boolean }) {
    const cellClass = `py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${
        isLast ? "first:rounded-bl-lg last:rounded-br-lg" : ""
    }`;
    const statusVariant = STATUS_VARIANT[c.status] ?? "default";
    const statusLabel = STATUS_LABEL[c.status] ?? c.status;

    return (
        <TableRow>
            <TableCell className={cellClass}>
                {c.person ? c.person.name : "—"}
            </TableCell>
            <TableCell className={cellClass}>
                {TYPE_LABEL[c.type] ?? c.type}
            </TableCell>
            <TableCell className={cellClass}>
                <span className="font-semibold">{formatBRL(c.amount)}</span>
            </TableCell>
            <TableCell className={cellClass}>
                {FREQUENCY_LABEL[c.frequency] ?? c.frequency}
            </TableCell>
            <TableCell className={cellClass}>
                <Badge variant={statusVariant} className="rounded-[50rem]">
                    {statusLabel}
                </Badge>
            </TableCell>
            <TableCell className={cellClass}>{formatDate(c.start_date)}</TableCell>
        </TableRow>
    );
}

// ─── modal criar contribuição ─────────────────────────────────────────────────

function CreateModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateContributionDto>({
        type: "mensalidade",
        amount: 0,
        frequency: "monthly",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        person_id: null,
    });

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "amount" || name === "person_id" ? Number(value) || null : value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await createContribution(form);
            toast.success("Contribuição criada com sucesso");
            onCreated();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Erro ao criar contribuição"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Contribuição</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="c-type" className="text-[#4b5563] dark:text-white mb-2">
                            Tipo *
                        </Label>
                        <select
                            id="c-type"
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            required
                            className="w-full border border-neutral-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800"
                        >
                            <option value="filiacao">Filiação</option>
                            <option value="mensalidade">Mensalidade</option>
                            <option value="doacao">Doação</option>
                            <option value="outro">Outro</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="c-amount" className="text-[#4b5563] dark:text-white mb-2">
                            Valor (R$) *
                        </Label>
                        <Input
                            id="c-amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.amount || ""}
                            onChange={handleChange}
                            required
                            className="border-neutral-300 dark:border-slate-500"
                        />
                    </div>

                    <div>
                        <Label htmlFor="c-frequency" className="text-[#4b5563] dark:text-white mb-2">
                            Frequência *
                        </Label>
                        <select
                            id="c-frequency"
                            name="frequency"
                            value={form.frequency}
                            onChange={handleChange}
                            required
                            className="w-full border border-neutral-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800"
                        >
                            <option value="monthly">Mensal</option>
                            <option value="quarterly">Trimestral</option>
                            <option value="annual">Anual</option>
                            <option value="once">Único</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="c-start" className="text-[#4b5563] dark:text-white mb-2">
                            Data de início *
                        </Label>
                        <Input
                            id="c-start"
                            name="start_date"
                            type="date"
                            value={form.start_date}
                            onChange={handleChange}
                            required
                            className="border-neutral-300 dark:border-slate-500"
                        />
                    </div>

                    <div>
                        <Label htmlFor="c-end" className="text-[#4b5563] dark:text-white mb-2">
                            Data de término
                        </Label>
                        <Input
                            id="c-end"
                            name="end_date"
                            type="date"
                            value={form.end_date ?? ""}
                            onChange={handleChange}
                            className="border-neutral-300 dark:border-slate-500"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Criando..." : "Criar contribuição"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── filtros de tipo ──────────────────────────────────────────────────────────

type FilterType = "all" | "filiacao" | "mensalidade" | "doacao" | "outro";

const FILTER_LABELS: Record<FilterType, string> = {
    all: "Todos",
    filiacao: "Filiação",
    mensalidade: "Mensalidade",
    doacao: "Doação",
    outro: "Outro",
};

// ─── página principal ─────────────────────────────────────────────────────────

export default function ContributionsPage() {
    const [items, setItems] = useState<Contribution[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const fetchContributions = useCallback(async (type: FilterType) => {
        setPageLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = { limit: 100 };
            if (type !== "all") params.type = type;
            const data = await getContributions(params);
            setItems(data);
        } catch {
            setError("Erro ao carregar contribuições.");
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContributions(filter);
    }, [fetchContributions, filter]);

    const filtered = search.trim()
        ? items.filter((c) =>
              (c.person?.name ?? "").toLowerCase().includes(search.toLowerCase()),
          )
        : items;

    return (
        <>
            <DashboardBreadcrumb title="Contribuições" text="Contribuições" />

            <Card className="card !p-0 !block border-0 overflow-hidden">
                <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !block !py-4 px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
                        <CardTitle className="text-lg font-semibold">Contribuições</CardTitle>
                        <Button size="sm" onClick={() => setShowCreate(true)}>
                            + Nova Contribuição
                        </Button>
                    </div>

                    {/* filtros de tipo */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {(
                            ["all", "filiacao", "mensalidade", "doacao", "outro"] as FilterType[]
                        ).map((f) => (
                            <Button
                                key={f}
                                size="sm"
                                variant={filter === f ? "default" : "outline"}
                                onClick={() => setFilter(f)}
                            >
                                {FILTER_LABELS[f]}
                            </Button>
                        ))}
                    </div>

                    {/* busca */}
                    <div className="mt-4 max-w-sm">
                        <Input
                            placeholder="Buscar por pessoa..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-neutral-300 dark:border-slate-500"
                        />
                    </div>
                </CardHeader>

                <CardContent className="!p-0">
                    {/* carregando */}
                    {pageLoading && <TableSkeleton />}

                    {/* erro */}
                    {!pageLoading && error && (
                        <div className="py-16 text-center text-sm text-red-500">{error}</div>
                    )}

                    {/* vazio */}
                    {!pageLoading && !error && filtered.length === 0 && (
                        <div className="py-16 text-center text-sm text-neutral-500 dark:text-slate-400">
                            Nenhuma contribuição encontrada.
                        </div>
                    )}

                    {/* tabela */}
                    {!pageLoading && !error && filtered.length > 0 && (
                        <div className="p-6">
                            <Table className="table-auto border-spacing-0 border-separate">
                                <TableHeader>
                                    <TableRow className="border-0">
                                        {[
                                            "Pessoa",
                                            "Tipo",
                                            "Valor",
                                            "Frequência",
                                            "Status",
                                            "Início",
                                        ].map((h) => (
                                            <TableHead
                                                key={h}
                                                className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 first:border-s last:border-e first:rounded-tl-lg last:rounded-tr-lg py-3 px-4 text-sm font-semibold text-neutral-700 dark:text-slate-200"
                                            >
                                                {h}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((c, idx) => (
                                        <ContributionRow
                                            key={c.id}
                                            c={c}
                                            isLast={idx === filtered.length - 1}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => fetchContributions(filter)}
            />
        </>
    );
}
