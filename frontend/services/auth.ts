import api from './api'

export interface AuthUser {
  id: number
  tenantId: number
  name: string
  email: string
  status: string
  roles: { id: number; name: string }[]
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const { data: loginData } = await api.post<{ data: { access_token: string } }>(
    '/auth/login',
    { email, password },
  )

  const token = loginData.data.access_token

  // Busca dados completos do usuário com o token recém-obtido
  const { data: meData } = await api.get<{ data: AuthUser }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return { token, user: meData.data }
}
