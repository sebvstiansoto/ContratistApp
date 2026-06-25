import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { usersApi, evaluacionesApi, notasApi } from '../../api'
import { FotoAvatar, EstadoBadge, Modal, Button, Field, Input, Select, Textarea, Spinner, EmptyState, StarsRating } from '../../components/ui'
import type { User, Estado } from '../../types'

const ESTADOS: Estado[] = ['active','pause','leave','off']

export default function TrabajadoresPage() {
  const qc = useQueryClient()
  const [viewing, setViewing] = useState<User|null>(null)
  const [tab, setTab] = useState<'solicitudes'|'evaluaciones'|'notas'>('solicitudes')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState<User|null>(null)
  const [ratingModal, setRatingModal] = useState<User|null>(null)
  const [notaModal, setNotaModal] = useState<User|null>(null)
  const [rating, setRating] = useState(3)
  const [rComment, setRComment] = useState('')
  const [rProyecto, setRProyecto] = useState('')
  const [notaText, setNotaText] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)
  const [form, setForm] = useState({ nombre:'',cargo:'',user:'',password:'',especialidad:'',rut:'',telefono:'',estado:'active' as Estado })

  const { data: workers = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list('worker') })

  const createMut = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); setAddModal(false); toast.success('Trabajador agregado') },
    onError: (e:any) => toast.error(e.response?.data?.message ?? 'Error')
  })
  const updateMut = useMutation({
    mutationFn: ({id, fd}:{id:string;fd:FormData}) => usersApi.update(id, fd),
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); setEditModal(null); setPhotoPreview(null); toast.success('Perfil actualizado') },
    onError: () => toast.error('Error al actualizar')
  })
  const deleteMut = useMutation({
    mutationFn: (id:string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); setViewing(null); toast.success('Trabajador eliminado') }
  })
  const evalMut = useMutation({
    mutationFn: evaluacionesApi.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); setRatingModal(null); toast.success('Evaluacion guardada') }
  })
  const notaMut = useMutation({
    mutationFn: notasApi.create,
    onSuccess: () => { qc.invalidateQueries({queryKey:['users']}); setNotaModal(null); toast.success('Nota guardada') }
  })
  const delNotaMut = useMutation({
    mutationFn: (id:number) => notasApi.delete(id),
    onSuccess: () => qc.invalidateQueries({queryKey:['users']})
  })

  function avgRating(u: User) {
    if (!u.evaluaciones?.length) return null
    return u.evaluaciones.reduce((a,e) => a+e.rating, 0) / u.evaluaciones.length
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 2*1024*1024) { toast.error('Max 2MB'); return }
    const r = new FileReader(); r.onload = ev => setPhotoPreview(ev.target?.result as string); r.readAsDataURL(f)
  }

  function saveEdit() {
    if (!editModal) return
    const fd = new FormData()
    fd.append('nombre', form.nombre)
    fd.append('cargo', form.cargo)
    fd.append('especialidad', form.especialidad)
    fd.append('rut', form.rut)
    fd.append('telefono', form.telefono)
    fd.append('estado', form.estado)
    const file = photoRef.current?.files?.[0]
    if (file) fd.append('foto', file)
    updateMut.mutate({ id: editModal.id, fd })
  }

  if (viewing) {
    const avg = avgRating(viewing)
    return (
      <div>
        <button onClick={() => setViewing(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">← Volver a Trabajadores</button>
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-4 flex items-start gap-5 flex-wrap">
          <FotoAvatar user={viewing} size={72} />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800">{viewing.nombre}</h2>
            <p className="text-sm text-slate-400 mt-0.5 mb-3">{viewing.cargo} · <EstadoBadge estado={viewing.estado} /></p>
            <div className="flex flex-wrap gap-2 text-xs">
              {viewing.especialidad && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">⚙️ {viewing.especialidad}</span>}
              {viewing.rut && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">RUT: {viewing.rut}</span>}
              {viewing.telefono && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">📱 {viewing.telefono}</span>}
            </div>
            {avg != null && <div className="flex items-center gap-2 mt-3"><StarsRating value={Math.round(avg)} /><span className="font-bold text-slate-700">{avg.toFixed(1)}</span><span className="text-xs text-slate-400">({viewing.evaluaciones?.length} eval.)</span></div>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => { setEditModal(viewing); setForm({nombre:viewing.nombre,cargo:viewing.cargo,user:viewing.user,password:'',especialidad:viewing.especialidad??'',rut:viewing.rut??'',telefono:viewing.telefono??'',estado:viewing.estado??'active'}); setPhotoPreview(null) }}>✏️ Editar</Button>
            <Button size="sm" variant="danger" onClick={() => { if(confirm('¿Eliminar?')) deleteMut.mutate(viewing.id) }}>Eliminar</Button>
          </div>
        </div>
        <div className="flex gap-0 border-b border-slate-200 mb-5">
          {(['solicitudes','evaluaciones','notas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px capitalize ${tab===t?'border-brand-500 text-brand-600':'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t === 'notas' ? 'Notas internas' : t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'evaluaciones' && (
          <>
            <div className="flex justify-end mb-3"><Button size="sm" variant="primary" onClick={() => { setRatingModal(viewing); setRating(3); setRComment(''); setRProyecto('') }}>+ Nueva evaluacion</Button></div>
            {viewing.evaluaciones?.length === 0 ? <EmptyState icon="⭐" message="Sin evaluaciones" /> :
              viewing.evaluaciones?.slice().reverse().map(e => (
                <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
                  <div className="flex items-center justify-between mb-2"><StarsRating value={e.rating} /><span className="text-xs text-slate-400">{e.evaluador?.nombre} · {new Date(e.fecha).toLocaleDateString('es-CL')}</span></div>
                  {e.proyecto && <p className="text-xs text-slate-400 mb-1">Proyecto: {e.proyecto}</p>}
                  {e.comment && <p className="text-sm text-slate-600 italic">"{e.comment}"</p>}
                </div>
              ))
            }
          </>
        )}
        {tab === 'notas' && (
          <>
            <div className="flex justify-end mb-3"><Button size="sm" variant="primary" onClick={() => { setNotaModal(viewing); setNotaText('') }}>+ Agregar nota</Button></div>
            {viewing.notas?.length === 0 ? <EmptyState icon="📝" message="Sin notas internas" /> :
              viewing.notas?.slice().reverse().map(n => (
                <div key={n.id} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3">
                  <p className="text-sm text-slate-700">{n.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-yellow-600">🔒 Solo admins · {n.byNombre} · {new Date(n.fecha).toLocaleDateString('es-CL')}</p>
                    <button onClick={() => delNotaMut.mutate(n.id)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                  </div>
                </div>
              ))
            }
          </>
        )}
        {tab === 'solicitudes' && <EmptyState icon="📋" message="Ver solicitudes en la sección Solicitudes filtrando por trabajador" />}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-700">Trabajadores</h2>
        <Button variant="primary" size="sm" onClick={() => { setAddModal(true); setForm({nombre:'',cargo:'',user:'',password:'',especialidad:'',rut:'',telefono:'',estado:'active'}) }}>+ Agregar</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-500" /></div> :
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr className="border-b border-slate-100 bg-slate-50">
              {['Nombre','Cargo','Estado','Usuario','Solicitudes','Rating',''].map(h => <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {workers.length === 0 ? <tr><td colSpan={7}><EmptyState icon="👷" message="Sin trabajadores" /></td></tr> :
                workers.map(u => {
                  const avg = avgRating(u)
                  return (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><FotoAvatar user={u} size={30} /><div><p className="font-medium text-sm">{u.nombre}</p><p className="text-xs text-slate-400">{u.especialidad||u.cargo}</p></div></div></td>
                      <td className="px-4 py-3 text-sm text-slate-500">{u.cargo}</td>
                      <td className="px-4 py-3"><EstadoBadge estado={u.estado} /></td>
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-50 border border-slate-200 text-brand-600 font-semibold px-1.5 py-0.5 rounded">{u.user}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-500">—</td>
                      <td className="px-4 py-3">{avg!=null?<span className="text-yellow-500 font-bold">★ {avg.toFixed(1)}</span>:<span className="text-slate-300 text-xs">Sin eval.</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Button size="sm" variant="ghost" onClick={() => { setViewing(u); setTab('evaluaciones') }}>Ver ficha</Button></td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      }
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Agregar trabajador"
        footer={<><Button variant="ghost" onClick={() => setAddModal(false)}>Cancelar</Button><Button variant="primary" loading={createMut.isPending} onClick={() => createMut.mutate(form)}>Guardar</Button></>}>
        <div className="space-y-0">
          <Field label="Nombre"><Input value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} placeholder="Pedro Lopez" /></Field>
          <Field label="Cargo"><Input value={form.cargo} onChange={e => setForm(f=>({...f,cargo:e.target.value}))} placeholder="Electricista" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuario"><Input value={form.user} onChange={e => setForm(f=>({...f,user:e.target.value}))} placeholder="pl123" /></Field>
            <Field label="Contraseña"><Input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} /></Field>
          </div>
        </div>
      </Modal>
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar perfil"
        footer={<><Button variant="ghost" onClick={() => setEditModal(null)}>Cancelar</Button><Button variant="primary" loading={updateMut.isPending} onClick={saveEdit}>Guardar</Button></>}>
        <div className="text-center mb-4">
          <div className="relative inline-block cursor-pointer" onClick={() => photoRef.current?.click()}>
            <FotoAvatar user={{...editModal!, foto: photoPreview ?? editModal?.foto}} size={64} />
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">📷</span>
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div className="space-y-0">
          <Field label="Nombre"><Input value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} /></Field>
          <Field label="Cargo"><Input value={form.cargo} onChange={e => setForm(f=>({...f,cargo:e.target.value}))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Especialidad"><Input value={form.especialidad} onChange={e => setForm(f=>({...f,especialidad:e.target.value}))} /></Field>
            <Field label="RUT"><Input value={form.rut} onChange={e => setForm(f=>({...f,rut:e.target.value}))} placeholder="12.345.678-9" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefono"><Input value={form.telefono} onChange={e => setForm(f=>({...f,telefono:e.target.value}))} /></Field>
            <Field label="Estado"><Select value={form.estado} onChange={e => setForm(f=>({...f,estado:e.target.value as Estado}))}>{ESTADOS.map(s => <option key={s} value={s}>{{active:'Activo',pause:'En Pausa',leave:'Con Licencia',off:'Dado de Baja'}[s]}</option>)}</Select></Field>
          </div>
        </div>
      </Modal>
      <Modal open={!!ratingModal} onClose={() => setRatingModal(null)} title="Nueva evaluacion"
        footer={<><Button variant="ghost" onClick={() => setRatingModal(null)}>Cancelar</Button><Button variant="primary" loading={evalMut.isPending} onClick={() => evalMut.mutate({evaluadoId:ratingModal!.id,rating,comment:rComment,proyecto:rProyecto})}>Guardar</Button></>}>
        <div className="text-center mb-4"><p className="font-semibold">{ratingModal?.nombre}</p></div>
        <Field label="Calificacion"><div className="flex justify-center py-2"><StarsRating value={rating} onChange={setRating} size="lg" /></div></Field>
        <Field label="Proyecto"><Input value={rProyecto} onChange={e => setRProyecto(e.target.value)} placeholder="Ej: Proyecto 90-193" /></Field>
        <Field label="Comentario"><Textarea rows={3} value={rComment} onChange={e => setRComment(e.target.value)} placeholder="Describe el desempeno..." /></Field>
      </Modal>
      <Modal open={!!notaModal} onClose={() => setNotaModal(null)} title="Nota interna"
        footer={<><Button variant="ghost" onClick={() => setNotaModal(null)}>Cancelar</Button><Button variant="primary" loading={notaMut.isPending} onClick={() => notaMut.mutate({userId:notaModal!.id,text:notaText})}>Guardar nota</Button></>}>
        <p className="text-xs text-slate-400 mb-3">🔒 Solo visible para administradores</p>
        <Textarea rows={4} value={notaText} onChange={e => setNotaText(e.target.value)} placeholder="Ej: Solicita mas de lo necesario..." />
      </Modal>
    </div>
  )
}
