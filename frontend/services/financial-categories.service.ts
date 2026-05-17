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

export async function getAllCategories(): Promise<FinancialCategory[]> {
  const response = await api.get<ApiResponse>('/finance/categories')
  return response.data.data
}

export async function createCategory(data: { name: string; type: 'income' | 'expense'; description?: string }): Promise<FinancialCategory> {
  const response = await api.post<{ success: boolean; data: FinancialCategory }>('/finance/categories', data)
  return response.data.data
}

export async function updateCategory(id: number, data: { name?: string; is_active?: boolean; description?: string }): Promise<FinancialCategory> {
  const response = await api.patch<{ success: boolean; data: FinancialCategory }>(`/finance/categories/${id}`, data)
  return response.data.data
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/finance/categories/${id}`)
}
