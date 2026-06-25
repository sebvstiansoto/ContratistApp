import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { historialApi } from '../../api'
import { CategoriaBadge, CodigoTag, FichaBadge, Spinner, EmptyState, Button } from '../../components/ui'
import { fmt, fmtFecha, downloadCSV } from '../../utils/format'
import toast from 'react-hot-toast'

export default function HistorialPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['historial'],
    queryFn: () => historialApi.list(),
  })

  function exportar() {
    const rows: (string|number|null)[][] = [['Fecha','Insumo','Codigo','Categoria','Cantidad','Precio','Subtotal','Trabajador','Proyecto','Plano','Ficha','Vale']]
    movimientos.forEach(m => rows.push([
      fmtFecha(m.fecha), m.item?.nombre??'—', m.item?.codigo??'—', m.item?.categoria??'—',
      m.cantidad, m.precio??'', m.precio?m.precio*m.cantidad:'',
      m.user?.nombre??'—', m.proyecto, m.plano, m.ficha, `#${String(m.solicitudId).padStart(4,'0')}`
    ]))
    downloadCSV(rows, 'historial')
    toast.success('Exportando...')
  }

  const cats = [...new Set(movimientos.map(m => m.item?.categoria).filter(Boolean))].sort()
  const visible = movimientos.filter(m => {
    const mc = cat === 'all' || m.item?.categoria === cat
    const mq = !q || `${m.item?.nombre??''} ${m.item?.codigo??''} ${m.proyecto} ${m.plano}`.toLowerCase().includes(q)
    return mc && mq
  }).reverse()

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-bold text-slate-700">Historial <span className="text-slate-400 font-normal text-sm">{visible.length} movimientos</span></h2>
        {movimientos.length > 0 && <Button variant="export" size="sm" onClick={exportar}>↓ Exportar</Button>}
      </div>
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        <div className="relative">
          <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">🔍</span>
          <input className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-brand-400" placeholder="Buscar insumo, proyecto..." value={q} onChange={e => setQ(e.target.value.toLowerCase())} />
        </div>
        <button className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${cat==='all'?'bg-brand-50 border-brand-400 text-brand-600':'bg-white border-slate-200 text-slate-500'}`} onClick={() => setCat('all')}>Todos</button>
        {cats.map(c => <button key={c} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${cat===c?'bg-brand-50 border-brand-400 text-brand-600':'bg-white border-slate-200 text-slate-500'}`} onClick={() => setCat(c ?? 'all')}>{c}</button>)}
      </div>
      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div> : visible.length === 0 ? (
        <EmptyState icon="📜" message="Sin movimientos aun" />
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(m => {
            const sub = m.precio ? m.precio * m.cantidad : null
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-base flex-shrink-0">📤</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800">{m.item?.nombre ?? 'Insumo eliminado'}{m.item?.spec && <span className="text-slate-400 font-normal"> — {m.item.spec}</span>}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-slate-400 items-center">
                    <span>👤 {m.user?.nombre ?? '—'}</span>
                    <span>📁 <strong className="text-slate-600">{m.proyecto}</strong></span>
                    <span>📐 {m.plano}</span>
                    {m.ficha && <FichaBadge ficha={m.ficha} />}
                    <span>🗓 {fmtFecha(m.fecha)}</span>
                    {m.item && <CategoriaBadge cat={m.item.categoria} />}
                    {m.item && <CodigoTag code={m.item.codigo} />}
                    <span className="font-mono">Vale #{String(m.solicitudId).padStart(4,'0')}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-red-600">−{m.cantidad} ud.</p>
                  {sub && <p className="text-xs text-slate-400 mt-0.5">{fmt(sub)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
