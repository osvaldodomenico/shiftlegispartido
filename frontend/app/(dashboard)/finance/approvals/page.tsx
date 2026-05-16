"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
    Transaction,
    approveTransaction,
    getTransactions,
    rejectTransaction,
} from "@/services/transactions.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

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

// ─── modal de rejeição ────────────────────────────────────────────────────────

function RejectModal({
    open,
    loading,
    onConfirm,
    onClose,
}: {
    open: boolean;
    loading: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");

    // limpa motivo ao abrir
    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Informe o motivo da rejeição.");
            return;
        }
        onConfirm(reason.trim());
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rejeitar transação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label
                            htmlFor="reject-reason"
                            className="text-[#4b5563] dark:text-white mb-2"
                        >
                            Motivo *
                        </Label>
                        <Textarea
                            id="reject-reason"
                            placeholder="Descreva o motivo da rejeição..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-24 border-neutral-300 dark:border-slate-500"
                            maxLength={500}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" variant="destructive" disabled={loading}>
                            {loading ? "Rejeitando..." : "Confirmar rejeição"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── skeleton de carregamento ─────────────────────────────────────────────────

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

function ApprovalRow({
    tx,
    isLast,
    actioningId,
    onApprove,
    onReject,
}: {
    tx: Transaction;
    isLast: boolean;
    actioningId: number | null;
    onApprove: (id: number) => void;
    onReject: (tx: Transaction) => void;
}) {
    const busy = actioningId === tx.id;
    const cellClass = `py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${
        isLast ? "first:rounded-bl-lg last:rounded-br-lg" : ""
    }`;

    return (
        <TableRow>
            <TableCell className={cellClass}>
                <span className="font-medium text-sm">{tx.description}</span>
            </TableCell>
            <TableCell className={cellClass}>
                {tx.person?.name ?? "—"}
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
                <Badge
                    variant={tx.type === "income" ? "success" : "danger"}
                    className="rounded-[50rem]"
                >
                    {tx.type === "income" ? "Receita" : "Despesa"}
                </Badge>
            </TableCell>
            <TableCell className={`${cellClass} text-end`}>
                <div className="flex items-center justify-end gap-2">
                    <Button
                        size="sm"
                        disabled={!!actioningId}
                        onClick={() => onApprove(tx.id)}
                    >
                        {busy ? "..." : "Aprovar"}
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={!!actioningId}
                        onClick={() => onReject(tx)}
                    >
                        Rejeitar
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function ApprovalsPage() {
    const [items, setItems] = useState<Transaction[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioningId, setActioningId] = useState<number | null>(null);

    // modal de rejeição
    const [rejectTarget, setRejectTarget] = useState<Transaction | null>(null);

    const fetchPending = useCallback(async () => {
        setError(null);
        try {
            const data = await getTransactions({ status: "pending_approval", limit: 100 });
            setItems(data);
        } catch {
            setError("Erro ao carregar aprovações pendentes.");
        } finally {
            setPageLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    // ─── aprovar ──────────────────────────────────────────────────────────────

    async function handleApprove(id: number) {
        setActioningId(id);
        try {
            await approveTransaction(id);
            toast.success("Transação aprovada com sucesso");
            setItems((prev) => prev.filter((t) => t.id !== id));
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string | string[] } } })
                    ?.response?.data?.message;
            toast.error(
                Array.isArray(msg) ? msg.join(", ") : (msg ?? "Erro ao aprovar.")
            );
        } finally {
            setActioningId(null);
        }
    }

    // ─── rejeitar ─────────────────────────────────────────────────────────────

    async function handleReject(reason: string) {
        if (!rejectTarget) return;
        const id = rejectTarget.id;
        setActioningId(id);
        try {
            await rejectTransaction(id, reason);
            toast.success("Transação rejeitada");
            setRejectTarget(null);
            setItems((prev) => prev.filter((t) => t.id !== id));
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string | string[] } } })
                    ?.response?.data?.message;
            toast.error(
                Array.isArray(msg) ? msg.join(", ") : (msg ?? "Erro ao rejeitar.")
            );
        } finally {
            setActioningId(null);
        }
    }

    // ─── render ───────────────────────────────────────────────────────────────

    return (
        <>
            <DashboardBreadcrumb
                title="Fila de Aprovações"
                text="Aprovações"
            />

            <Card className="card !p-0 !block border-0 overflow-hidden">
                <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle className="text-lg font-semibold">
                            Transações pendentes de aprovação
                        </CardTitle>
                        {!pageLoading && !error && (
                            <Badge variant="info" className="rounded-[50rem]">
                                {items.length}{" "}
                                {items.length === 1 ? "pendente" : "pendentes"}
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* loading */}
                    {pageLoading && <TableSkeleton />}

                    {/* error */}
                    {!pageLoading && error && (
                        <div className="py-12 text-center text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {/* empty */}
                    {!pageLoading && !error && items.length === 0 && (
                        <div className="py-12 text-center text-sm text-neutral-500 dark:text-slate-400">
                            Nenhuma transação pendente de aprovação.
                        </div>
                    )}

                    {/* tabela */}
                    {!pageLoading && !error && items.length > 0 && (
                        <div className="p-6">
                            <Table className="table-auto border-spacing-0 border-separate">
                                <TableHeader>
                                    <TableRow className="border-0">
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 border-s rounded-tl-lg overflow-hidden">
                                            Descrição
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 overflow-hidden">
                                            Pessoa
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 overflow-hidden">
                                            Valor
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 overflow-hidden">
                                            Vencimento
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 overflow-hidden">
                                            Tipo
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 px-4 h-12 border-e rounded-tr-lg overflow-hidden text-end">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {items.map((tx, index) => (
                                        <ApprovalRow
                                            key={tx.id}
                                            tx={tx}
                                            isLast={index === items.length - 1}
                                            actioningId={actioningId}
                                            onApprove={handleApprove}
                                            onReject={setRejectTarget}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* modal de rejeição */}
            <RejectModal
                open={!!rejectTarget}
                loading={actioningId === rejectTarget?.id}
                onConfirm={handleReject}
                onClose={() => setRejectTarget(null)}
            />
        </>
    );
}
