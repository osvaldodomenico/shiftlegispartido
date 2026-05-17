"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getBankAccounts,
  getBankStatements,
  createBankStatement,
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
  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(iso));
  } catch {
    return iso;
  }
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  investimento: "Investimento",
  outro: "Outro",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BankAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = Number(params.id);

  const [account, setAccount] = useState<BankAccount | null>(null);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "conciliados">("todos");
  const [loading, setLoading] = useState(true);

  // New statement dialog
  const [showNewStatement, setShowNewStatement] = useState(false);
  const [savingStatement, setSavingStatement] = useState(false);
  const [stmtForm, setStmtForm] = useState({
    date: "",
    description: "",
    amount: "",
    type: "credito" as "credito" | "debito",
    notes: "",
  });

  // Reconcile dialog
  const [reconcileTarget, setReconcileTarget] = useState<BankStatement | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [savingReconcile, setSavingReconcile] = useState(false);

  // ─── Load ───────────────────────────────────────────────────────────────

  const loadAccount = async () => {
    try {
      const accounts = await getBankAccounts();
      const found = accounts.find((a) => a.id === accountId) ?? null;
      setAccount(found);
    } catch {
      toast.error("Erro ao carregar conta bancária.");
    }
  };

  const loadStatements = async () => {
    setLoading(true);
    try {
      const data = await getBankStatements(accountId, filter);
      setStatements(data);
    } catch {
      toast.error("Erro ao carregar lançamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, [accountId]);

  useEffect(() => {
    loadStatements();
  }, [accountId, filter]);

  // ─── New Statement ───────────────────────────────────────────────────────

  const handleCreateStatement = async () => {
    if (!stmtForm.date || !stmtForm.description || !stmtForm.amount) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSavingStatement(true);
    try {
      await createBankStatement(accountId, {
        date: stmtForm.date,
        description: stmtForm.description,
        amount: parseFloat(stmtForm.amount),
        type: stmtForm.type,
        notes: stmtForm.notes || undefined,
      });
      toast.success("Lançamento criado com sucesso.");
      setShowNewStatement(false);
      setStmtForm({ date: "", description: "", amount: "", type: "credito", notes: "" });
      loadStatements();
    } catch {
      toast.error("Erro ao criar lançamento.");
    } finally {
      setSavingStatement(false);
    }
  };

  // ─── Reconcile ───────────────────────────────────────────────────────────

  const handleReconcile = async () => {
    if (!reconcileTarget || !transactionId) {
      toast.error("Informe o ID da transação.");
      return;
    }
    setSavingReconcile(true);
    try {
      await reconcileStatement(accountId, reconcileTarget.id, Number(transactionId));
      toast.success("Lançamento conciliado com sucesso.");
      setReconcileTarget(null);
      setTransactionId("");
      loadStatements();
    } catch {
      toast.error("Erro ao conciliar lançamento.");
    } finally {
      setSavingReconcile(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/bank-reconciliation")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {account ? account.name : "Carregando..."}
          </h1>
          <p className="text-muted-foreground text-sm">Detalhes e lançamentos da conta</p>
        </div>
      </div>

      {/* Account Info */}
      {account && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Banco</p>
              <p className="font-medium">{account.bank_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Número da Conta</p>
              <p className="font-medium">{account.account_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <Badge variant="outline">
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo Inicial</p>
              <p className="font-medium">{formatBRL(account.initial_balance)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {(["todos", "pendentes", "conciliados"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f === "todos" ? "Todos" : f === "pendentes" ? "Pendentes" : "Conciliados"}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowNewStatement(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>

        {/* Statements Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Conciliado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Carregando lançamentos...
                    </TableCell>
                  </TableRow>
                ) : statements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum lançamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  statements.map((stmt) => (
                    <TableRow key={stmt.id}>
                      <TableCell>{formatDate(stmt.date)}</TableCell>
                      <TableCell>{stmt.description}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            stmt.type === "credito"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                          variant="outline"
                        >
                          {stmt.type === "credito" ? "Crédito" : "Débito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            stmt.type === "credito" ? "text-green-700" : "text-red-700"
                          }
                        >
                          {stmt.type === "debito" ? "- " : "+ "}
                          {formatBRL(stmt.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {stmt.is_reconciled ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                            Conciliado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!stmt.is_reconciled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReconcileTarget(stmt);
                              setTransactionId("");
                            }}
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
      </div>

      {/* New Statement Dialog */}
      <Dialog open={showNewStatement} onOpenChange={setShowNewStatement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="stmt-date">Data *</Label>
              <Input
                id="stmt-date"
                type="date"
                value={stmtForm.date}
                onChange={(e) => setStmtForm({ ...stmtForm, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stmt-description">Descrição *</Label>
              <Input
                id="stmt-description"
                placeholder="Ex: Pagamento fornecedor"
                value={stmtForm.description}
                onChange={(e) => setStmtForm({ ...stmtForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="stmt-amount">Valor *</Label>
                <Input
                  id="stmt-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={stmtForm.amount}
                  onChange={(e) => setStmtForm({ ...stmtForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo *</Label>
                <Select
                  value={stmtForm.type}
                  onValueChange={(v) =>
                    setStmtForm({ ...stmtForm, type: v as "credito" | "debito" })
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
            <div className="space-y-1">
              <Label htmlFor="stmt-notes">Observações</Label>
              <Input
                id="stmt-notes"
                placeholder="Opcional"
                value={stmtForm.notes}
                onChange={(e) => setStmtForm({ ...stmtForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStatement(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateStatement} disabled={savingStatement}>
              {savingStatement ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={!!reconcileTarget} onOpenChange={(open) => !open && setReconcileTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reconcileTarget && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Descrição: </span>
                  {reconcileTarget.description}
                </p>
                <p>
                  <span className="text-muted-foreground">Valor: </span>
                  {formatBRL(reconcileTarget.amount)}
                </p>
                <p>
                  <span className="text-muted-foreground">Data: </span>
                  {formatDate(reconcileTarget.date)}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="transaction-id">ID da Transação *</Label>
              <Input
                id="transaction-id"
                type="number"
                placeholder="Informe o ID da transação financeira"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReconcileTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReconcile} disabled={savingReconcile}>
              {savingReconcile ? "Conciliando..." : "Conciliar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
