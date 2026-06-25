import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportesApi } from '../../api'
import { Spinner, EmptyState, Button } from '../../components/ui'
import { downloadCSV } from '../../utils/format'
import toast from 'react-hot-toast'

function BarRow({ label, value, max, color = '#3b5bdb' }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p className="text-sm text-slate-600 w-40 flex-shrink-0 truncate" title={label}>{label}</p>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${max ? (value/max)*100 : 0}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-14 text-right flex-shrink-0">{value} ud.</span>
    </div>
  )
}

export default function ReportesPage() {
  const [mes, setMes] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['reportes', mes],
    queryFn: () => reportesApi.mensual(mes || undefined),
  })

  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    return `${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  })

  function exportar() {
    if (!data) return
    const rows: (string|number)[][] = [['Tipo','Nombre','Cantidad']]
    data.porCategoria.forEach(c => rows.push(['Categoria', c.categoria, c.qty]))
    data.porTrabajador.forEach(t => rows.push(['Trabajador', t.nombre, t.unidades]))
    data.porProyecto.forEach(p => rows.push(['Proyecto', p.proyecto, p.unidades]))
    downloadCSV(rows, 'reporte'); toast.success('Exportando...')
  }

  const maxCat = data?.porCategoria[0]?.qty ?? 1
  const maxW   = data?.porTrabajador[0]?.unidades ?? 1
  const maxP   = data?.porProyecto[0]?.unidades ?? 1

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="font-bold text-slate-700">Reporte {mes ? `— ${mes}` : 'Global'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Analisis de consumo de insumos</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${!mes?'bg-brand-50 border-brand-400 text-brand-600':'bg-white border-slate-200 text-slate-500'}`} onClick={() => setMes('')}>Todo</button>
          {meses.map(m => <button key={m} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${mes===m?'bg-brand-50 border-brand-400 text-brand-600':'bg-white border-slate-200 text-slate-500'}`} onClick={() => setMes(m)}>{m}</button>)}
          {data && <Button variant="export" size="sm" onClick={exportar}>↓ Exportar</Button>}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div> : !data ? <EmptyState icon="📊" message="Sin datos" /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { l:'Total solicitudes', v:data.totalSolicitudes, c:'#3b5bdb' },
              { l:'Aprobadas', v:data.aprobadas, c:'#2f9e44' },
              { l:'Pendientes', v:data.pendientes, c:'#e67700' },
              { l:'Unidades retiradas', v:data.totalUnidades, c:'#6741d9' },
            ].map(k => (
              <div key={k.l} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-2xl font-bold" style={{color:k.c}}>{k.v}</p>
                <p className="text-xs text-slate-400 mt-1">{k.l}</p>
              </div>
            ))}
          </div>

          {data.duplicados.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-sm text-yellow-700">
              <p className="font-semibold mb-2">⚠️ {data.duplicados.length} posible{data.duplicados.length!==1?'s':''} solicitud{data.duplicados.length!==1?'es':''} duplicada{data.duplicados.length!==1?'s':''}</p>
              {data.duplicados.map((d,i) => <p key={i} className="text-xs">• {d.worker} — {d.item} — {d.proyecto} — {d.fecha}</p>)}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="font-semibold text-sm text-slate-700 mb-4">📦 Por categoría</p>
              {data.porCategoria.slice(0,8).map(c => <BarRow key={c.categoria} label={c.categoria} value={c.qty} max={maxCat} color="#3b5bdb" />)}
              {data.porCategoria.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="font-semibold text-sm text-slate-700 mb-4">👷 Por trabajador</p>
              {data.porTrabajador.map(t => <BarRow key={t.nombre} label={t.nombre} value={t.unidades} max={maxW} color="#6741d9" />)}
              {data.porTrabajador.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="font-semibold text-sm text-slate-700 mb-4">📁 Por proyecto</p>
            {data.porProyecto.map(p => <BarRow key={p.proyecto} label={p.proyecto} value={p.unidades} max={maxP} color="#2f9e44" />)}
            {data.porProyecto.length === 0 && <p className="text-sm text-slate-400">Aprueba solicitudes para ver reportes aqui</p>}
          </div>
        </>
      )}
    </div>
  )
}
