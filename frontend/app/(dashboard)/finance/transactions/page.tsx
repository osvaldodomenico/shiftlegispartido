"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Transaction, getTransactions } from "@/services/transactions.service";

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
    pending: "warning",
    pending_approval: "info",
    approved: "secondary",
    paid: "success",
    cancelled: "destructive",
    rejected: "danger",
};

const STATUS_LABEL: Record<string, string> = {
    pending: "Pendente",
    pending_approval: "Aguard. aprovação",
    approved: "Aprovado",
    paid: "Pago",
    cancelled: "Cancelado",
    rejected: "Rejeitado",
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
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
        </div>
    );
}

// ─── linha da tabela ──────────────────────────────────────────────────────────

function TransactionRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
    const cellClass = `py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${
        isLast ? "first:rounded-bl-lg last:rounded-br-lg" : ""
    }`;
    const statusVariant = STATUS_VARIANT[tx.status] ?? "default";
    const statusLabel = STATUS_LABEL[tx.status] ?? tx.status;

    return (
        <TableRow>
            <TableCell className={cellClass}>{tx.description}</TableCell>
            <TableCell className={cellClass}>
                {tx.person ? tx.person.name : "—"}
            </TableCell>
            <TableCell className={cellClass}>
                <span
                    className={
                        tx.type === "income"
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : "text-red-600 dark:text-red-400 font-semibold"
                    }
                >
                    {formatBRL(tx.amount)}
                </span>
            </TableCell>
            <TableCell className={cellClass}>{formatDate(tx.dueDate)}</TableCell>
            <TableCell className={cellClass}>
                <Badge variant={statusVariant} className="rounded-[50rem]">
                    {statusLabel}
                </Badge>
            </TableCell>
            <TableCell className={cellClass}>
                <Badge
                    variant={tx.type === "income" ? "success" : "danger"}
                    className="rounded-[50rem]"
                >
                    {tx.type === "income" ? "Receita" : "Despesa"}
                </Badge>
            </TableCell>
            <TableCell className={`${cellClass} text-end`}>
                <Button asChild size="sm" variant="outline">
                    <Link href={`/finance/transactions/${tx.id}`}>Ver detalhes</Link>
                </Button>
            </TableCell>
        </TableRow>
    );
}

// ─── tipos de filtro ──────────────────────────────────────────────────────────

type FilterType = "all" | "income" | "expense";

const FILTER_LABELS: Record<FilterType, string> = {
    all: "Todos",
    income: "Receitas",
    expense: "Despesas",
};

// ─── página principal ─────────────────────────────────────────────────────────

export default function TransactionsPage() {
    const [items, setItems] = useState<Transaction[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [search, setSearch] = useState("");

    const fetchTransactions = useCallback(async (type: FilterType) => {
        setPageLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = { limit: 100 };
            if (type !== "all") params.type = type;
            const data = await getTransactions(params);
            setItems(data);
        } catch {
            setError("Erro ao carregar transações.");
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions(filter);
    }, [fetchTransactions, filter]);

    const filtered = search.trim()
        ? items.filter(
              (t) =>
                  t.description.toLowerCase().includes(search.toLowerCase()) ||
                  (t.person?.name ?? "").toLowerCase().includes(search.toLowerCase()),
          )
        : items;

    return (
        <>
            <DashboardBreadcrumb title="Transações" text="Transações" />

            <Card className="card !p-0 !block border-0 overflow-hidden">
                <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !block !py-4 px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
                        <CardTitle className="text-lg font-semibold">Transações</CardTitle>
                        <Button asChild size="sm">
                            <Link href="/finance/transactions/new">+ Nova Transação</Link>
                        </Button>
                    </div>

                    {/* filtros de tipo */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        {(["all", "income", "expense"] as FilterType[]).map((f) => (
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
                            placeholder="Buscar por descrição ou pessoa..."
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
                            Nenhuma transação encontrada.
                        </div>
                    )}

                    {/* tabela */}
                    {!pageLoading && !error && filtered.length > 0 && (
                        <div className="p-6">
                            <Table className="table-auto border-spacing-0 border-separate">
                                <TableHeader>
                                    <TableRow className="border-0">
                                        {[
                                            "Descrição",
                                            "Pessoa",
                                            "Valor",
                                            "Vencimento",
                                            "Status",
                                            "Tipo",
                                            "",
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
                                    {filtered.map((tx, idx) => (
                                        <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            isLast={idx === filtered.length - 1}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
