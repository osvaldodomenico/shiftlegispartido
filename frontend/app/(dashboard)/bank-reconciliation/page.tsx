"use client";

import { useCallback, useEffect, useState } from "react";
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
  BankAccount,
  BankStatement,
  StatementFilter,
  StatementsResponse,
  addStatement,
  createAccount,
  deleteAccount,
  getSummary,
  importStatements,
  listStatements,
  reconcileStatement,
} from "@/services/bank-reconciliation.service";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  campanha: "Campanha",
};

// ─── Skeletons ───────────────────────────────────────────────────────────────

function AccountCardSkeleton() {
  return (
    <Card className="w-64">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24" />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BankReconciliationPage() {
  const [accounts, setAccounts] = useState<(BankAccount & { current_balance: number })[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [statementsData, setStatementsData] = useState<StatementsResponse | null>(null);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [filter, setFilter] = useState<StatementFilter>("todos");

  // Dialogs
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [showNewStatement, setShowNewStatement] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showReconcile, setShowReconcile] = useState<BankStatement | null>(null);

  // Forms
  const [accountForm, setAccountForm] = useState({
    name: "",
    bank_name: "",
    bank_code: "",
    agency: "",
    account_number: "",
    type: "corrente",
    initial_balance: "",
  });
  const [statementForm, setStatementForm] = useState({
    date: "",
    description: "",
    amount: "",
    type: "credito",
    balance_after: "",
    notes: "",
  });
  const [importText, setImportText] = useState("");
  const [reconcileTransactionId, setReconcileTransactionId] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await getSummary();
      setAccounts(data.accounts);
      setTotalBalance(data.total_balance);
    } catch {
      toast.error("Erro ao carregar contas bancárias");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadStatements = useCallback(async () => {
    if (!selectedAccount) return;
    setLoadingStatements(true);
    try {
      const data = await listStatements(selectedAccount.id, filter);
      setStatementsData(data);
    } catch {
      toast.error("Erro ao carregar extratos");
    } finally {
      setLoadingStatements(false);
    }
  }, [selectedAccount, filter]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreateAccount() {
    setSaving(true);
    try {
      await createAccount({
        name: accountForm.name,
        bank_name: accountForm.bank_name,
        bank_code: accountForm.bank_code || undefined,
        agency: accountForm.agency || undefined,
        account_number: accountForm.account_number,
        type: accountForm.type as "corrente" | "poupanca" | "investimento" | "outro",
        initial_balance: accountForm.initial_balance
          ? parseFloat(accountForm.initial_balance)
          : undefined,
      });
      toast.success("Conta bancária criada com sucesso");
      setShowNewAccount(false);
      setAccountForm({
        name: "",
        bank_name: "",
        bank_code: "",
        agency: "",
        account_number: "",
        type: "corrente",
        initial_balance: "",
      });
      loadSummary();
    } catch {
      toast.error("Erro ao criar conta bancária");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(id: number) {
    if (!confirm("Deseja remover esta conta bancária?")) return;
    try {
      await deleteAccount(id);
      toast.success("Conta removida");
      if (selectedAccount?.id === id) setSelectedAccount(null);
      loadSummary();
    } catch {
      toast.error("Erro ao remover conta");
    }
  }

  async function handleAddStatement() {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      await addStatement(selectedAccount.id, {
        date: statementForm.date,
        description: statementForm.description,
        amount: parseFloat(statementForm.amount),
        type: statementForm.type,
        balance_after: statementForm.balance_after
          ? parseFloat(statementForm.balance_after)
          : undefined,
        notes: statementForm.notes || undefined,
      });
      toast.success("Lançamento adicionado");
      setShowNewStatement(false);
      setStatementForm({
        date: "",
        description: "",
        amount: "",
        type: "credito",
        balance_after: "",
        notes: "",
      });
      loadStatements();
      loadSummary();
    } catch {
      toast.error("Erro ao adicionar lançamento");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    if (!selectedAccount) return;
    setSaving(true);
    try {
      // Parse CSV-like text: date,description,amount,type per line
      const lines = importText
        .trim()
        .split("\n")
        .filter((l) => l.trim());
      const entries = lines.map((line) => {
        const [date, description, amount, type, balance_after] = line
          .split(",")
          .map((v) => v.trim());
        return {
          date,
          description,
          amount: parseFloat(amount),
          type: type as "credito" | "debito",
          balance_after: balance_after ? parseFloat(balance_after) : undefined,
        };
      });
      const result = await importStatements(selectedAccount.id, entries);
      toast.success(`${result.count} lançamento(s) importado(s)`);
      setShowImport(false);
      setImportText("");
      loadStatements();
      loadSummary();
    } catch {
      toast.error("Erro ao importar extrato. Verifique o formato.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReconcile() {
    if (!showReconcile) return;
    const txId = parseInt(reconcileTransactionId);
    if (!txId) {
      toast.error("Informe um ID de transação válido");
      return;
    }
    setSaving(true);
    try {
      await reconcileStatement(showReconcile.id, txId);
      toast.success("Lançamento conciliado com sucesso");
      setShowReconcile(null);
      setReconcileTransactionId("");
      loadStatements();
    } catch {
      toast.error("Erro ao conciliar. Verifique o ID da transação.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const summary = statementsData?.summary;

  return (
    <div className="flex flex-col gap-6 p-6">
      <DashboardBreadcrumb
        items={[{ label: "Conciliação Bancária", href: "/bank-reconciliation" }]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conciliação Bancária</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie suas contas bancárias e concilie os extratos com as transações do sistema.
          </p>
        </div>
        <Button onClick={() => setShowNewAccount(true)}>Nova Conta</Button>
      </div>

      {/* Accounts Row */}
      <div className="flex flex-wrap gap-4">
        {loadingAccounts ? (
          <>
            <AccountCardSkeleton />
            <AccountCardSkeleton />
          </>
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma conta bancária cadastrada.
          </p>
        ) : (
          <>
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                className={`w-64 cursor-pointer transition-all hover:shadow-md ${
                  selectedAccount?.id === acc.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedAccount(acc)}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">{acc.name}</CardTitle>
                  <p className="text-muted-foreground text-xs">
                    {acc.bank_name} •{" "}
                    {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                  </p>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Ag. {acc.agency ?? "—"} / Cc. {acc.account_number}
                  </p>
                  <p className="font-semibold text-lg">
                    {formatBRL(acc.current_balance ?? 0)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive px-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(acc.id);
                    }}
                  >
                    Remover
                  </Button>
                </CardContent>
              </Card>
            ))}
            {/* Total */}
            <Card className="w-64 bg-muted">
              <CardHeader className="pb-1">
                <CardTitle className="text-base">Saldo Total</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Todas as contas ativas
                </p>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-xl">{formatBRL(totalBalance)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Statements Section */}
      {selectedAccount && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Extrato — {selectedAccount.name}
            </h2>
            <div className="flex gap-2">
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as StatementFilter)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="conciliados">Conciliados</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowImport(true)}
              >
                Importar Extrato
              </Button>
              <Button onClick={() => setShowNewStatement(true)}>
                Novo Lançamento
              </Button>
            </div>
          </div>

          {/* Statements Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingStatements ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : statementsData?.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum lançamento encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statementsData?.items.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(s.date)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {s.description}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {s.type === "debito"
                            ? formatBRL(s.amount)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {s.type === "credito"
                            ? formatBRL(s.amount)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.balance_after !== null
                            ? formatBRL(s.balance_after)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {s.is_reconciled ? (
                            <Badge variant="default" className="bg-green-500">
                              Conciliado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!s.is_reconciled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowReconcile(s)}
                            >
                              Conciliar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary Footer */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Total Créditos
                  </p>
                  <p className="font-semibold text-green-600">
                    {formatBRL(summary.total_creditos)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Total Débitos
                  </p>
                  <p className="font-semibold text-red-600">
                    {formatBRL(summary.total_debitos)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Saldo do Extrato
                  </p>
                  <p className="font-semibold">
                    {formatBRL(summary.saldo_extrato)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    Saldo da Conta
                  </p>
                  <p className="font-semibold">
                    {formatBRL(
                      accounts.find((a) => a.id === selectedAccount.id)
                        ?.current_balance ?? 0,
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── Dialog: Nova Conta ─────────────────────────────────────────────── */}
      <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1">
              <Label>Nome da Conta *</Label>
              <Input
                placeholder="Ex: Conta Principal"
                value={accountForm.name}
                onChange={(e) =>
                  setAccountForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Banco *</Label>
                <Input
                  placeholder="Ex: Banco do Brasil"
                  value={accountForm.bank_name}
                  onChange={(e) =>
                    setAccountForm((f) => ({
                      ...f,
                      bank_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Código do Banco</Label>
                <Input
                  placeholder="001"
                  value={accountForm.bank_code}
                  onChange={(e) =>
                    setAccountForm((f) => ({
                      ...f,
                      bank_code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Agência</Label>
                <Input
                  placeholder="0001"
                  value={accountForm.agency}
                  onChange={(e) =>
                    setAccountForm((f) => ({ ...f, agency: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Número da Conta *</Label>
                <Input
                  placeholder="12345-6"
                  value={accountForm.account_number}
                  onChange={(e) =>
                    setAccountForm((f) => ({
                      ...f,
                      account_number: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Tipo *</Label>
                <Select
                  value={accountForm.type}
                  onValueChange={(v) =>
                    setAccountForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="campanha">Campanha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>Saldo Inicial (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={accountForm.initial_balance}
                  onChange={(e) =>
                    setAccountForm((f) => ({
                      ...f,
                      initial_balance: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAccount(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateAccount} disabled={saving}>
              {saving ? "Salvando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Novo Lançamento ────────────────────────────────────────── */}
      <Dialog open={showNewStatement} onOpenChange={setShowNewStatement}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento no Extrato</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={statementForm.date}
                  onChange={(e) =>
                    setStatementForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Tipo *</Label>
                <Select
                  value={statementForm.type}
                  onValueChange={(v) =>
                    setStatementForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Descrição *</Label>
              <Input
                placeholder="Descrição do lançamento"
                value={statementForm.description}
                onChange={(e) =>
                  setStatementForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={statementForm.amount}
                  onChange={(e) =>
                    setStatementForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label>Saldo Após (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={statementForm.balance_after}
                  onChange={(e) =>
                    setStatementForm((f) => ({
                      ...f,
                      balance_after: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações opcionais"
                value={statementForm.notes}
                onChange={(e) =>
                  setStatementForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewStatement(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddStatement} disabled={saving}>
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Importar Extrato ───────────────────────────────────────── */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar Extrato</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Cole os lançamentos no formato CSV (uma linha por lançamento):
            </p>
            <code className="text-xs bg-muted rounded p-2 block">
              data,descrição,valor,tipo[,saldo_após]
              <br />
              2026-05-01,Pagamento fornecedor,500.00,debito,1500.00
              <br />
              2026-05-02,Receita filiação,200.00,credito,1700.00
            </code>
            <Textarea
              className="font-mono text-xs"
              rows={8}
              placeholder="2026-05-01,Depósito,1000.00,credito,..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImport(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={saving || !importText.trim()}>
              {saving ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Conciliar ─────────────────────────────────────────────── */}
      <Dialog
        open={!!showReconcile}
        onOpenChange={(open) => !open && setShowReconcile(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Conciliar Lançamento</DialogTitle>
          </DialogHeader>
          {showReconcile && (
            <div className="grid gap-4 py-2">
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium">Data:</span>{" "}
                  {formatDate(showReconcile.date)}
                </p>
                <p>
                  <span className="font-medium">Descrição:</span>{" "}
                  {showReconcile.description}
                </p>
                <p>
                  <span className="font-medium">Valor:</span>{" "}
                  <span
                    className={
                      showReconcile.type === "credito"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatBRL(showReconcile.amount)}
                  </span>
                </p>
              </div>
              <div className="grid gap-1">
                <Label>ID da Transação no Sistema *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 42"
                  value={reconcileTransactionId}
                  onChange={(e) => setReconcileTransactionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Informe o ID da transação financeira correspondente.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReconcile(null)}
            >
              Cancelar
            </Button>
            <Button onClick={handleReconcile} disabled={saving}>
              {saving ? "Conciliando..." : "Confirmar Conciliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
