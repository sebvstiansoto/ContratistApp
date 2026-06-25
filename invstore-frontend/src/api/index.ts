import client from './client'
import type {
  User, Item, Solicitud, Movimiento, IAResultado,
  ReporteStats, Evaluacion, Nota, BodegaLog
} from '../types'

// ── AUTH ──────────────────────────────────────
export const authApi = {
  login:  (data: { user: string; password: string }) =>
    client.post<{ user: User }>('/auth/login', data).then(r => r.data),
  logout: () => client.post('/auth/logout'),
  me:     () => client.get<User>('/auth/me').then(r => r.data),
}

// ── ITEMS ─────────────────────────────────────
export const itemsApi = {
  list: (params?: { q?: string; categoria?: string; page?: number; limit?: number }) =>
    client.get<Item[]>('/items', { params }).then(r => r.data),
  get:  (id: number) => client.get<Item>(`/items/${id}`).then(r => r.data),
  create: (data: FormData) =>
    client.post<Item>('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: number, data: FormData) =>
    client.put<Item>(`/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  delete: (id: number) => client.delete(`/items/${id}`),
  lowStock: () => client.get<Item[]>('/items/low-stock').then(r => r.data),
}

// ── SOLICITUDES ───────────────────────────────
export const solicitudesApi = {
  list: (params?: { status?: string; userId?: string; proyecto?: string; page?: number }) =>
    client.get<Solicitud[]>('/solicitudes', { params }).then(r => r.data),
  get:  (id: number) => client.get<Solicitud>(`/solicitudes/${id}`).then(r => r.data),
  create: (data: { proyecto: string; plano: string; ficha: string; items: { itemId: number; cantidad: number }[] }) =>
    client.post<Solicitud>('/solicitudes', data).then(r => r.data),
  aprobar: (id: number, force = false) =>
    client.patch<Solicitud>(`/solicitudes/${id}/aprobar`, {}, { params: force ? { force: 'true' } : {} }).then(r => r.data),
  rechazar: (id: number, motivo?: string) =>
    client.patch<Solicitud>(`/solicitudes/${id}/rechazar`, { motivo }).then(r => r.data),
  vale: (id: number) => client.get<Solicitud>(`/solicitudes/${id}/vale`).then(r => r.data),
}

// ── HISTORIAL ─────────────────────────────────
export const historialApi = {
  list: (params?: { q?: string; categoria?: string; proyecto?: string; plano?: string; desde?: string; hasta?: string; page?: number }) =>
    client.get<Movimiento[]>('/historial', { params }).then(r => r.data),
  exportUrl: () => `${client.defaults.baseURL}/historial/export`,
  stats: () => client.get('/historial/stats').then(r => r.data),
}

// ── USERS ─────────────────────────────────────
export const usersApi = {
  list: (role?: string) => client.get<User[]>('/users', { params: { role } }).then(r => r.data),
  create: (data: Partial<User> & { password: string }) =>
    client.post<User>('/users', data).then(r => r.data),
  update: (id: string, data: FormData) =>
    client.put<User>(`/users/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  delete: (id: string) => client.delete(`/users/${id}`),
}

// ── EVALUACIONES ──────────────────────────────
export const evaluacionesApi = {
  list: (userId: string) => client.get<Evaluacion[]>(`/evaluaciones/${userId}`).then(r => r.data),
  create: (data: { evaluadoId: string; solicitudId?: number; rating: number; comment?: string; proyecto?: string }) =>
    client.post<Evaluacion>('/evaluaciones', data).then(r => r.data),
}

// ── NOTAS ─────────────────────────────────────
export const notasApi = {
  create: (data: { userId: string; text: string }) =>
    client.post<Nota>('/notas', data).then(r => r.data),
  delete: (id: number) => client.delete(`/notas/${id}`),
}

// ── BODEGA ────────────────────────────────────
export const bodegaApi = {
  ingresar: (data: { itemId: number; cantidad: number }) =>
    client.post('/bodega/ingresar', data).then(r => r.data),
  log: () => client.get<BodegaLog[]>('/bodega/log').then(r => r.data),
}

// ── IA ────────────────────────────────────────
export const iaApi = {
  analizar: (data: { modo: 'texto' | 'pdf'; contenido: string; extra?: string }) =>
    client.post<IAResultado>('/ia/analizar', data).then(r => r.data),
}

// ── REPORTES ──────────────────────────────────
export const reportesApi = {
  mensual: (mes?: string) =>
    client.get<ReporteStats>('/reportes/mensual', { params: mes ? { mes } : {} }).then(r => r.data),
  comparar: (proyectoA: string, proyectoB: string) =>
    client.get('/reportes/comparar', { params: { proyectoA, proyectoB } }).then(r => r.data),
}

// Re-export BodegaLog type here so api/index is self-contained
export type { BodegaLog }
