import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { solicitudesApi, itemsApi } from '../../api'
import { getCatColor } from '../../utils/colors'
import { Button, CodigoTag, Input, Field, Spinner } from '../../components/ui'
import { addNotif } from '../../components/layout/Topbar'
import { fmtVale } from '../../utils/format'
import type { Item } from '../../types'

interface SolRow { itemId: number | null; qty: number }

// ── Item Searcher ──────────────────────────────────────────
function ItemSearcher({
  index,
  row,
  items,
  onChange,
  onClear,
}: {
  index: number
  row: SolRow
  items: Item[]
  onChange: (id: number) => void
  onClear: () => void
}) {
  const [q, setQ]           = useState('')
  const [open, setOpen]     = useState(false)
  const [focused, setFoc]   = useState(-1)
  const inputRef            = useRef<HTMLInputElement>(null)
  const ddRef               = useRef<HTMLDivElement>(null)

  const selected = row.itemId ? items.find(i => i.id === row.itemId) : null

  const results = q.trim()
    ? items.filter(i => `${i.nombre} ${i.codigo} ${i.spec}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12)
    : []

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ddRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleKey(e: React.KeyboardEvent) {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFoc(f => Math.min(f + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFoc(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && focused >= 0) { e.preventDefault(); onChange(results[focused].id); setOpen(false); setQ('') }
    if (e.key === 'Escape') setOpen(false)
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
        {selected.foto
          ? <img src={selected.foto} alt={selected.nombre} className="w-8 h-8 rounded-lg object-cover border border-brand-200 flex-shrink-0" />
          : <div className="w-8 h-8 rounded-lg bg-white border border-brand-200 flex items-center justify-center text-sm flex-shrink-0">📦</div>
        }
        <span className="flex-1 text-sm font-medium text-slate-700 truncate min-w-0">
          {selected.nombre}{selected.spec ? ` — ${selected.spec}` : ''}
        </span>
        <CodigoTag code={selected.codigo} />
        <button onClick={onClear} className="text-slate-400 hover:text-red-500 font-bold ml-1 flex-shrink-0">✕</button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ddRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); setFoc(-1) }}
          onFocus={() => { if (q) setOpen(true) }}
          onKeyDown={handleKey}
          placeholder="Buscar por nombre o código..."
          className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10 bg-white"
        />
        <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">🔍</span>
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
          {results.map((item, i) => {
            const { bg, c } = getCatColor(item.categoria)
            const stockLow = item.stock <= item.threshold
            return (
              <button
                key={item.id}
                onMouseDown={() => { onChange(item.id); setOpen(false); setQ('') }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-slate-100 last:border-0 transition-colors ${i === focused ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
              >
                {item.foto
                  ? <img src={item.foto} alt={item.nombre} className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-sm flex-shrink-0">📦</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{item.nombre}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: bg, color: c }}>{item.categoria}</span>
                    {item.spec && <span className="text-xs text-slate-400">{item.spec}</span>}
                    <span className="font-mono text-xs text-brand-600 bg-slate-50 border border-slate-200 px-1 py-0.5 rounded">{item.codigo}</span>
                    <span className={`text-xs font-semibold ${stockLow ? 'text-red-600' : 'text-green-700'}`}>{item.stock} disp.</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Solicitar Page ──────────────────────────────────────────
export default function SolicitarPage() {
  const navigate = useNavigate()
  const [proyecto, setProyecto] = useState('')
  const [plano, setPlano]       = useState('')
  const [ficha, setFicha]       = useState('')
  const [rows, setRows]         = useState<SolRow[]>([{ itemId: null, qty: 1 }])
  const [errors, setErrors]     = useState({ proyecto: false, plano: false, ficha: false })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  })

  const createMut = useMutation({
    mutationFn: (data: Parameters<typeof solicitudesApi.create>[0]) => solicitudesApi.create(data),
    onSuccess: (sol) => {
      addNotif(`Nueva solicitud ${fmtVale(sol.id)} enviada`, 'pending')
      toast.success(`Solicitud ${fmtVale(sol.id)} enviada`)
      setRows([{ itemId: null, qty: 1 }])
      setProyecto(''); setPlano(''); setFicha('')
      navigate('/mis-vales')
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error al enviar')
  })

  function setRowItem(i: number, id: number) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, itemId: id } : row))
  }
  function clearRow(i: number) {
    setRows(r => r.map((row, idx) => idx === i ? { itemId: null, qty: 1 } : row))
  }
  function setRowQty(i: number, qty: number) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, qty: Math.max(1, qty) } : row))
  }
  function addRow() { setRows(r => [...r, { itemId: null, qty: 1 }]) }
  function removeRow(i: number) { setRows(r => r.filter((_, idx) => idx !== i)) }

  function handleSubmit() {
    const err = { proyecto: !proyecto.trim(), plano: !plano.trim(), ficha: !ficha.trim() }
    setErrors(err)
    if (err.proyecto || err.plano || err.ficha) { toast.error('Ingresa N° Proyecto, N° Plano y N° Ficha'); return }

    const validRows = rows.filter(r => r.itemId)
    if (!validRows.length) { toast.error('Selecciona al menos un insumo'); return }

    // Check stock
    for (const r of validRows) {
      const item = items.find(i => i.id === r.itemId)
      if (item && r.qty > item.stock) { toast.error(`${item.nombre}: solo hay ${item.stock} ud.`); return }
    }

    createMut.mutate({
      proyecto: proyecto.trim(),
      plano: plano.trim(),
      ficha: ficha.trim(),
      items: validRows.map(r => ({ itemId: r.itemId!, cantidad: r.qty })),
    })
  }

  const validRows = rows.filter(r => r.itemId)

  return (
    <div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
          <Field label="N° Proyecto" required error={errors.proyecto ? 'Requerido' : undefined}>
            <Input
              value={proyecto}
              onChange={e => { setProyecto(e.target.value); setErrors(e2 => ({ ...e2, proyecto: false })) }}
              placeholder="Ej: 90-193"
              error={errors.proyecto}
            />
          </Field>
          <Field label="N° Plano" required error={errors.plano ? 'Requerido' : undefined}>
            <Input
              value={plano}
              onChange={e => { setPlano(e.target.value); setErrors(e2 => ({ ...e2, plano: false })) }}
              placeholder="Ej: PL-2024-001"
              error={errors.plano}
            />
          </Field>
          <Field label="N° Ficha Contratista" required error={errors.ficha ? 'Requerido' : undefined}>
            <Input
              value={ficha}
              onChange={e => { setFicha(e.target.value); setErrors(e2 => ({ ...e2, ficha: false })) }}
              placeholder="Ej: FC-2024-0042"
              error={errors.ficha}
            />
          </Field>
        </div>

        {/* Info hint */}
        <div className="bg-brand-50 border-l-4 border-brand-500 rounded-r-xl px-4 py-3 mb-5 text-sm text-brand-700">
          Busca y selecciona los insumos. Navega con ↑ ↓ y selecciona con Enter.
        </div>

        {/* Rows */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="text-brand-500" /></div>
        ) : (
          <div className="flex flex-col gap-3 mb-3">
            {rows.map((row, i) => (
              <div key={i} className="grid items-start gap-3" style={{ gridTemplateColumns: '1fr 80px auto' }}>
                <ItemSearcher
                  index={i}
                  row={row}
                  items={items}
                  onChange={id => setRowItem(i, id)}
                  onClear={() => clearRow(i)}
                />
                <input
                  type="number"
                  min={1}
                  value={row.qty}
                  disabled={!row.itemId}
                  onChange={e => setRowQty(i, parseInt(e.target.value) || 1)}
                  className="w-full py-2.5 px-2 text-center border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-brand-400 disabled:opacity-40 disabled:bg-slate-50"
                  placeholder="Cant."
                />
                {rows.length > 1 ? (
                  <button onClick={() => removeRow(i)} className="w-8 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:border-red-400 hover:text-red-500 transition-colors">✕</button>
                ) : <span />}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={addRow}
          className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400 hover:text-brand-500 font-medium transition-colors mb-5"
        >
          + Agregar otro insumo
        </button>

        {/* Summary */}
        {validRows.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Resumen</p>
            {validRows.map((r, i) => {
              const item = items.find(it => it.id === r.itemId)
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0 text-sm">
                  <span className="text-slate-700">{item?.nombre}{item?.spec ? ` — ${item.spec}` : ''}</span>
                  <span className="font-semibold text-slate-600">{r.qty} ud.</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => { setRows([{ itemId: null, qty: 1 }]); setProyecto(''); setPlano(''); setFicha('') }}>
            Limpiar
          </Button>
          <Button variant="primary" loading={createMut.isPending} onClick={handleSubmit}>
            Enviar solicitud
          </Button>
        </div>
      </div>
    </div>
  )
}
