"use client";

import DashboardBreadcrumb from "@/components/layout/dashboard-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as crmApi from "@/services/crm-api";
import type { CrmContact, CrmTag, PersonType, PipelineStage } from "@/types/crm";
import { Eye, Loader2, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const TYPE_LABELS: Record<PersonType, string> = {
  filiado: "Filiado",
  fornecedor: "Fornecedor",
  funcionario: "Funcionário",
  candidato: "Candidato",
  doador: "Doador",
  voluntario: "Voluntário",
};

const TYPE_COLORS: Record<PersonType, string> = {
  filiado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  fornecedor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  funcionario: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  candidato: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  doador: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  voluntario: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim().replace(/-$/, "");
}

export function maskCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

export default function ContactsListPage() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterTag, setFilterTag] = useState("all");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterType !== "all") params.type = filterType;
      if (filterStage !== "all") params.stage = filterStage;
      if (filterTag !== "all") params.tag = filterTag;
      const data = await crmApi.getContacts(params);
      // API retorna { data: [...] } ou array direto — normaliza
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStage, filterTag]);

  useEffect(() => {
    // Carrega stages e tags para os filtros
    Promise.all([crmApi.getPipelineStages(), crmApi.getTags()])
      .then(([s, t]) => {
        setStages(Array.isArray(s) ? s : []);
        setTags(Array.isArray(t) ? t : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  return (
    <>
      <DashboardBreadcrumb title="Contatos CRM" text="Contatos" />

      <Card className="card h-full !p-0 !block border-0 overflow-hidden">
        <CardHeader className="border-b border-neutral-200 dark:border-slate-600 !py-4 px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="flex flex-wrap items-center gap-3">
            {/* Busca por nome */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                className="pl-9 min-w-[220px] focus-visible:ring-0 focus-visible:shadow-none dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                placeholder="Buscar contato..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filtro por tipo */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="min-w-[140px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {(Object.keys(TYPE_LABELS) as PersonType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por etapa do pipeline */}
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="min-w-[160px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por tag */}
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="min-w-[140px] focus-visible:ring-0 dark:bg-slate-700 border-slate-300 dark:border-slate-500">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-auto h-11 gap-2 shrink-0" asChild>
            <Link href="/crm/contacts/new">
              <UserPlus className="w-4 h-4" />
              Novo contato
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 dark:text-neutral-400">
              <UserPlus className="w-10 h-10 opacity-30" />
              <p className="text-sm">Nenhum contato encontrado.</p>
              {(search || filterType !== "all" || filterStage !== "all" || filterTag !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(""); setFilterType("all"); setFilterStage("all"); setFilterTag("all"); }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 dark:bg-slate-800/50">
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Nome</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Tipo</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Etapa</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Tags</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Última interação</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300">Tarefas</TableHead>
                    <TableHead className="font-semibold text-neutral-600 dark:text-neutral-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="hover:bg-neutral-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="font-medium text-neutral-800 dark:text-neutral-200">
                        {contact.name}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[contact.type]}`}>
                          {TYPE_LABELS[contact.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contact.stage ? (
                          <span
                            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border"
                            style={{
                              borderColor: contact.stage.color,
                              color: contact.stage.color,
                              backgroundColor: `${contact.stage.color}18`,
                            }}
                          >
                            {contact.stage.name}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.length > 0
                            ? contact.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                                >
                                  {tag.name}
                                </Badge>
                              ))
                            : <span className="text-neutral-400 text-xs">—</span>
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatDate(contact.last_interaction_at)}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500 dark:text-neutral-400">
                        {contact.task_count ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-primary hover:text-primary"
                          asChild
                        >
                          <Link href={`/crm/contacts/${contact.id}`}>
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
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
