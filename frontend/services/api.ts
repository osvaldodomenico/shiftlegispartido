import axios, { AxiosHeaders } from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Lê o token do store persistido (chave: auth-storage) e injeta no Authorization
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage')
      if (raw) {
        const { state } = JSON.parse(raw)
        if (state?.token) {
          const headers = AxiosHeaders.from(config.headers)
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${state.token}`)
          config.headers = headers
        }
      }
    } catch {
      // ignora erros de parse
    }
  }
  return config
})

export default api
