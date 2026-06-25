export type Role = 'admin' | 'worker'
export type Estado = 'active' | 'pause' | 'leave' | 'off'
export type SolicitudStatus = 'pending' | 'approved' | 'rejected'
export type Categoria =
  | 'Fijaciones' | 'Empaquetaduras' | 'Tuberias y Pasamuros' | 'Fittings y Flanges'
  | 'Perfiles y Estructuras' | 'Planchas' | 'Aislacion' | 'Adhesivos'
  | 'Instrumentacion' | 'Soldadura' | 'Consumibles y EPP' | 'Limpieza'
  | 'Herramientas' | 'Lubricantes' | 'Escritorio' | 'Izaje' | 'Otro'

export interface User {
  id: string
  nombre: string
  cargo: string
  user: string
  role: Role
  foto?: string | null
  telefono?: string
  rut?: string
  especialidad?: string
  estado?: Estado
  evaluaciones?: Evaluacion[]
  notas?: Nota[]
}

export interface Item {
  id: number
  nombre: string
  codigo: string
  categoria: Categoria
  spec: string
  stock: number
  precio?: number | null   // omitido para workers
  threshold: number
  foto?: string | null
}

export interface SolicitudItem {
  itemId: number
  cantidad: number
  precioSnapshot?: number | null
  item?: Item
}

export interface Solicitud {
  id: number
  userId: string
  proyecto: string
  plano: string
  ficha: string
  status: SolicitudStatus
  fecha: string
  hora?: string
  items: SolicitudItem[]
  user?: User
}

export interface Movimiento {
  id: number
  itemId: number
  solicitudId: number
  userId: string
  cantidad: number
  precio?: number | null
  proyecto: string
  plano: string
  ficha: string
  fecha: string
  item?: Item
  user?: User
}

export interface Evaluacion {
  id: number
  rating: number
  comment?: string
  proyecto?: string
  fecha: string
  solicitudId?: number | null
  evaluador?: { nombre: string }
}

export interface Nota {
  id: number
  byNombre: string
  text: string
  fecha: string
}

export interface IAMaterial {
  catalogId?: number | null
  nombre: string
  spec?: string
  cantidadSugerida: number
  unidad: string
  razon?: string
  enCatalogo: boolean
}

export interface IAResultado {
  resumen: string
  materiales: IAMaterial[]
  advertencias?: string[]
}

export interface BodegaLog {
  id: number
  itemId: number
  userId: string
  cantidad: number
  fecha: string
  item?: Item
  user?: User
}

export interface ReporteStats {
  totalSolicitudes: number
  aprobadas: number
  pendientes: number
  totalUnidades: number
  porCategoria: { categoria: string; qty: number }[]
  porTrabajador: { nombre: string; unidades: number }[]
  porProyecto: { proyecto: string; unidades: number }[]
  duplicados: { worker: string; item: string; proyecto: string; fecha: string }[]
}
