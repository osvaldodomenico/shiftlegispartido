"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import DefaultCardComponent from "@/app/(dashboard)/components/default-card-component";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createTransaction,
    CreateTransactionPayload,
} from "@/services/transactions.service";
import {
    getCategories,
    FinancialCategory,
} from "@/services/financial-categories.service";

const inputClass =
    "border border-neutral-300 px-5 dark:border-slate-500 focus:border-primary dark:focus:border-primary focus-visible:border-primary h-12 rounded-lg !shadow-none !ring-0";

const selectTriggerClass =
    "border border-neutral-300 dark:border-slate-500 h-12 rounded-lg w-full !shadow-none !ring-0 px-5";

interface FormState {
    description: string;
    amount: string;
    type: string;
    due_date: string;
    category_id: string;
    cost_center_id: string;
    person_id: string;
}

const INITIAL_FORM: FormState = {
    description: "",
    amount: "",
    type: "",
    due_date: "",
    category_id: "",
    cost_center_id: "",
    person_id: "",
};

export default function NewTransactionPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);

    useEffect(() => {
        getCategories().catch(() => {});
        // filtra por tipo assim que o usuário selecionar
    }, []);

    // Recarrega categorias filtradas pelo tipo selecionado
    useEffect(() => {
        if (!form.type) return;
        getCategories(form.type as "income" | "expense")
            .then(setCategories)
            .catch(() => setCategories([]));
        // limpa categoria selecionada ao trocar tipo
        setForm((prev) => ({ ...prev, category_id: "" }));
    }, [form.type]);

    function set(key: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.type) {
            toast.error("Selecione o tipo da transação.");
            return;
        }
        if (!form.category_id) {
            toast.error("Selecione uma categoria.");
            return;
        }

        setLoading(true);
        try {
            const dueDate = new Date(form.due_date);
            const payload: CreateTransactionPayload = {
                description: form.description,
                amount: parseFloat(form.amount),
                type: form.type as "income" | "expense",
                due_date: form.due_date,
                category_id: parseInt(form.category_id),
                person_id: parseInt(form.person_id),
                competency_month: dueDate.getMonth() + 1,
                competency_year: dueDate.getFullYear(),
            };

            if (form.cost_center_id) {
                payload.cost_center_id = parseInt(form.cost_center_id);
            }

            await createTransaction(payload);
            toast.success("Transação criada com sucesso");
            router.push("/finance/transactions");
        } catch (err: unknown) {
            const apiMessage =
                (err as { response?: { data?: { message?: string | string[] } } })
                    ?.response?.data?.message;
            const message = Array.isArray(apiMessage)
                ? apiMessage.join(", ")
                : (apiMessage ?? "Erro ao criar transação.");
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <DashboardBreadcrumb
                title="Nova Transação"
                text="Nova Transação"
            />

            <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 md:col-span-8 lg:col-span-6">
                    <DefaultCardComponent title="Dados da Transação">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {/* Descrição */}
                            <div>
                                <Label
                                    htmlFor="description"
                                    className="text-[#4b5563] dark:text-white mb-2"
                                >
                                    Descrição *
                                </Label>
                                <Input
                                    id="description"
                                    type="text"
                                    className={inputClass}
                                    placeholder="Ex: Pagamento de aluguel"
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    maxLength={255}
                                    required
                                />
                            </div>

                            {/* Valor + Tipo */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label
                                        htmlFor="amount"
                                        className="text-[#4b5563] dark:text-white mb-2"
                                    >
                                        Valor (R$) *
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className={inputClass}
                                        placeholder="0,00"
                                        value={form.amount}
                                        onChange={(e) => set("amount", e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-[#4b5563] dark:text-white mb-2">
                                        Tipo *
                                    </Label>
                                    <Select
                                        value={form.type}
                                        onValueChange={(v) => set("type", v)}
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Receita</SelectItem>
                                            <SelectItem value="expense">Despesa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Vencimento */}
                            <div>
                                <Label
                                    htmlFor="due_date"
                                    className="text-[#4b5563] dark:text-white mb-2"
                                >
                                    Vencimento *
                                </Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    className={inputClass}
                                    value={form.due_date}
                                    onChange={(e) => set("due_date", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Categoria */}
                            <div>
                                <Label className="text-[#4b5563] dark:text-white mb-2">
                                    Categoria *
                                </Label>
                                <Select
                                    value={form.category_id}
                                    onValueChange={(v) => set("category_id", v)}
                                    disabled={!form.type || categories.length === 0}
                                >
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue
                                            placeholder={
                                                !form.type
                                                    ? "Selecione o tipo primeiro"
                                                    : "Selecione a categoria"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Pessoa */}
                            <div>
                                <Label
                                    htmlFor="person_id"
                                    className="text-[#4b5563] dark:text-white mb-2"
                                >
                                    ID da Pessoa *
                                </Label>
                                <Input
                                    id="person_id"
                                    type="number"
                                    min="1"
                                    className={inputClass}
                                    placeholder="ID da pessoa vinculada"
                                    value={form.person_id}
                                    onChange={(e) => set("person_id", e.target.value)}
                                    required
                                />
                            </div>

                            {/* Centro de custo (opcional) */}
                            <div>
                                <Label
                                    htmlFor="cost_center_id"
                                    className="text-[#4b5563] dark:text-white mb-2"
                                >
                                    Centro de Custo (opcional)
                                </Label>
                                <Input
                                    id="cost_center_id"
                                    type="number"
                                    min="1"
                                    className={inputClass}
                                    placeholder="ID do centro de custo"
                                    value={form.cost_center_id}
                                    onChange={(e) => set("cost_center_id", e.target.value)}
                                />
                            </div>

                            {/* Ações */}
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={loading} size="lg">
                                    {loading ? "Salvando..." : "Criar Transação"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={() => router.push("/finance/transactions")}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </DefaultCardComponent>
                </div>
            </div>
        </>
    );
}
