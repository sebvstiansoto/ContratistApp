import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { solicitudesApi } from '../../api'
import { FotoAvatar, StarsRating, CodigoTag, FichaBadge, StatusBadge, Spinner } from '../../components/ui'
import { fmtVale, fmtFechaCorta } from '../../utils/format'

export default function MiPerfilPage() {
  const { user, setUser } = useAuthStore()
  const photoRef = useRef<HTMLInputElement>(null)

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['mis-solicitudes'],
    queryFn: () => solicitudesApi.list(),
  })

  if (!user) return null

  const appr = solicitudes.filter(s => s.status === 'approved').length
  const pend = solicitudes.filter(s => s.status === 'pending').length
  const projs = [...new Set(solicitudes.map(s => s.proyecto).filter(Boolean))]
  const evs = user.evaluaciones ?? []
  const avg = evs.length ? evs.reduce((a,e) => a+e.rating,0)/evs.length : null

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => {
      setUser({ ...user, foto: ev.target?.result as string })
    }; r.readAsDataURL(f)
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-5 flex-wrap">
        <div className="relative">
          <FotoAvatar user={user} size={72} />
          <button onClick={() => photoRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white hover:bg-green-700">📷</button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{user.nombre}</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-3">{user.cargo}</p>
          <div className="flex flex-wrap gap-2 text-xs mb-3">
            {user.especialidad && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">⚙️ {user.especialidad}</span>}
            {user.rut && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">RUT: {user.rut}</span>}
            {user.telefono && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">📱 {user.telefono}</span>}
          </div>
          {avg != null ? (
            <div className="flex items-center gap-2"><StarsRating value={Math.round(avg)} /><span className="font-bold">{avg.toFixed(1)}</span><span className="text-xs text-slate-400">({evs.length} evaluacion{evs.length!==1?'es':''})</span></div>
          ) : <p className="text-xs text-slate-400">Sin evaluaciones aun</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l:'Total solicitudes', v:solicitudes.length, c:'#3b5bdb' },
          { l:'Aprobadas', v:appr, c:'#2f9e44' },
          { l:'Pendientes', v:pend, c:'#e67700' },
          { l:'Proyectos', v:projs.length, c:'#6741d9' },
        ].map(k => (
          <div key={k.l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold" style={{color:k.c}}>{k.v}</p>
            <p className="text-xs text-slate-400 mt-1">{k.l}</p>
          </div>
        ))}
      </div>

      {/* Mis evaluaciones */}
      {evs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-sm text-slate-700 mb-4">Mis evaluaciones</p>
          {evs.slice().reverse().map(e => (
            <div key={e.id} className="border border-slate-100 rounded-xl p-4 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2"><StarsRating value={e.rating} /><span className="text-xs text-slate-400">{new Date(e.fecha).toLocaleDateString('es-CL')}</span></div>
              {e.proyecto && <p className="text-xs text-slate-400 mb-1">Proyecto: {e.proyecto}</p>}
              {e.comment && <p className="text-sm text-slate-600 italic">"{e.comment}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Proyectos */}
      {projs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-sm text-slate-700 mb-4">Proyectos participados</p>
          {projs.map(p => {
            const n = solicitudes.filter(s => s.proyecto === p).length
            return <div key={p} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-500"></span><span className="text-sm font-medium">{p}</span></div><span className="text-xs text-slate-400">{n} solicitud{n!==1?'es':''}</span></div>
          })}
        </div>
      )}
    </div>
  )
}
