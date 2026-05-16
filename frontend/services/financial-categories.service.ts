import api from './api'

export interface FinancialCategory {
  id: number
  name: string
  type: string
  is_active: boolean
}

interface ApiResponse {
  success: boolean
  data: FinancialCategory[]
}

export async function getCategories(
  type?: 'income' | 'expense',
): Promise<FinancialCategory[]> {
  const params = type ? { type, is_active: 'true' } : { is_active: 'true' }
  const response = await api.get<ApiResponse>('/finance/categories', { params })
  return response.data.data
}
