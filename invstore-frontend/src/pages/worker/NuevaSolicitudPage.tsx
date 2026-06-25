import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { itemsApi, solicitudesApi } from '../../api'
import { addNotif } from '../../components/layout/Topbar'
import { getCatColor } from '../../utils/colors'
import { Button, Input, Field, Spinner, CodigoTag, Alert } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'
import type { Item } from '../../types'

interface Row { itemId: number | null; qty: number }

function ItemSearchRow({
  index, row, items, onSelect, onQtyChange, onRemove, canRemove
}: {
  index: number
  row: Row
  items: Item[]
  onSelect: (i: number, itemId: number) => void
  onQtyChange: (i: number, qty: number) => void
  onRemove: (i: number) => void
  canRemove: boolean
}) {
  const [q, setQ]             = useState('')
  const [open, setOpen]       = useState(false)
  const [focusIdx, setFocIdx] = useState(-1)
  const inputRef              = useRef<HTMLInputElement>(null)
  const ddRef                 = useRef<HTMLDivElement>(null)

  const selectedItem = row.itemId ? items.find(i => i.id === row.itemId) : null

  const filtered = q.trim()
    ? items
        .filter(i => `${i.nombre} ${i.codigo} ${i.spec}`.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 14)
    : []

  function select(item: Item) {
    onSelect(index, item.id)
    setQ('')
    setOpen(false)
    setFocIdx(-1)
  }

  function clear() {
    onSelect(index, 0)
    setQ('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocIdx(f => Math.min(f + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocIdx(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); select(filtered[focusIdx]) }
    if (e.key === 'Escape') setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ddRef.current?.contains(e.target as Node) && e.target !== inputRef.current) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 80px 34px' }}>
      {/* Search + selected tag */}
      <div className="flex flex-col gap-1.5">
        {/* Search input — shown when no item selected */}
        {!selectedItem && (
          <div className="relative">
            <div className="absolute left-2.5 top-2.5 text-slate-400 text-sm pointer-events-none">🔍</div>
            <input
              ref={inputRef}
              type="text"
              value={q}
              placeholder="Buscar por nombre o código..."
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10"
              onChange={e => { setQ(e.target.value); setOpen(true); setFocIdx(-1) }}
              onFocus={() => { if (q.trim()) setOpen(true) }}
              onKeyDown={handleKey}
              autoComplete="off"
            />
            {/* Dropdown */}
            {open && filtered.length > 0 && (
              <div
                ref={ddRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto"
              >
                {filtered.map((item, fi) => {
                  const { bg, c } = getCatColor(item.categoria)
                  const isLow = item.stock <= item.threshold
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => select(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-slate-100 last:border-0 transition-colors ${
                        fi === focusIdx ? 'bg-brand-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Foto or placeholder */}
                      {item.foto ? (
                        <img src={item.foto} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-base flex-shrink-0">📦</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{item.nombre}</p>
                        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: bg, color: c }}>
                            {item.categoria}
                          </span>
                          {item.spec && <span className="text-xs text-slate-400">{item.spec}</span>}
                          <CodigoTag code={item.codigo} />
                          <span className={`text-xs font-semibold ${isLow ? 'text-red-600' : 'text-green-700'}`}>
                            {item.stock} disp.
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected item tag */}
        {selectedItem && (
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg">
            {selectedItem.foto ? (
              <img src={selectedItem.foto} alt="" className="w-7 h-7 rounded object-cover border border-slate-200 flex-shrink-0" />
            ) : (
              <span className="text-base flex-shrink-0">📦</span>
            )}
            <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">
              {selectedItem.nombre}{selectedItem.spec && ` — ${selectedItem.spec}`}
            </span>
            <CodigoTag code={selectedItem.codigo} />
            <button
              type="button"
              onClick={clear}
              className="text-slate-400 hover:text-red-500 text-sm ml-1 flex-shrink-0 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Qty input */}
      <input
        type="number"
        min={1}
        value={row.qty}
        disabled={!selectedItem}
        onChange={e => onQtyChange(index, Math.max(1, parseInt(e.target.value) || 1))}
        className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center font-semibold text-slate-700 outline-none focus:border-brand-400 disabled:opacity-40 disabled:bg-slate-50"
        placeholder="Cant."
      />

      {/* Remove button */}
      {canRemove ? (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-8 h-9 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:border-red-400 hover:text-red-500 transition-colors text-sm"
        >
          ✕
        </button>
      ) : <span />}
    </div>
  )
}

export default function NuevaSolicitudPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [rows, setRows]   = useState<Row[]>([{ itemId: null, qty: 1 }])
  const [proy, setProy]   = useState('')
  const [plano, setPlano] = useState('')
  const [ficha, setFicha] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  })

  const createMut = useMutation({
    mutationFn: solicitudesApi.create,
    onSuccess: (sol) => {
      addNotif(`Nueva solicitud #${String(sol.id).padStart(4,'0')} de ${user?.nombre} — Proyecto: ${proy}`, 'pending')
      toast.success(`Solicitud #${String(sol.id).padStart(4,'0')} enviada`)
      navigate('/mis-vales')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Error al enviar')
  })

  function selectItem(i: number, itemId: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, itemId: itemId || null } : r))
  }
  function changeQty(i: number, qty: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, qty } : r))
  }
  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }
  function addRow() {
    setRows(prev => [...prev, { itemId: null, qty: 1 }])
  }
  function reset() {
    setRows([{ itemId: null, qty: 1 }])
    setProy(''); setPlano(''); setFicha(''); setErrors({})
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!proy.trim())  e.proy  = 'Requerido'
    if (!plano.trim()) e.plano = 'Requerido'
    if (!ficha.trim()) e.ficha = 'Requerido'
    const valid = rows.filter(r => r.itemId)
    if (!valid.length) e.items = 'Selecciona al menos un insumo'
    // Stock check
    for (const r of valid) {
      const item = items.find(i => i.id === r.itemId)
      if (item && r.qty > item.stock) {
        e.items = `${item.nombre}: solo hay ${item.stock} ud. disponibles`
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    createMut.mutate({
      proyecto: proy.trim(),
      plano: plano.trim(),
      ficha: ficha.trim(),
      items: rows.filter(r => r.itemId).map(r => ({ itemId: r.itemId!, cantidad: r.qty })),
    })
  }

  // Summary — no prices for workers
  const selected = rows.filter(r => r.itemId)

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={submit}>
          {/* Header fields */}
          <div className="grid grid-cols-3 gap-3 mb-6 pb-5 border-b border-slate-100">
            <Field label="N° Proyecto" required error={errors.proy}>
              <Input
                value={proy}
                onChange={e => { setProy(e.target.value); setErrors(v => ({ ...v, proy: '' })) }}
                placeholder="Ej: 90-193"
                error={!!errors.proy}
              />
            </Field>
            <Field label="N° Plano" required error={errors.plano}>
              <Input
                value={plano}
                onChange={e => { setPlano(e.target.value); setErrors(v => ({ ...v, plano: '' })) }}
                placeholder="Ej: PL-2024-001"
                error={!!errors.plano}
              />
            </Field>
            <Field label="N° Ficha Contratista" required error={errors.ficha}>
              <Input
                value={ficha}
                onChange={e => { setFicha(e.target.value); setErrors(v => ({ ...v, ficha: '' })) }}
                placeholder="Ej: FC-0042"
                error={!!errors.ficha}
              />
            </Field>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 px-3.5 py-3 bg-brand-50 border-l-4 border-brand-500 rounded-r-xl mb-5 text-sm text-brand-700">
            <span className="mt-0.5">💡</span>
            Busca los insumos por nombre o código. Navega con ↑↓ y selecciona con Enter.
          </div>

          {/* Item rows */}
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner className="text-brand-500" /></div>
          ) : (
            <div className="flex flex-col gap-3 mb-3">
              {rows.map((row, i) => (
                <ItemSearchRow
                  key={i}
                  index={i}
                  row={row}
                  items={items}
                  onSelect={selectItem}
                  onQtyChange={changeQty}
                  onRemove={removeRow}
                  canRemove={rows.length > 1}
                />
              ))}
            </div>
          )}

          {errors.items && <p className="text-xs text-red-500 mb-3">⚠️ {errors.items}</p>}

          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 font-medium hover:border-brand-400 hover:text-brand-500 transition-colors mb-5"
          >
            + Agregar otro insumo
          </button>

          {/* Summary (no prices for workers) */}
          {selected.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Resumen de solicitud</p>
              {selected.map((r, i) => {
                const item = items.find(it => it.id === r.itemId)
                if (!item) return null
                return (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0 text-sm">
                    <span className="text-slate-700 truncate flex-1 mr-2">
                      {item.nombre}
                      {item.spec && <span className="text-slate-400 text-xs ml-1">{item.spec}</span>}
                    </span>
                    <span className="text-slate-600 font-semibold flex-shrink-0">{r.qty} ud.</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={reset}>Limpiar</Button>
            <Button type="submit" variant="primary" loading={createMut.isPending}>
              Enviar solicitud
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
