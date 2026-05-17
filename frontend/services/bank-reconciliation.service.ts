import api from './api'

export interface BankAccount {
  id: number
  name: string
  bank_name: string
  bank_code: string | null
  agency: string | null
  account_number: string
  type: string // 'corrente' | 'poupanca' | 'campanha'
  initial_balance: number
  is_active: boolean
  current_balance?: number
}

export interface BankStatement {
  id: number
  bank_account_id: number
  date: string
  description: string
  amount: number
  type: string // 'credito' | 'debito'
  balance_after: number | null
  is_reconciled: boolean
  transaction_id: number | null
  notes: string | null
}

export interface StatementSummary {
  total_creditos: number
  total_debitos: number
  saldo_extrato: number
}

export interface StatementsResponse {
  items: BankStatement[]
  summary: StatementSummary
}

export interface SummaryResponse {
  accounts: (BankAccount & { current_balance: number })[]
  total_balance: number
}

export type StatementFilter = 'pendentes' | 'conciliados' | 'todos'

// ─── Accounts ────────────────────────────────────────────────────────────────

export const listAccounts = async (): Promise<BankAccount[]> => {
  const res = await api.get<{ data: BankAccount[] }>('/bank-reconciliation/accounts')
  return res.data.data
}

export const createAccount = async (data: {
  name: string
  bank_name: string
  bank_code?: string
  agency?: string
  account_number: string
  type: string
  initial_balance?: number
}): Promise<BankAccount> => {
  const res = await api.post<{ data: BankAccount }>('/bank-reconciliation/accounts', data)
  return res.data.data
}

export const updateAccount = async (
  id: number,
  data: Partial<{
    name: string
    bank_name: string
    bank_code: string
    agency: string
    account_number: string
    type: string
    initial_balance: number
  }>,
): Promise<BankAccount> => {
  const res = await api.patch<{ data: BankAccount }>(`/bank-reconciliation/accounts/${id}`, data)
  return res.data.data
}

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/bank-reconciliation/accounts/${id}`)
}

// ─── Statements ──────────────────────────────────────────────────────────────

export const listStatements = async (
  accountId: number,
  filter: StatementFilter = 'todos',
): Promise<StatementsResponse> => {
  const res = await api.get<{ data: StatementsResponse }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    { params: { filter } },
  )
  return res.data.data
}

export const addStatement = async (
  accountId: number,
  data: {
    date: string
    description: string
    amount: number
    type: string
    balance_after?: number
    notes?: string
  },
): Promise<BankStatement> => {
  const res = await api.post<{ data: BankStatement }>(
    `/bank-reconciliation/accounts/${accountId}/statements`,
    data,
  )
  return res.data.data
}

export const importStatements = async (
  accountId: number,
  entries: Array<{
    date: string
    description: string
    amount: number
    type: string
    balance_after?: number
    notes?: string
  }>,
): Promise<{ count: number }> => {
  const res = await api.post<{ data: { count: number } }>(
    `/bank-reconciliation/accounts/${accountId}/statements/import`,
    { entries },
  )
  return res.data.data
}

export const reconcileStatement = async (
  statementId: number,
  transaction_id: number,
): Promise<BankStatement> => {
  const res = await api.patch<{ data: BankStatement }>(
    `/bank-reconciliation/statements/${statementId}/reconcile`,
    { transaction_id },
  )
  return res.data.data
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export const getSummary = async (): Promise<SummaryResponse> => {
  const res = await api.get<{ data: SummaryResponse }>('/bank-reconciliation/summary')
  return res.data.data
}
