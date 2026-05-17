import api from './api'

// ─── interfaces ───────────────────────────────────────────────────────────────

export interface ContributionPayment {
  id: number
  due_date: string
  paid_at: string | null
  amount: number
  status: string  // 'pending' | 'paid' | 'overdue'
}

export interface Contribution {
  id: number
  type: string        // 'filiacao' | 'mensalidade' | 'doacao' | 'outro'
  amount: number
  status: string      // 'active' | 'inactive' | 'overdue'
  frequency: string   // 'monthly' | 'quarterly' | 'annual' | 'once'
  start_date: string
  end_date: string | null
  person: { id: number; name: string; email: string } | null
  payments?: ContributionPayment[]
}

export interface CreateContributionDto {
  type: string
  amount: number
  frequency: string
  start_date: string
  end_date?: string | null
  person_id?: number | null
}

// ─── service functions ────────────────────────────────────────────────────────

export async function getContributions(
  params?: Record<string, string | number>,
): Promise<Contribution[]> {
  const response = await api.get<{ success: boolean; data: Contribution[] }>(
    '/contributions',
    { params },
  )
  return response.data.data
}

export async function getContributionById(id: number): Promise<Contribution> {
  const response = await api.get<{ success: boolean; data: Contribution }>(
    `/contributions/${id}`,
  )
  return response.data.data
}

export async function createContribution(
  dto: CreateContributionDto,
): Promise<Contribution> {
  const response = await api.post<{ success: boolean; data: Contribution }>(
    '/contributions',
    dto,
  )
  return response.data.data
}

export async function updateContribution(
  id: number,
  dto: Partial<CreateContributionDto>,
): Promise<Contribution> {
  const response = await api.patch<{ success: boolean; data: Contribution }>(
    `/contributions/${id}`,
    dto,
  )
  return response.data.data
}

export async function deleteContribution(id: number): Promise<void> {
  await api.delete(`/contributions/${id}`)
}

export async function getContributionPayments(
  id: number,
): Promise<ContributionPayment[]> {
  const response = await api.get<{ success: boolean; data: ContributionPayment[] }>(
    `/contributions/${id}/payments`,
  )
  return response.data.data
}

export async function markPaymentAsPaid(
  contributionId: number,
  paymentId: number,
): Promise<ContributionPayment> {
  const response = await api.post<{ success: boolean; data: ContributionPayment }>(
    `/contributions/${contributionId}/payments/${paymentId}/pay`,
  )
  return response.data.data
}
