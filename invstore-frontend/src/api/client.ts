import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,   // httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
})

// Responde 401 → redirige al login (excepto en chequeo de sesión o login)
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url ?? ''
      const isSessionCheck = url.includes('/auth/me') || url.includes('/auth/login')
      if (!isSessionCheck && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default client
