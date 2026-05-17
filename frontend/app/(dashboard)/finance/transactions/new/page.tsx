"use client";

import { useEffect, useRef, useState } from "react";
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
import api from "@/services/api";

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

function maskBRL(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    const cents = parseInt(digits, 10);
    return (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

interface PersonResult {
    id: number;
    name: string;
    email: string;
}

export default function NewTransactionPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);

    // Person search state
    const [personSearch, setPersonSearch] = useState("");
    const [personResults, setPersonResults] = useState<PersonResult[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<{ id: number; name: string } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const personRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getCategories().catch(() => {});
    }, []);

    // Reload categories filtered by type
    useEffect(() => {
        if (!form.type) return;
        getCategories(form.type as "income" | "expense")
            .then(setCategories)
            .catch(() => setCategories([]));
        setForm((prev) => ({ ...prev, category_id: "" }));
    }, [form.type]);

    // Debounced person search
    useEffect(() => {
        if (!personSearch || selectedPerson) {
            setPersonResults([]);
            setShowDropdown(false);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await api.get<{ data: PersonResult[] }>(
                    `/people?search=${encodeURIComponent(personSearch)}`
                );
                const results = res.data.data ?? [];
                setPersonResults(results);
                setShowDropdown(results.length > 0);
            } catch {
                setPersonResults([]);
                setShowDropdown(false);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [personSearch, selectedPerson]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (personRef.current && !personRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function set(key: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function selectPerson(p: PersonResult) {
        setSelectedPerson({ id: p.id, name: p.name });
        set("person_id", String(p.id));
        setPersonSearch("");
        setPersonResults([]);
        setShowDropdown(false);
    }

    function clearPerson() {
        setSelectedPerson(null);
        set("person_id", "");
        setPersonSearch("");
        setPersonResults([]);
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
        if (!form.person_id) {
            toast.error("Selecione uma pessoa.");
            return;
        }

        setLoading(true);
        try {
            const dueDate = new Date(form.due_date);
            const rawAmount = form.amount.replace(/\./g, "").replace(",", ".");
            const payload: CreateTransactionPayload = {
                description: form.description,
                amount: parseFloat(rawAmount),
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
                                        type="text"
                                        inputMode="numeric"
                                        className={inputClass}
                                        placeholder="0,00"
                                        value={form.amount}
                                        onChange={(e) => set("amount", maskBRL(e.target.value))}
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
                                    htmlFor="person_search"
                                    className="text-[#4b5563] dark:text-white mb-2"
                                >
                                    Pessoa *
                                </Label>
                                <div ref={personRef} className="relative">
                                    {selectedPerson ? (
                                        <div className="flex items-center gap-2 h-12 px-5 border border-neutral-300 dark:border-slate-500 rounded-lg bg-background">
                                            <span className="flex-1 text-sm">
                                                {selectedPerson.name}{" "}
                                                <span className="text-neutral-400 dark:text-neutral-500">
                                                    (#{selectedPerson.id})
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={clearPerson}
                                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-lg leading-none px-1"
                                                aria-label="Limpar seleção"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                id="person_search"
                                                type="text"
                                                className={inputClass}
                                                placeholder="Buscar por nome..."
                                                value={personSearch}
                                                onChange={(e) => setPersonSearch(e.target.value)}
                                                autoComplete="off"
                                            />
                                            {showDropdown && (
                                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                                                    {personResults.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 dark:hover:bg-slate-700 border-b border-neutral-100 dark:border-slate-700 last:border-0"
                                                            onClick={() => selectPerson(p)}
                                                        >
                                                            <span className="font-medium">{p.name}</span>
                                                            {p.email && (
                                                                <span className="text-neutral-400 dark:text-neutral-500 ml-2">
                                                                    {p.email}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
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
