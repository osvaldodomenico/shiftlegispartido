import api from './api'

export interface Transaction {
  id: number
  description: string
  amount: number
  type: string
  status: string
  dueDate: string | null
  paidAt: string | null
  person: { id: number; name: string; email: string } | null
  category: { id: number; name: string; type: string } | null
}

/** Formato camelCase retornado pelo backend em GET /finance/transactions/:id */
export interface TransactionDetail {
  id: number
  description: string
  amount: number
  type: string
  status: string
  context: string
  origin: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  competencyMonth: number
  competencyYear: number
  person: { id: number; name: string; email: string } | null
  category: { id: number; name: string; type: string } | null
  costCenter: { id: number; name: string; code: string } | null
}

interface ApiResponse {
  success: boolean
  data: Transaction[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateTransactionPayload {
  description: string
  amount: number
  type: 'income' | 'expense'
  due_date: string
  category_id: number
  cost_center_id?: number
  person_id: number
  competency_month: number
  competency_year: number
  notes?: string
}

export async function getTransactions(
  params?: Record<string, string | number>,
): Promise<Transaction[]> {
  const response = await api.get<ApiResponse>('/finance/transactions', { params })
  return response.data.data
}

export async function createTransaction(
  data: CreateTransactionPayload,
): Promise<Transaction> {
  const response = await api.post<{ success: boolean; data: Transaction }>(
    '/finance/transactions',
    data,
  )
  return response.data.data
}

export async function getTransactionById(id: number): Promise<TransactionDetail> {
  const response = await api.get<{ success: boolean; data: TransactionDetail }>(
    `/finance/transactions/${id}`,
  )
  return response.data.data
}

export async function approveTransaction(id: number): Promise<void> {
  await api.post(`/finance/transactions/${id}/approve`)
}

export async function rejectTransaction(id: number, reason: string): Promise<void> {
  await api.post(`/finance/transactions/${id}/reject`, { reason })
}

export async function payTransaction(id: number, paid_at?: string): Promise<void> {
  await api.post(`/finance/transactions/${id}/pay`, paid_at ? { paid_at } : {})
}

export async function cancelTransaction(id: number, reason: string): Promise<void> {
  await api.post(`/finance/transactions/${id}/cancel`, { reason })
}
