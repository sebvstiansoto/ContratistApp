import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'
import { Spinner } from './components/ui'

import LoginPage          from './pages/LoginPage'
import DashboardPage      from './pages/admin/DashboardPage'
import InventarioPage     from './pages/admin/InventarioPage'
import SolicitudesPage    from './pages/admin/SolicitudesPage'
import HistorialPage      from './pages/admin/HistorialPage'
import BodegaPage         from './pages/admin/BodegaPage'
import IAPage             from './pages/admin/IAPage'
import ReportesPage       from './pages/admin/ReportesPage'
import CompararPage       from './pages/admin/CompararPage'
import TrabajadoresPage   from './pages/admin/TrabajadoresPage'
import PerfilAdminPage    from './pages/admin/PerfilAdminPage'
import NuevaSolicitudPage from './pages/worker/NuevaSolicitudPage'
import MisValesPage       from './pages/worker/MisValesPage'
import MiPerfilPage       from './pages/worker/MiPerfilPage'

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" className="text-brand-600" /></div>
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'worker' }) {
  const { user, loading } = useAuthStore()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/solicitar'} replace />
  return <>{children}</>
}

function Root() {
  const { user, loading } = useAuthStore()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/dashboard' : '/solicitar'} replace />
}

export default function App() {
  const { hydrate } = useAuthStore()
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Root />} />

      <Route element={<ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/inventario"   element={<InventarioPage />} />
        <Route path="/solicitudes"  element={<SolicitudesPage />} />
        <Route path="/historial"    element={<HistorialPage />} />
        <Route path="/bodega"       element={<BodegaPage />} />
        <Route path="/ia"           element={<IAPage />} />
        <Route path="/reportes"     element={<ReportesPage />} />
        <Route path="/comparar"     element={<CompararPage />} />
        <Route path="/trabajadores" element={<TrabajadoresPage />} />
        <Route path="/perfil"       element={<PerfilAdminPage />} />
      </Route>

      <Route element={<ProtectedRoute role="worker"><AppLayout /></ProtectedRoute>}>
        <Route path="/solicitar" element={<NuevaSolicitudPage />} />
        <Route path="/mis-vales" element={<MisValesPage />} />
        <Route path="/mi-perfil" element={<MiPerfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
