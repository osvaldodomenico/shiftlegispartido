"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Download, FilePlus2, UploadCloud } from "lucide-react";
import {
    Document,
    DocumentVersion,
    getDocument,
    getDocumentVersions,
    uploadNewVersion,
} from "@/services/documents.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(iso));
}

// ─── new version dialog ───────────────────────────────────────────────────────

interface NewVersionDialogProps {
    open: boolean;
    loading: boolean;
    onClose: () => void;
    onSubmit: (file: File, notes: string) => void;
}

function NewVersionDialog({ open, loading, onClose, onSubmit }: NewVersionDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setFile(null);
            setNotes("");
        }
    }, [open]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            toast.error("Selecione um arquivo.");
            return;
        }
        onSubmit(file, notes.trim());
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Versão</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    <div>
                        <Label htmlFor="version-notes" className="text-[#4b5563] dark:text-white mb-2">
                            Anotações
                        </Label>
                        <Input
                            id="version-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Descreva as alterações desta versão"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Enviando..." : "Salvar Versão"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);

    const [doc, setDoc] = useState<Document | null>(null);
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newVersionOpen, setNewVersionOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        setPageLoading(true);
        setError(null);
        try {
            const [docData, versionsData] = await Promise.all([
                getDocument(id),
                getDocumentVersions(id),
            ]);
            setDoc(docData);
            setVersions(versionsData);
        } catch {
            setError("Erro ao carregar documento.");
        } finally {
            setPageLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleNewVersion(file: File, notes: string) {
        setUploading(true);
        try {
            await uploadNewVersion(id, file, notes || undefined);
            toast.success("Nova versão enviada com sucesso.");
            setNewVersionOpen(false);
            await load();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string | string[] } } })
                ?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Erro ao enviar versão."));
        } finally {
            setUploading(false);
        }
    }

    return (
        <>
            <DashboardBreadcrumb title="Detalhes do Documento" text="Documentos" />

            <div className="flex items-center gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>
            </div>

            {pageLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            )}

            {!pageLoading && error && (
                <div className="py-12 text-center text-sm text-red-500">{error}</div>
            )}

            {!pageLoading && !error && doc && (
                <div className="flex flex-col gap-4">
                    {/* info card */}
                    <Card className="card border-0">
                        <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !py-4 px-6">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <CardTitle className="text-lg font-semibold">{doc.title}</CardTitle>
                                <div className="flex items-center gap-2">
                                    {doc.file_url && (
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="gap-1.5">
                                                <Download className="h-4 w-4" />
                                                Download
                                            </Button>
                                        </a>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => setNewVersionOpen(true)}
                                        className="gap-1.5"
                                    >
                                        <FilePlus2 className="h-4 w-4" />
                                        Nova Versão
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Arquivo</p>
                                    <p className="font-medium">{doc.file_name}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Tamanho</p>
                                    <p className="font-medium">{formatFileSize(doc.file_size)}</p>
                                </div>
                                <div>
                                    <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Categoria</p>
                                    <p className="font-medium">
                                        {doc.category ? (
                                            <Badge variant="secondary">{doc.category}</Badge>
                                        ) : (
                                            "—"
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Versão atual</p>
                                    <p className="font-medium">v{doc.version}</p>
                                </div>
                                {doc.description && (
                                    <div className="sm:col-span-2">
                                        <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Descrição</p>
                                        <p className="font-medium">{doc.description}</p>
                                    </div>
                                )}
                                {doc.tags && doc.tags.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <p className="text-neutral-500 dark:text-slate-400 mb-1">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {doc.tags.map((t) => (
                                                <Badge key={t} variant="outline">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Criado em</p>
                                    <p className="font-medium">{formatDate(doc.created_at)}</p>
                                </div>
                                {doc.created_by && (
                                    <div>
                                        <p className="text-neutral-500 dark:text-slate-400 mb-0.5">Criado por</p>
                                        <p className="font-medium">{doc.created_by.name}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* version history */}
                    <Card className="card !p-0 !block border-0 overflow-hidden">
                        <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !py-4 px-6">
                            <CardTitle className="text-base font-semibold">Histórico de Versões</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {versions.length === 0 ? (
                                <div className="py-10 text-center text-sm text-neutral-500 dark:text-slate-400">
                                    Nenhuma versão anterior registrada.
                                </div>
                            ) : (
                                <div className="p-6">
                                    <Table className="table-auto border-spacing-0 border-separate">
                                        <TableHeader>
                                            <TableRow className="border-0">
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 first:rounded-tl-xl first:border-l">
                                                    Versão
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                                    Arquivo
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                                    Tamanho
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                                    Anotações
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                                    Uploader
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0">
                                                    Data
                                                </TableHead>
                                                <TableHead className="bg-neutral-100 dark:bg-slate-700 border-t border-neutral-200 dark:border-slate-600 border-b-0 last:rounded-tr-xl last:border-r">
                                                    Download
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {versions.map((v) => (
                                                <TableRow
                                                    key={v.id}
                                                    className="border-neutral-100 dark:border-slate-700"
                                                >
                                                    <TableCell className="font-medium">v{v.version}</TableCell>
                                                    <TableCell className="max-w-[180px] truncate">
                                                        {v.file_name}
                                                    </TableCell>
                                                    <TableCell>{formatFileSize(v.file_size)}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-neutral-500 dark:text-slate-400">
                                                        {v.notes ?? "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {v.created_by?.name ?? "—"}
                                                    </TableCell>
                                                    <TableCell>{formatDate(v.created_at)}</TableCell>
                                                    <TableCell>
                                                        {v.file_url ? (
                                                            <a
                                                                href={v.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Button size="icon" variant="ghost" title="Download">
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </a>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <NewVersionDialog
                open={newVersionOpen}
                loading={uploading}
                onClose={() => setNewVersionOpen(false)}
                onSubmit={handleNewVersion}
            />
        </>
    );
}
