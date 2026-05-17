"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
    Download,
    Eye,
    FilePlus2,
    Search,
    Trash2,
    UploadCloud,
} from "lucide-react";
import {
    Document,
    createDocument,
    deleteDocument,
    getDocuments,
} from "@/services/documents.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
        new Date(iso)
    );
}

function mimeLabel(mime: string): string {
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("word") || mime.includes("docx") || mime.includes("doc"))
        return "DOC";
    if (mime.includes("image")) return "IMG";
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("xlsx"))
        return "XLS";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "PPT";
    if (mime.includes("text")) return "TXT";
    return "ARQ";
}

function mimeBadgeVariant(
    mime: string
): "default" | "info" | "warning" | "secondary" | "destructive" {
    if (mime.includes("pdf")) return "destructive";
    if (mime.includes("word") || mime.includes("doc")) return "info";
    if (mime.includes("image")) return "warning";
    return "secondary";
}

const CATEGORIES = [
    "Todos",
    "Ata",
    "Contrato",
    "Resolução",
    "Estatuto",
    "Financeiro",
    "Jurídico",
    "Outros",
];

// ─── skeleton ────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
        </div>
    );
}

// ─── upload dialog ────────────────────────────────────────────────────────────

interface UploadDialogProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onSubmit: (payload: {
        file: File;
        title: string;
        description: string;
        category: string;
        tags: string;
    }) => void;
}

function UploadDialog({ open, loading, onClose, onSubmit }: UploadDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setTitle("");
            setDescription("");
            setCategory("");
            setTags("");
            setFile(null);
        }
    }, [open]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Informe o título do documento.");
            return;
        }
        if (!file) {
            toast.error("Selecione um arquivo.");
            return;
        }
        onSubmit({ file, title: title.trim(), description, category, tags });
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Novo Documento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="doc-title" className="text-[#4b5563] dark:text-white mb-2">
                            Título *
                        </Label>
                        <Input
                            id="doc-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Ata da Reunião de Maio"
                        />
                    </div>
                    <div>
                        <Label htmlFor="doc-desc" className="text-[#4b5563] dark:text-white mb-2">
                            Descrição
                        </Label>
                        <Textarea
                            id="doc-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descrição opcional"
                            rows={2}
                        />
                    </div>
                    <div>
                        <Label htmlFor="doc-category" className="text-[#4b5563] dark:text-white mb-2">
                            Categoria
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger id="doc-category">
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="doc-tags" className="text-[#4b5563] dark:text-white mb-2">
                            Tags (separadas por vírgula)
                        </Label>
                        <Input
                            id="doc-tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Ex: reunião, 2024, diretório"
                        />
                    </div>
                    <div>
                        <Label className="text-[#4b5563] dark:text-white mb-2">Arquivo *</Label>
                        <div
                            className="border-2 border-dashed border-neutral-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileRef.current?.click()}
                        >
                            <UploadCloud className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
                            {file ? (
                                <p className="text-sm text-neutral-700 dark:text-slate-300">
                                    {file.name} ({formatFileSize(file.size)})
                                </p>
                            ) : (
                                <p className="text-sm text-neutral-400">
                                    Clique para selecionar um arquivo
                                </p>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
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
                            {loading ? "Enviando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── row ─────────────────────────────────────────────────────────────────────

interface RowProps {
    doc: Document;
    onView: (id: number) => void;
    onDelete: (id: number) => void;
}

function DocumentRow({ doc, onView, onDelete }: RowProps) {
    return (
        <TableRow className="border-neutral-100 dark:border-slate-700">
            <TableCell className="font-medium max-w-[220px] truncate">{doc.title}</TableCell>
            <TableCell>
                {doc.category ? (
                    <Badge variant="secondary">{doc.category}</Badge>
                ) : (
                    <span className="text-neutral-400 text-xs">—</span>
                )}
            </TableCell>
            <TableCell>
                <Badge variant={mimeBadgeVariant(doc.mime_type)}>
                    {mimeLabel(doc.mime_type)}
                </Badge>
            </TableCell>
            <TableCell className="text-center">v{doc.version}</TableCell>
            <TableCell>{formatFileSize(doc.file_size)}</TableCell>
            <TableCell>{formatDate(doc.created_at)}</TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => onView(doc.id)} title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                    </Button>
                    {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost" title="Download">
                                <Download className="h-4 w-4" />
                            </Button>
                        </a>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => onDelete(doc.id)}
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
    const router = useRouter();
    const [items, setItems] = useState<Document[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Todos");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        setPageLoading(true);
        setError(null);
        try {
            const params: Record<string, string | number> = {};
            if (search) params.search = search;
            if (category && category !== "Todos") params.category = category;
            const data = await getDocuments(params);
            setItems(data);
        } catch {
            setError("Erro ao carregar documentos. Tente novamente.");
        } finally {
            setPageLoading(false);
        }
    }, [search, category]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleUpload(payload: {
        file: File;
        title: string;
        description: string;
        category: string;
        tags: string;
    }) {
        setUploading(true);
        try {
            const doc = await createDocument(payload);
            toast.success("Documento enviado com sucesso.");
            setUploadOpen(false);
            setItems((prev) => [doc, ...prev]);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Erro ao enviar documento."));
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Deseja excluir este documento?")) return;
        try {
            await deleteDocument(id);
            toast.success("Documento excluído.");
            setItems((prev) => prev.filter((d) => d.id !== id));
        } catch {
            toast.error("Erro ao excluir documento.");
        }
    }

    return (
        <>
            <DashboardBreadcrumb
                title="Documentos (GED)"
                text="Documentos"
            />

            <Card className="card !p-0 !block border-0 overflow-hidden">
                <CardHeader className="border-b !block border-neutral-200 dark:border-slate-600 !py-4 px-6">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle className="text-lg font-semibold">
                            Gestão Eletrônica de Documentos
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                <Input
                                    className="pl-8 w-56"
                                    placeholder="Buscar documentos..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            {/* category filter */}
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
                                <FilePlus2 className="h-4 w-4" />
                                Novo Documento
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {pageLoading && <TableSkeleton />}

                    {!pageLoading && error && (
                        <div className="py-12 text-center text-sm text-red-500">{error}</div>
                    )}

                    {!pageLoading && !error && items.length === 0 && (
                        <div className="py-12 text-center text-sm text-neutral-500 dark:text-slate-400">
                            Nenhum documento encontrado.
                        </div>
                    )}

                    {!pageLoading && !error && items.length > 0 && (
                        <div className="p-6">
                            <Table className="table-auto border-spacing-0 border-separate">
                                <TableHeader>
                                    <TableRow className="border-0">
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 first:rounded-tl-xl first:border-l last:rounded-tr-xl last:border-r">
                                            Título
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                            Categoria
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                            Tipo
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 text-center">
                                            Versão
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                            Tamanho
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                            Data
                                        </TableHead>
                                        <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 last:rounded-tr-xl last:border-r">
                                            Ações
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((doc) => (
                                        <DocumentRow
                                            key={doc.id}
                                            doc={doc}
                                            onView={(id) => router.push(`/documents/${id}`)}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <UploadDialog
                open={uploadOpen}
                loading={uploading}
                onClose={() => setUploadOpen(false)}
                onSubmit={handleUpload}
            />
        </>
    );
}
