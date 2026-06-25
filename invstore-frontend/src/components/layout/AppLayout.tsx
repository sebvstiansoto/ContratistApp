import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuthStore } from '../../store/authStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Inicio',
  '/inventario':   'Inventario',
  '/solicitudes':  'Solicitudes',
  '/historial':    'Historial',
  '/bodega':       'Bodega',
  '/ia':           'Asistente IA',
  '/reportes':     'Reportes',
  '/comparar':     'Comparar Proyectos',
  '/trabajadores': 'Trabajadores',
  '/perfil':       'Mi Perfil',
  '/solicitar':    'Nueva Solicitud',
  '/mis-vales':    'Mis Vales',
  '/mi-perfil':    'Mi Perfil',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { resetTimeout } = useAuthStore()

  // Track user activity for session timeout
  useEffect(() => {
    const events = ['click', 'keydown', 'mousemove', 'touchstart'] as const
    const handler = () => resetTimeout()
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, handler))
  }, [resetTimeout])

  const title = PAGE_TITLES[pathname] ?? 'InvStore'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
