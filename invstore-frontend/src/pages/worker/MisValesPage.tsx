import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { solicitudesApi } from '../../api'
import { StatusBadge, CodigoTag, FichaBadge, Modal, Button, Spinner, EmptyState } from '../../components/ui'
import ValeImprimible from '../../components/shared/ValeImprimible'
import { fmtVale, fmtFechaCorta } from '../../utils/format'
import type { Solicitud } from '../../types'

export default function MisValesPage() {
  const navigate = useNavigate()
  const [valeModal, setValeModal] = useState<Solicitud | null>(null)

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['mis-solicitudes'],
    queryFn: () => solicitudesApi.list(),
  })

  const reversed = [...solicitudes].reverse()

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div>
        ) : reversed.length === 0 ? (
          <EmptyState icon="📄" message="Aun no tienes vales"
            action={<Button variant="primary" size="sm" onClick={() => navigate('/solicitar')}>Solicitar insumos</Button>} />
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N Vale','Proyecto','Plano','N Ficha','Fecha','Items','Estado',''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reversed.map(s => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3"><CodigoTag code={fmtVale(s.id)} /></td>
                  <td className="px-4 py-3 font-medium text-sm">{s.proyecto}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{s.plano}</td>
                  <td className="px-4 py-3"><FichaBadge ficha={s.ficha} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtFechaCorta(s.fecha)}</td>
                  <td className="px-4 py-3 text-sm">{s.items.length} art.</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => setValeModal(s)}>Ver vale</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Modal open={!!valeModal} onClose={() => setValeModal(null)} title={`Vale ${fmtVale(valeModal?.id ?? 0)}`} width="lg">
        {valeModal && <ValeImprimible solicitud={valeModal} esAdmin={false} />}
      </Modal>
    </div>
  )
}
