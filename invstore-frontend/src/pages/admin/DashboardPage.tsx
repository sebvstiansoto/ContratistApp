import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { solicitudesApi, historialApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge, CodigoTag, Button, Spinner, Alert } from '../../components/ui'
import { fmt, fmtVale, fmtFechaCorta } from '../../utils/format'

function KPICard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string | number
  color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesApi.list(),
  })

  const pending  = solicitudes.filter(s => s.status === 'pending').length
  const approved = solicitudes.filter(s => s.status === 'approved').length
  const total    = solicitudes.length

  const recent = [...solicitudes].reverse().slice(0, 8)

  function solTotal(sol: typeof solicitudes[0]) {
    let t = 0; let has = false
    sol.items.forEach(si => {
      if (si.precioSnapshot) { t += si.precioSnapshot * si.cantidad; has = true }
    })
    return has ? t : null
  }

  return (
    <div>
      {/* Welcome card */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Bienvenido, <span className="text-brand-600">{user?.nombre}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Panel de control · {user?.cargo}</p>
        </div>
        <p className="text-xs text-slate-400">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" className="text-brand-500" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard icon="📦" label="Total insumos"   value="135" color="bg-brand-50"   sub="en catálogo" />
            <KPICard icon="📋" label="Pendientes"      value={pending}  color="bg-yellow-50" sub="por aprobar" />
            <KPICard icon="✅" label="Aprobadas"       value={approved} color="bg-green-50"  sub="vales emitidos" />
            <KPICard icon="📊" label="Total solicitudes" value={total}  color="bg-purple-50" sub="histórico" />
          </div>

          {/* Alerts */}
          {pending > 0 && (
            <Alert type="warn">
              <span>
                📋 <strong>{pending} solicitud{pending !== 1 ? 'es' : ''}</strong> esperando aprobación.
                <Button size="sm" variant="primary" className="ml-3" onClick={() => navigate('/solicitudes')}>
                  Ver ahora →
                </Button>
              </span>
            </Alert>
          )}

          {/* Recent solicitudes */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Solicitudes recientes</h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/solicitudes')}>Ver todas</Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">N° Vale</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Trabajador</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Proyecto</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Fecha</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">Sin solicitudes aún</td></tr>
                ) : recent.map(s => {
                  const tot = solTotal(s)
                  return (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><CodigoTag code={fmtVale(s.id)} /></td>
                      <td className="px-4 py-3 font-medium text-sm text-slate-700">
                        {s.user?.nombre ?? '—'}
                        <span className="block text-xs text-slate-400 font-normal">{s.user?.cargo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium">{s.proyecto}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{fmtFechaCorta(s.fecha)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-700">{tot ? fmt(tot) : '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
