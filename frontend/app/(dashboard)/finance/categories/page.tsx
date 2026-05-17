"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
    FinancialCategory,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "@/services/financial-categories.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
    if (type === "income") {
        return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Receita
            </Badge>
        );
    }
    return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Despesa
        </Badge>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <Badge variant="default">Ativo</Badge>
    ) : (
        <Badge variant="secondary">Inativo</Badge>
    );
}

// ─── modal nova categoria ─────────────────────────────────────────────────────

function CreateModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (cat: FinancialCategory) => void;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"income" | "expense" | "">("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setName("");
            setType("");
        }
    }, [open]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Informe o nome da categoria.");
            return;
        }
        if (!type) {
            toast.error("Selecione o tipo da categoria.");
            return;
        }
        setLoading(true);
        try {
            const created = await createCategory({ name: name.trim(), type });
            toast.success("Categoria criada com sucesso.");
            onCreated(created);
            onClose();
        } catch {
            toast.error("Erro ao criar categoria.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="create-name">Nome *</Label>
                        <Input
                            id="create-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Folha de Pagamento"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="create-type">Tipo *</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as "income" | "expense")}
                        >
                            <SelectTrigger id="create-type">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="expense">Despesa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── modal editar categoria ───────────────────────────────────────────────────

function EditModal({
    category,
    onClose,
    onUpdated,
}: {
    category: FinancialCategory | null;
    onClose: () => void;
    onUpdated: (cat: FinancialCategory) => void;
}) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category) setName(category.name);
    }, [category]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Informe o nome da categoria.");
            return;
        }
        if (!category) return;
        setLoading(true);
        try {
            const updated = await updateCategory(category.id, { name: name.trim() });
            toast.success("Categoria atualizada com sucesso.");
            onUpdated(updated);
            onClose();
        } catch {
            toast.error("Erro ao atualizar categoria.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={!!category} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Nome *</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da categoria"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── página principal ─────────────────────────────────────────────────────────

export default function CategoriesPage() {
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<FinancialCategory | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FinancialCategory | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch {
            toast.error("Erro ao carregar categorias.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function handleCreated(cat: FinancialCategory) {
        setCategories((prev) => [cat, ...prev]);
    }

    function handleUpdated(cat: FinancialCategory) {
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    }

    async function handleToggle(cat: FinancialCategory) {
        setTogglingId(cat.id);
        try {
            const updated = await updateCategory(cat.id, { is_active: !cat.is_active });
            setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            toast.success(updated.is_active ? "Categoria ativada." : "Categoria desativada.");
        } catch {
            toast.error("Erro ao alterar status.");
        } finally {
            setTogglingId(null);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);
        try {
            await deleteCategory(deleteTarget.id);
            setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            toast.success("Categoria removida com sucesso.");
        } catch {
            toast.error("Erro ao remover categoria.");
        } finally {
            setDeletingId(null);
            setDeleteTarget(null);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <DashboardBreadcrumb title="Financeiro" text="Categorias" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Categorias Financeiras</h1>
                    <p className="text-muted-foreground text-sm">
                        Gerencie as categorias de receita e despesa.
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">
                            Nenhuma categoria cadastrada.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>
                                            <TypeBadge type={cat.type} />
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge active={cat.is_active} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleToggle(cat)}
                                                    disabled={togglingId === cat.id}
                                                    title={cat.is_active ? "Desativar" : "Ativar"}
                                                >
                                                    {cat.is_active ? "Desativar" : "Ativar"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditTarget(cat)}
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteTarget(cat)}
                                                    disabled={deletingId === cat.id}
                                                    title="Excluir"
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <CreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={handleCreated}
            />

            <EditModal
                category={editTarget}
                onClose={() => setEditTarget(null)}
                onUpdated={handleUpdated}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(v: boolean) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A categoria <strong>{deleteTarget?.name}</strong> sera removida permanentemente.
                            Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
