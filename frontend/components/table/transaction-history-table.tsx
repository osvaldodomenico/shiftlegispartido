"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { getTransactions, Transaction } from "@/services/transactions.service";

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

function formatAmount(amount: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("pt-BR").format(new Date(dateStr));
}

const TransactionHistoryTable = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTransactions({ limit: 5 })
            .then((data) => setTransactions(data))
            .catch(() => setError("Erro ao carregar transações."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-slate-400">
                Carregando...
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center text-sm text-red-500">
                {error}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-slate-400">
                Nenhuma transação encontrada.
            </div>
        );
    }

    return (
        <Table className="table-auto border-spacing-0 border-separate">
            <TableHeader>
                <TableRow className="border-0">
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-s rounded-tl-lg">
                        Responsável
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">
                        E-mail
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">
                        Descrição
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">
                        Valor
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">
                        Tipo
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12">
                        Vencimento
                    </TableHead>
                    <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 overflow-hidden px-4 h-12 border-e rounded-tr-lg text-center">
                        Status
                    </TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {transactions.map((tx, index) => {
                    const isLastRow = index === transactions.length - 1;
                    const variant = STATUS_VARIANT[tx.status] ?? "default";
                    const label = STATUS_LABEL[tx.status] ?? tx.status;

                    return (
                        <TableRow key={tx.id}>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                <h6 className="text-base mb-0 font-medium">
                                    {tx.person?.name ?? "—"}
                                </h6>
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                {tx.person?.email ?? "—"}
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                {tx.description}
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                {formatAmount(tx.amount)}
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                {tx.type === "income" ? "Receita" : "Despesa"}
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-bl-lg" : ""}`}
                            >
                                {formatDate(tx.dueDate)}
                            </TableCell>
                            <TableCell
                                className={`py-3 px-4 border-b border-neutral-200 dark:border-slate-600 first:border-s last:border-e ${isLastRow ? "rounded-br-lg" : ""} text-center`}
                            >
                                <Badge variant={variant} className="rounded-[50rem]">
                                    {label}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default TransactionHistoryTable;
