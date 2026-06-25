import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { solicitudesApi, evaluacionesApi } from '../../api'
import { addNotif } from '../../components/layout/Topbar'
import {
  Button, StatusBadge, CodigoTag, FichaBadge,
  Modal, StarsRating, Textarea, Field, Spinner, EmptyState
} from '../../components/ui'
import { fmt, fmtVale, fmtFechaCorta } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'
import ValeImprimible from '../../components/shared/ValeImprimible'
import type { Solicitud } from '../../types'

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export default function SolicitudesPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [valeModal, setValeModal] = useState<Solicitud | null>(null)
  const [ratingModal, setRatingModal] = useState<Solicitud | null>(null)
  const [dupeModal, setDupeModal] = useState<{ sol: Solicitud; dupes: string[] } | null>(null)
  const [rating, setRating]   = useState(3)
  const [comment, setComment] = useState('')

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => solicitudesApi.list(),
  })

  const aprobarMut = useMutation({
    mutationFn: ({ id, force }: { id: number; force?: boolean }) =>
      solicitudesApi.aprobar(id, force),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] })
      qc.invalidateQueries({ queryKey: ['items'] })
      addNotif(`Vale ${fmtVale(vars.id)} aprobado`, 'success')
      toast.success('Solicitud aprobada')
      setDupeModal(null)
      // Open rating dialog
      const sol = solicitudes.find(s => s.id === vars.id)
      if (sol?.user?.role === 'worker') { setRatingModal(sol); setRating(3); setComment('') }
    },
    onError: (err: any) => {
      // 409 = duplicate detected
      if (err.response?.status === 409) {
        const sol = solicitudes.find(s => s.id === err.config?.url?.split('/')?.[2])
        const dupes: string[] = err.response.data?.duplicados ?? []
        if (sol) setDupeModal({ sol, dupes })
      } else {
        toast.error(err.response?.data?.message ?? 'Error al aprobar')
      }
    }
  })

  const rechazarMut = useMutation({
    mutationFn: (id: number) => solicitudesApi.rechazar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] })
      toast.success('Solicitud rechazada')
    }
  })

  const evalMut = useMutation({
    mutationFn: (data: { evaluadoId: string; solicitudId: number; rating: number; comment: string; proyecto: string }) =>
      evaluacionesApi.create(data),
    onSuccess: () => { toast.success('Evaluación guardada'); setRatingModal(null) }
  })

  function checkDuplicate(sol: Solicitud) {
    const hoy = new Date().toDateString()
    const dupes = solicitudes
      .filter(s =>
        s.id !== sol.id &&
        s.status === 'approved' &&
        s.userId === sol.userId &&
        s.proyecto === sol.proyecto &&
        new Date(s.fecha).toDateString() === hoy &&
        s.items.some(si => sol.items.some(xi => xi.itemId === si.itemId))
      )
      .flatMap(s => s.items.map(si => si.item?.nombre).filter(Boolean) as string[])

    if (dupes.length > 0) {
      setDupeModal({ sol, dupes })
    } else {
      aprobarMut.mutate({ id: sol.id })
    }
  }

  function solTotal(sol: Solicitud) {
    let t = 0; let has = false
    sol.items.forEach(si => { if (si.precioSnapshot) { t += si.precioSnapshot * si.cantidad; has = true } })
    return has ? t : null
  }

  const visible = solicitudes.filter(s => filter === 'all' || s.status === filter)
  const pending = solicitudes.filter(s => s.status === 'pending').length

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: `Pendientes${pending > 0 ? ` (${pending})` : ''}` },
    { id: 'approved', label: 'Aprobadas' },
    { id: 'rejected', label: 'Rechazadas' },
  ]

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === f.id
                ? 'bg-brand-50 border-brand-400 text-brand-600 font-semibold'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N° Vale', 'Trabajador', 'Proyecto', 'Plano', 'N° Ficha', 'Fecha', 'Items', 'Total', 'Estado', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon="📋" message="Sin solicitudes" /></td></tr>
              ) : visible.slice().reverse().map(s => {
                const tot = solTotal(s)
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><CodigoTag code={fmtVale(s.id)} /></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-slate-700">{s.user?.nombre ?? '—'}</p>
                      <p className="text-xs text-slate-400">{s.user?.cargo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{s.proyecto}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{s.plano}</td>
                    <td className="px-4 py-3"><FichaBadge ficha={s.ficha} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtFechaCorta(s.fecha)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.items.length} art.</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">{tot ? fmt(tot) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Button size="sm" variant="ghost" className="mr-1" onClick={() => setValeModal(s)}>Ver vale</Button>
                      {s.status === 'pending' && (
                        <>
                          <Button
                            size="sm" variant="success" className="mr-1"
                            loading={aprobarMut.isPending}
                            onClick={() => checkDuplicate(s)}
                          >
                            ✓ Aprobar
                          </Button>
                          <Button
                            size="sm" variant="danger"
                            loading={rechazarMut.isPending}
                            onClick={() => { if (confirm('¿Rechazar esta solicitud?')) rechazarMut.mutate(s.id) }}
                          >
                            ✕
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Vale modal */}
      <Modal open={!!valeModal} onClose={() => setValeModal(null)} title={`Vale ${fmtVale(valeModal?.id ?? 0)}`} width="lg">
        {valeModal && <ValeImprimible solicitud={valeModal} esAdmin={true} />}
      </Modal>

      {/* Duplicate warning modal */}
      <Modal
        open={!!dupeModal}
        onClose={() => setDupeModal(null)}
        title="⚠️ Posible duplicado detectado"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDupeModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { rechazarMut.mutate(dupeModal!.sol.id); setDupeModal(null) }}>
              Rechazar solicitud
            </Button>
            <Button
              variant="primary"
              loading={aprobarMut.isPending}
              onClick={() => aprobarMut.mutate({ id: dupeModal!.sol.id, force: true })}
            >
              Aprobar de todas formas
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Este trabajador ya tiene una solicitud aprobada hoy para el mismo proyecto con estos insumos:
        </p>
        {dupeModal?.dupes.map((d, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2 text-sm">
            <span>⚠️</span> {d}
          </div>
        ))}
        <p className="text-xs text-slate-400 mt-3">Puedes aprobar igual si es correcto, o rechazar si es un error.</p>
      </Modal>

      {/* Rating modal */}
      <Modal
        open={!!ratingModal}
        onClose={() => setRatingModal(null)}
        title="Evaluar retiro"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRatingModal(null)}>Omitir</Button>
            <Button
              variant="primary"
              loading={evalMut.isPending}
              onClick={() => {
                if (!ratingModal?.user?.id) return
                evalMut.mutate({
                  evaluadoId: ratingModal.user.id,
                  solicitudId: ratingModal.id,
                  rating,
                  comment,
                  proyecto: ratingModal.proyecto,
                })
              }}
            >
              Guardar evaluación
            </Button>
          </>
        }
      >
        <div className="text-center mb-4">
          <p className="font-semibold text-slate-700">{ratingModal?.user?.nombre}</p>
          <p className="text-xs text-slate-400">Vale {fmtVale(ratingModal?.id ?? 0)} · {ratingModal?.proyecto}</p>
        </div>
        <Field label="Calificación">
          <div className="flex justify-center py-2">
            <StarsRating value={rating} onChange={setRating} size="lg" />
          </div>
        </Field>
        <Field label="Comentario (opcional)">
          <Textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Ej: Uso correcto de materiales, solicitó lo necesario..."
          />
        </Field>
      </Modal>
    </div>
  )
}
