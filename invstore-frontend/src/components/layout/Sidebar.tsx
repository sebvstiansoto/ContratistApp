import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'
import { FotoAvatar } from '../ui'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
}

function SidebarLink({ to, label, icon, badge }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
          isActive
            ? 'bg-brand-50 text-brand-600 font-semibold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        )
      }
    >
      <span className="w-4 h-4 flex-shrink-0 opacity-80">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}

// SVG icons
const Icons = {
  dash:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  inv:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  sols:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  hist:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>,
  bodega:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  ia:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  reportes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  comparar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  profile:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  sol:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  myvales:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
}

interface SidebarProps {
  pendingCount?: number
}

export function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const { user, logout } = useAuthStore()
  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <span className="font-bold text-slate-800">Inv<span className="text-brand-600">Store</span></span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">Principal</p>

        {isAdmin ? (
          <>
            <SidebarLink to="/dashboard"   label="Inicio"        icon={Icons.dash} />
            <SidebarLink to="/inventario"  label="Inventario"    icon={Icons.inv} />
            <SidebarLink to="/solicitudes" label="Solicitudes"   icon={Icons.sols} badge={pendingCount} />
            <SidebarLink to="/historial"   label="Historial"     icon={Icons.hist} />
            <SidebarLink to="/bodega"      label="Bodega"        icon={Icons.bodega} />
            <SidebarLink to="/ia"          label="Asistente IA"  icon={Icons.ia} />
            <SidebarLink to="/reportes"    label="Reportes"      icon={Icons.reportes} />
            <SidebarLink to="/comparar"    label="Comparar"      icon={Icons.comparar} />

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-4 mb-2">Equipo</p>
            <SidebarLink to="/trabajadores" label="Trabajadores" icon={Icons.users} />
            <SidebarLink to="/perfil"       label="Mi Perfil"    icon={Icons.profile} />
          </>
        ) : (
          <>
            <SidebarLink to="/solicitar"  label="Nueva Solicitud" icon={Icons.sol} />
            <SidebarLink to="/mis-vales"  label="Mis Vales"       icon={Icons.myvales} />
            <SidebarLink to="/mi-perfil"  label="Mi Perfil"       icon={Icons.profile} />
          </>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <FotoAvatar user={user} size={30} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{user.nombre}</p>
            <p className="text-xs text-slate-400 truncate">{user.role === 'admin' ? user.cargo : 'Trabajador'}</p>
          </div>
          <button
            onClick={() => logout()}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 font-medium border border-slate-200 hover:border-red-300 rounded-md px-2 py-1"
          >
            Salir
          </button>
        </div>
      </div>
    </aside>
  )
}
