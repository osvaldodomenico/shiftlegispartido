"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    TransactionDetail,
    approveTransaction,
    cancelTransaction,
    getTransactionById,
    payTransaction,
    rejectTransaction,
} from "@/services/transactions.service";

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
    draft: "warning",
    pending_approval: "info",
    approved: "secondary",
    paid: "success",
    overdue: "danger",
    cancelled: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
    draft: "Rascunho",
    pending_approval: "Aguard. aprovação",
    approved: "Aprovado",
    paid: "Pago",
    overdue: "Vencido",
    cancelled: "Cancelado",
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

// ─── sub-componente: linha de detalhe ────────────────────────────────────────

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 py-3 border-b border-neutral-100 dark:border-slate-700 last:border-0">
            <span className="text-xs text-neutral-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                {label}
            </span>
            <span className="text-sm font-medium text-neutral-800 dark:text-slate-100">
                {value}
            </span>
        </div>
    );
}

// ─── modal de rejeitar ────────────────────────────────────────────────────────

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
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={loading}
                        >
                            {loading ? "Rejeitando..." : "Confirmar rejeição"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── modal de pagar ───────────────────────────────────────────────────────────

function PayModal({
    open,
    loading,
    onConfirm,
    onClose,
}: {
    open: boolean;
    loading: boolean;
    onConfirm: (paidAt?: string) => void;
    onClose: () => void;
}) {
    const today = new Date().toISOString().split("T")[0];
    const [paidAt, setPaidAt] = useState(today);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onConfirm(paidAt || undefined);
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar pagamento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label
                            htmlFor="paid-at"
                            className="text-[#4b5563] dark:text-white mb-2"
                        >
                            Data do pagamento
                        </Label>
                        <Input
                            id="paid-at"
                            type="date"
                            className="border border-neutral-300 px-5 dark:border-slate-500 focus:border-primary dark:focus:border-primary focus-visible:border-primary h-12 rounded-lg !shadow-none !ring-0"
                            value={paidAt}
                            onChange={(e) => setPaidAt(e.target.value)}
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "Registrando..." : "Confirmar pagamento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── modal de cancelar ────────────────────────────────────────────────────────

function CancelModal({
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

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error("Informe o motivo do cancelamento.");
            return;
        }
        onConfirm(reason.trim());
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancelar transação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label
                            htmlFor="cancel-reason"
                            className="text-[#4b5563] dark:text-white mb-2"
                        >
                            Motivo *
                        </Label>
                        <Textarea
                            id="cancel-reason"
                            placeholder="Descreva o motivo do cancelamento..."
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
                            Voltar
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={loading}
                        >
                            {loading ? "Cancelando..." : "Confirmar cancelamento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── página principal ─────────────────────────────────────────────────────────

type Modal = "reject" | "pay" | "cancel" | null;

export default function TransactionDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const txId = Number(params.id);

    const [tx, setTx] = useState<TransactionDetail | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [modal, setModal] = useState<Modal>(null);

    const fetchTransaction = useCallback(async () => {
        try {
            const data = await getTransactionById(txId);
            setTx(data);
        } catch {
            toast.error("Erro ao carregar transação.");
            router.push("/finance/transactions");
        } finally {
            setPageLoading(false);
        }
    }, [txId, router]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    // ─── handlers de ação ────────────────────────────────────────────────────

    async function handleAction(fn: () => Promise<void>, successMsg: string) {
        setActionLoading(true);
        try {
            await fn();
            toast.success(successMsg);
            setModal(null);
            // refetch para atualizar status exibido
            await fetchTransaction();
        } catch (err: unknown) {
            const apiMessage =
                (err as { response?: { data?: { message?: string | string[] } } })
                    ?.response?.data?.message;
            const message = Array.isArray(apiMessage)
                ? apiMessage.join(", ")
                : (apiMessage ?? "Erro ao executar ação.");
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    }

    function handleApprove() {
        handleAction(() => approveTransaction(txId), "Transação aprovada com sucesso");
    }

    function handleReject(reason: string) {
        handleAction(
            () => rejectTransaction(txId, reason),
            "Transação rejeitada com sucesso",
        );
    }

    function handlePay(paidAt?: string) {
        handleAction(() => payTransaction(txId, paidAt), "Pagamento registrado com sucesso");
    }

    function handleCancel(reason: string) {
        handleAction(
            () => cancelTransaction(txId, reason),
            "Transação cancelada com sucesso",
        );
    }

    // ─── estados de carregamento / erro ──────────────────────────────────────

    if (pageLoading) {
        return (
            <>
                <DashboardBreadcrumb title="Detalhe da Transação" text="Detalhe" />
                <div className="py-16 text-center text-sm text-neutral-500 dark:text-slate-400">
                    Carregando...
                </div>
            </>
        );
    }

    if (!tx) return null;

    const statusVariant = STATUS_VARIANT[tx.status] ?? "default";
    const statusLabel = STATUS_LABEL[tx.status] ?? tx.status;

    // botões disponíveis conforme status
    const canApprove = tx.status === "pending_approval";
    const canReject = tx.status === "pending_approval";
    const canPay = tx.status === "approved" || tx.status === "overdue";
    const canCancel = tx.status === "draft" || tx.status === "approved";
    const hasActions = canApprove || canReject || canPay || canCancel;

    return (
        <>
            <DashboardBreadcrumb title="Detalhe da Transação" text="Detalhe" />

            <div className="grid grid-cols-12 gap-5">
                {/* ─── card principal ──────────────────────────────────────── */}
                <div className="col-span-12 md:col-span-7">
                    <Card className="card h-full !p-0 !block border-0 overflow-hidden">
                        <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <CardTitle className="text-lg font-semibold">
                                    {tx.description}
                                </CardTitle>
                                <Badge
                                    variant={statusVariant}
                                    className="rounded-[50rem] text-sm px-4 py-1"
                                >
                                    {statusLabel}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                                <DetailRow
                                    label="Valor"
                                    value={
                                        <span
                                            className={
                                                tx.type === "income"
                                                    ? "text-green-600 dark:text-green-400 font-semibold"
                                                    : "text-red-600 dark:text-red-400 font-semibold"
                                            }
                                        >
                                            {formatBRL(tx.amount)}
                                        </span>
                                    }
                                />
                                <DetailRow
                                    label="Tipo"
                                    value={tx.type === "income" ? "Receita" : "Despesa"}
                                />
                                <DetailRow
                                    label="Vencimento"
                                    value={formatDate(tx.dueDate)}
                                />
                                {tx.paidAt && (
                                    <DetailRow
                                        label="Pago em"
                                        value={formatDate(tx.paidAt)}
                                    />
                                )}
                                <DetailRow
                                    label="Competência"
                                    value={`${String(tx.competencyMonth).padStart(2, "0")}/${tx.competencyYear}`}
                                />
                                <DetailRow
                                    label="Pessoa"
                                    value={tx.person?.name ?? "—"}
                                />
                                <DetailRow
                                    label="Categoria"
                                    value={tx.category?.name ?? "—"}
                                />
                                <DetailRow
                                    label="Centro de custo"
                                    value={tx.costCenter?.name ?? "—"}
                                />
                                {tx.notes && (
                                    <div className="sm:col-span-2">
                                        <DetailRow
                                            label="Observações"
                                            value={tx.notes}
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── card de ações ───────────────────────────────────────── */}
                {hasActions && (
                    <div className="col-span-12 md:col-span-5">
                        <Card className="card h-full !p-0 !block border-0 overflow-hidden">
                            <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
                                <CardTitle className="text-lg font-semibold">Ações</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col gap-3">
                                {canApprove && (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {actionLoading ? "Processando..." : "Aprovar"}
                                    </Button>
                                )}
                                {canReject && (
                                    <Button
                                        onClick={() => setModal("reject")}
                                        disabled={actionLoading}
                                        variant="destructive"
                                        className="w-full"
                                        size="lg"
                                    >
                                        Rejeitar
                                    </Button>
                                )}
                                {canPay && (
                                    <Button
                                        onClick={() => setModal("pay")}
                                        disabled={actionLoading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        Marcar como pago
                                    </Button>
                                )}
                                {canCancel && (
                                    <Button
                                        onClick={() => setModal("cancel")}
                                        disabled={actionLoading}
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        Cancelar transação
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* ─── botão voltar ─────────────────────────────────────────────── */}
            <div className="mt-4">
                <Button
                    variant="outline"
                    onClick={() => router.push("/finance/transactions")}
                >
                    ← Voltar para listagem
                </Button>
            </div>

            {/* ─── modais ───────────────────────────────────────────────────── */}
            <RejectModal
                open={modal === "reject"}
                loading={actionLoading}
                onConfirm={handleReject}
                onClose={() => setModal(null)}
            />
            <PayModal
                open={modal === "pay"}
                loading={actionLoading}
                onConfirm={handlePay}
                onClose={() => setModal(null)}
            />
            <CancelModal
                open={modal === "cancel"}
                loading={actionLoading}
                onConfirm={handleCancel}
                onClose={() => setModal(null)}
            />
        </>
    );
}
