import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { itemsApi, bodegaApi } from '../../api'
import { CategoriaBadge, CodigoTag, Spinner, EmptyState } from '../../components/ui'
import { getCatColor } from '../../utils/colors'

export default function BodegaPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [qtys, setQtys] = useState<Record<number, number>>({})

  const { data: items = [], isLoading } = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.list() })
  const { data: log = [] } = useQuery({ queryKey: ['bodega-log'], queryFn: () => bodegaApi.log() })

  const ingrMut = useMutation({
    mutationFn: ({ itemId, cantidad }: { itemId: number; cantidad: number }) => bodegaApi.ingresar({ itemId, cantidad }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['bodega-log'] })
      const item = items.find(i => i.id === vars.itemId)
      toast.success(`+${vars.cantidad} ud. agregadas a ${item?.nombre}`)
      setQtys(q => ({ ...q, [vars.itemId]: 1 }))
    },
    onError: () => toast.error('Error al ingresar stock')
  })

  const cats = [...new Set(items.map(i => i.categoria))].sort()
  const visible = items.filter(i => (cat === 'all' || i.categoria === cat) && (!q || `${i.nombre} ${i.codigo}`.toLowerCase().includes(q)))

  const stockCls = (i: typeof items[0]) => i.stock <= i.threshold ? 'text-red-600 font-bold' : i.stock <= i.threshold * 3 ? 'text-yellow-600 font-bold' : 'text-green-700 font-bold'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:'linear-gradient(135deg,#2f9e44,#0ca678)'}}>📦</div>
          <div><p className="font-bold text-slate-800">Ingreso de mercaderia</p><p className="text-xs text-slate-400">Suma unidades al stock cuando llega material a bodega</p></div>
        </div>
        <div className="flex gap-2 flex-wrap mb-4 items-center">
          <div className="relative"><span className="absolute left-2.5 top-2.5 text-sm text-slate-400">🔍</span><input className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-brand-400" placeholder="Buscar insumo..." value={q} onChange={e => setQ(e.target.value.toLowerCase())} /></div>
          <button className={`px-3 py-1.5 rounded-full text-xs font-medium border ${cat==='all'?'bg-brand-50 border-brand-400 text-brand-600':'bg-white border-slate-200 text-slate-500'}`} onClick={() => setCat('all')}>Todos</button>
          {cats.map(c => {
            const {c:color,bg} = getCatColor(c)
            return <button key={c} className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 ${cat===c?'font-semibold':'bg-white border-slate-200 text-slate-500'}`} style={cat===c?{background:bg,color,borderColor:color}:{}} onClick={() => setCat(c===cat?'all':c)}><span className="w-1.5 h-1.5 rounded-full" style={{background:cat===c?color:'#94a3b8'}} />{c}</button>
          })}
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {visible.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 bg-slate-50">
                  {item.foto ? <img src={item.foto} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{item.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5"><CodigoTag code={item.codigo} />{item.spec && <span className="text-xs text-slate-400">{item.spec}</span>}</div>
                </div>
                <span className={`text-sm flex-shrink-0 ${stockCls(item)}`}>{item.stock} ud.</span>
                <input type="number" min={1} value={qtys[item.id] ?? 1} onChange={e => setQtys(q => ({...q,[item.id]:Math.max(1,+e.target.value||1)}))} className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-semibold outline-none focus:border-brand-400" />
                <button onClick={() => ingrMut.mutate({itemId:item.id,cantidad:qtys[item.id]??1})} className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">+ Ingresar</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-bold text-slate-700 text-sm mb-4">📋 Registro de ingresos recientes</p>
        {log.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Sin ingresos registrados</p> : log.slice(0,12).map(l => {
          const item = items.find(i => i.id === l.itemId)
          return <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 text-sm">
            <span className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">+</span>
            <span className="flex-1 text-slate-700 font-medium">{item?.nombre ?? '—'}</span>
            <span className="text-green-700 font-bold">+{l.cantidad} ud.</span>
            <span className="text-xs text-slate-400">{new Date(l.fecha).toLocaleDateString('es-CL')}</span>
          </div>
        })}
      </div>
    </div>
  )
}
