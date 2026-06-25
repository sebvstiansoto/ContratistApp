import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { solicitudesApi, reportesApi } from '../../api'
import { Spinner, EmptyState } from '../../components/ui'

export default function CompararPage() {
  const [pA, setPA] = useState('')
  const [pB, setPB] = useState('')

  const { data: solicitudes = [] } = useQuery({ queryKey: ['solicitudes'], queryFn: () => solicitudesApi.list() })
  const proyectos = [...new Set(solicitudes.map(s => s.proyecto).filter(Boolean))].sort()

  const { data: cmp, isLoading } = useQuery({
    queryKey: ['comparar', pA, pB],
    queryFn: () => reportesApi.comparar(pA, pB),
    enabled: !!pA && !!pB && pA !== pB,
  })

  function WinVal({ a, b }: { a: number; b: number }) {
    if (a === b) return <div className="grid grid-cols-2 gap-1"><span className="font-semibold text-center">{a}</span><span className="font-semibold text-center">{b}</span></div>
    return (
      <div className="grid grid-cols-2 gap-1">
        <span className={`font-semibold text-center ${a>b?'text-green-600':'text-red-500'}`}>{a}</span>
        <span className={`font-semibold text-center ${b>a?'text-green-600':'text-red-500'}`}>{b}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[{label:'Proyecto A', val:pA, set:setPA}, {label:'Proyecto B', val:pB, set:setPB}].map(p => (
          <div key={p.label}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{p.label}</label>
            <select value={p.val} onChange={e => p.set(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 outline-none focus:border-brand-400">
              <option value="">— Seleccionar proyecto —</option>
              {proyectos.map(pr => <option key={pr} value={pr}>{pr}</option>)}
            </select>
          </div>
        ))}
      </div>

      {pA && pB && pA === pB && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">Selecciona dos proyectos distintos</div>}

      {!pA || !pB ? <EmptyState icon="📊" message="Selecciona dos proyectos para comparar" /> :
      isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div> :
      cmp && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100">
              <div className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Métrica</div>
              <div className="p-4 text-sm font-bold text-brand-600 border-l border-slate-100">{pA}</div>
              <div className="p-4 text-sm font-bold text-purple-600 border-l border-slate-100">{pB}</div>
            </div>
            {[
              { label: 'Solicitudes aprobadas', a: cmp.a?.totalSolicitudes??0, b: cmp.b?.totalSolicitudes??0 },
              { label: 'Unidades retiradas', a: cmp.a?.totalItems??0, b: cmp.b?.totalItems??0 },
              { label: 'Trabajadores', a: cmp.a?.trabajadores??0, b: cmp.b?.trabajadores??0 },
            ].map(row => (
              <div key={row.label} className="grid grid-cols-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <div className="p-4 text-sm text-slate-500">{row.label}</div>
                <div className="p-4 border-l border-slate-100 text-sm font-semibold text-slate-700">{row.a}</div>
                <div className="p-4 border-l border-slate-100 text-sm font-semibold text-slate-700">{row.b}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="font-semibold text-sm text-slate-700 mb-4">Consumo por categoría</p>
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              <span>Categoría</span><span className="text-center text-brand-500">{pA.slice(0,10)}</span><span className="text-center text-purple-500">{pB.slice(0,10)}</span>
            </div>
            {(cmp.categorias ?? []).map((c: any) => (
              <div key={c.categoria} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 last:border-0 text-sm items-center">
                <span className="text-slate-600 truncate">{c.categoria}</span>
                <span className={`text-center font-semibold ${c.a>c.b?'text-green-600':c.a<c.b?'text-red-500':'text-slate-500'}`}>{c.a} ud.</span>
                <span className={`text-center font-semibold ${c.b>c.a?'text-green-600':c.b<c.a?'text-red-500':'text-slate-500'}`}>{c.b} ud.</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400"><span className="text-green-600 font-semibold">Verde</span> = mayor cantidad · <span className="text-red-500 font-semibold">Rojo</span> = menor cantidad</p>
        </div>
      )}
    </div>
  )
}
