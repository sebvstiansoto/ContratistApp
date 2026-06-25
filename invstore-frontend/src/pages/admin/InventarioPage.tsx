import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { itemsApi } from '../../api'
import { downloadCSV } from '../../utils/format'
import { getCatColor, CATEGORIAS } from '../../utils/colors'
import { fmt } from '../../utils/format'
import {
  Button, Modal, Field, Input, Select, Spinner,
  CategoriaBadge, CodigoTag, EmptyState
} from '../../components/ui'
import type { Item, Categoria } from '../../types'

type SortCol = 'nombre' | 'codigo' | 'categoria' | 'stock' | 'precio'

const stockCls = (item: Item) =>
  item.stock <= item.threshold         ? 'text-red-600 font-bold'
  : item.stock <= item.threshold * 3   ? 'text-yellow-600 font-bold'
  : 'text-green-700 font-bold'

export default function InventarioPage() {
  const qc = useQueryClient()
  const [q, setQ]         = useState('')
  const [cat, setCat]     = useState<string>('all')
  const [sort, setSort]   = useState<SortCol>('nombre')
  const [dir, setDir]     = useState<1 | -1>(1)
  const [modal, setModal] = useState<'add' | 'edit' | 'foto' | null>(null)
  const [editing, setEditing] = useState<Item | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    nombre: '', codigo: '', spec: '', categoria: 'Fijaciones' as Categoria,
    stock: 20, precio: '', threshold: 5
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list(),
  })

  const createMut = useMutation({
    mutationFn: (fd: FormData) => itemsApi.create(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); closeModal(); toast.success('Insumo agregado') },
    onError: () => toast.error('Error al guardar')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) => itemsApi.update(id, fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); closeModal(); toast.success('Insumo actualizado') },
    onError: () => toast.error('Error al actualizar')
  })
  const deleteMut = useMutation({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['items'] }); toast.success('Insumo eliminado') },
    onError: () => toast.error('Error al eliminar')
  })

  function openAdd() {
    setEditing(null)
    setForm({ nombre: '', codigo: '', spec: '', categoria: 'Fijaciones', stock: 20, precio: '', threshold: 5 })
    setFotoPreview(null)
    setModal('add')
  }
  function openEdit(item: Item) {
    setEditing(item)
    setForm({
      nombre: item.nombre, codigo: item.codigo, spec: item.spec,
      categoria: item.categoria, stock: item.stock,
      precio: item.precio != null ? String(item.precio) : '',
      threshold: item.threshold,
    })
    setFotoPreview(item.foto ?? null)
    setModal('edit')
  }
  function closeModal() { setModal(null); setEditing(null); setFotoPreview(null) }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Foto máx 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function buildFormData() {
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('codigo', form.codigo)
    fd.append('spec', form.spec)
    fd.append('categoria', form.categoria)
    fd.append('stock', String(form.stock))
    fd.append('threshold', String(form.threshold))
    if (form.precio) fd.append('precio', form.precio)
    const file = fileRef.current?.files?.[0]
    if (file) fd.append('foto', file)
    return fd
  }

  function handleSave() {
    if (!form.nombre || !form.codigo) { toast.error('Nombre y código son requeridos'); return }
    const fd = buildFormData()
    if (editing) updateMut.mutate({ id: editing.id, fd })
    else createMut.mutate(fd)
  }

  function handleDelete(item: Item) {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return
    deleteMut.mutate(item.id)
  }

  function handleSort(col: SortCol) {
    if (sort === col) setDir(d => d === 1 ? -1 : 1)
    else { setSort(col); setDir(1) }
  }

  function exportar() {
    const rows: (string | number | null)[][] = [['Codigo', 'Nombre', 'Spec', 'Categoria', 'Stock', 'Precio']]
    visible.forEach(i => rows.push([i.codigo, i.nombre, i.spec, i.categoria, i.stock, i.precio ?? '']))
    downloadCSV(rows, 'inventario')
    toast.success('Exportando...')
  }

  const SortArrow = ({ col }: { col: SortCol }) =>
    sort === col ? <span className="text-brand-500 ml-0.5">{dir === 1 ? '↑' : '↓'}</span> : null

  // Filter + sort
  let visible = items.filter(i => {
    const mc = cat === 'all' || i.categoria === cat
    const mq = !q || `${i.nombre} ${i.codigo} ${i.spec}`.toLowerCase().includes(q)
    return mc && mq
  })
  visible = [...visible].sort((a, b) => {
    const av = a[sort] ?? ''
    const bv = b[sort] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })

  const categories = [...new Set(items.map(i => i.categoria))].sort()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-bold text-slate-700">
          Inventario <span className="text-slate-400 font-normal text-sm">{visible.length}/{items.length}</span>
        </h2>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <input
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10"
              placeholder="Buscar insumo..."
              value={q}
              onChange={e => setQ(e.target.value.toLowerCase())}
            />
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm">🔍</span>
          </div>
          <Button variant="export" size="sm" onClick={exportar}>↓ Exportar</Button>
          <Button variant="primary" size="sm" onClick={openAdd}>+ Agregar</Button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setCat('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${cat === 'all' ? 'bg-brand-50 border-brand-400 text-brand-600 font-semibold' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'}`}
        >
          Todos
        </button>
        {categories.map(c => {
          const { c: color, bg } = getCatColor(c)
          return (
            <button
              key={c}
              onClick={() => setCat(c === cat ? 'all' : c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${cat === c ? 'font-semibold' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
              style={cat === c ? { background: bg, color, borderColor: color } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat === c ? color : '#94a3b8' }} />
              {c}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="w-10 px-3 py-3" />
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('nombre')}>
                  Insumo <SortArrow col="nombre" />
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3">Spec</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('codigo')}>
                  Código <SortArrow col="codigo" />
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('categoria')}>
                  Categoría <SortArrow col="categoria" />
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('stock')}>
                  Stock <SortArrow col="stock" />
                </th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('precio')}>
                  Precio <SortArrow col="precio" />
                </th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon="📦" message="Sin resultados" /></td></tr>
              ) : visible.map(item => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3">
                    {item.foto ? (
                      <img
                        src={item.foto}
                        alt={item.nombre}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => { setEditing(item); setModal('foto') }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-base">📦</div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium text-sm text-slate-800">{item.nombre}</td>
                  <td className="px-3 py-3 text-xs text-slate-400 max-w-[130px] truncate">{item.spec || '—'}</td>
                  <td className="px-3 py-3"><CodigoTag code={item.codigo} /></td>
                  <td className="px-3 py-3"><CategoriaBadge cat={item.categoria} /></td>
                  <td className="px-3 py-3">
                    <span className={stockCls(item)}>{item.stock}</span>
                    <span className="text-xs text-slate-400 ml-1">ud.</span>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-green-700">{fmt(item.precio)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Button size="sm" variant="ghost" className="mr-1" onClick={() => openEdit(item)}>Editar</Button>
                    <Button size="sm" variant="danger" loading={deleteMut.isPending} onClick={() => handleDelete(item)}>✕</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modal === 'add' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'add' ? 'Agregar insumo' : 'Editar insumo'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button
              variant="primary"
              loading={createMut.isPending || updateMut.isPending}
              onClick={handleSave}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-0">
          <Field label="Nombre" required>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Perno Hexag Galva" />
          </Field>
          <Field label="Especificación">
            <Input value={form.spec} onChange={e => setForm(f => ({ ...f, spec: e.target.value }))} placeholder="Ej: M 16 X 60" />
          </Field>
          <Field label="Código" required>
            <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ej: 4574" />
          </Field>
          <Field label="Categoría">
            <Select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Stock">
              <Input type="number" min={0} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} />
            </Field>
            <Field label="Precio ($)">
              <Input type="number" min={0} value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="Opcional" />
            </Field>
            <Field label="Umbral">
              <Input type="number" min={1} value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: +e.target.value }))} />
            </Field>
          </div>
          <Field label="Foto (opcional)">
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition-colors relative"
              onClick={() => fileRef.current?.click()}
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="preview" className="max-h-32 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="text-slate-400">
                  <p className="text-2xl mb-1">🖼️</p>
                  <p className="text-xs">Clic para subir foto del insumo</p>
                  <p className="text-xs mt-0.5 text-slate-300">JPG, PNG — máx 2MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </div>
            {fotoPreview && (
              <button className="text-xs text-red-500 mt-1 hover:underline" onClick={() => { setFotoPreview(null); if (fileRef.current) fileRef.current.value = '' }}>
                Quitar foto
              </button>
            )}
          </Field>
        </div>
      </Modal>

      {/* Foto viewer modal */}
      <Modal open={modal === 'foto'} onClose={closeModal} title={editing?.nombre ?? ''} width="sm">
        {editing?.foto && <img src={editing.foto} alt={editing.nombre} className="w-full rounded-xl object-contain max-h-96" />}
      </Modal>
    </div>
  )
}
