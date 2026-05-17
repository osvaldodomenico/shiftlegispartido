import api from "@/lib/api";

// ─── Extended interfaces for legacy compatibility ─────────────────────────────

export interface StatementSummary {
  total_creditos: number;
  total_debitos: number;
  saldo_extrato: number;
}

export interface StatementsResponse {
  items: BankStatement[];
  summary: StatementSummary;
}

export interface SummaryResponse {
  accounts: (BankAccount & { current_balance: number })[];
  total_balance: number;
}

export type StatementFilter = "pendentes" | "conciliados" | "todos";

export interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  bank_code?: string;
  agency?: string;
  account_number: string;
  type: "corrente" | "poupanca" | "investimento" | "outro";
  initial_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface BankStatement {
  id: number;
  bank_account_id: number;
  date: string;
  description: string;
  amount: number;
  type: "credito" | "debito";
  balance_after?: number;
  is_reconciled: boolean;
  transaction_id?: number;
  notes?: string;
  created_at: string;
}

export const getBankAccounts = async (): Promise<BankAccount[]> => {
  const res = await api.get<{ data: BankAccount[] }>("/bank-reconciliation/accounts");
  return res.data.data;
};

export const createBankAccount = async (data: Partial<BankAccount>): Promise<BankAccount> => {
  const res = await api.post<{ data: BankAccount }>("/bank-reconciliation/accounts", data);
  return res.data.data;
};

export const updateBankAccount = async (id: number, data: Partial<BankAccount>): Promise<BankAccount> => {
  const res = await api.patch<{ data: BankAccount }>(`/bank-reconciliation/accounts/${id}`, data);
  return res.data.data;
};

export const deleteBankAccount = async (id: number): Promise<void> => {
  await api.delete(`/bank-reconciliation/accounts/${id}`);
};

export const getBankStatements = async (
  accountId: number,
  filter: "todos" | "pendentes" | "conciliados" = "todos"
): Promise<BankStatement[]> => {
  const res = await api.get<{ data: BankStatement[] }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    { params: { filter } }
  );
  return res.data.data;
};

export const createBankStatement = async (
  accountId: number,
  data: Partial<BankStatement>
): Promise<BankStatement> => {
  const res = await api.post<{ data: BankStatement }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    data
  );
  return res.data.data;
};

export const reconcileStatement = async (
  accountId: number,
  statementId: number,
  transactionId: number
): Promise<BankStatement> => {
  const res = await api.post<{ data: BankStatement }>(
    `/bank-reconciliation/accounts/${accountId}/statements/${statementId}/reconcile`,
    { transactionId }
  );
  return res.data.data;
};

// ─── Legacy aliases (backward-compatible) ────────────────────────────────────

/** @alias getBankAccounts */
export const listAccounts = getBankAccounts;

/** @alias createBankAccount */
export const createAccount = createBankAccount;

/** @alias updateBankAccount */
export const updateAccount = updateBankAccount;

/** @alias deleteBankAccount */
export const deleteAccount = deleteBankAccount;

export const listStatements = async (
  accountId: number,
  filter: StatementFilter = "todos"
): Promise<StatementsResponse> => {
  const res = await api.get<{ data: StatementsResponse }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    { params: { filter } }
  );
  return res.data.data;
};

export const addStatement = async (
  accountId: number,
  data: {
    date: string;
    description: string;
    amount: number;
    type: string;
    balance_after?: number;
    notes?: string;
  }
): Promise<BankStatement> => {
  const res = await api.post<{ data: BankStatement }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    data
  );
  return res.data.data;
};

export const importStatements = async (
  accountId: number,
  entries: Array<{
    date: string;
    description: string;
    amount: number;
    type: string;
    balance_after?: number;
    notes?: string;
  }>
): Promise<{ count: number }> => {
  const res = await api.post<{ data: { count: number } }>(
    `/bank-reconciliation/accounts/${accountId}/statements/import`,
    { entries }
  );
  return res.data.data;
};

export const getSummary = async (): Promise<SummaryResponse> => {
  const res = await api.get<{ data: SummaryResponse }>("/bank-reconciliation/summary");
  return res.data.data;
};
