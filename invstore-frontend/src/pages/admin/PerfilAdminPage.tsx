import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { usersApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { FotoAvatar, EstadoBadge, StarsRating, Button, Field, Input, Modal } from '../../components/ui'

export default function PerfilAdminPage() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()
  const photoRef = useRef<HTMLInputElement>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ nombre:'', cargo:'', rut:'', telefono:'' })
  const [preview, setPreview] = useState<string|null>(null)

  const { data: workers = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list('worker') })

  const updateMut = useMutation({
    mutationFn: (fd: FormData) => usersApi.update(user!.id, fd),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setUser(updated)
      setEditOpen(false)
      setPreview(null)
      toast.success('Perfil actualizado')
    },
    onError: () => toast.error('Error al actualizar')
  })

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => {
      const src = ev.target?.result as string
      setPreview(src)
      // Update avatar immediately
      if (user) setUser({ ...user, foto: src })
    }; r.readAsDataURL(f)
  }

  function openEdit() {
    setForm({ nombre: user?.nombre??'', cargo: user?.cargo??'', rut: user?.rut??'', telefono: user?.telefono??'' })
    setPreview(null)
    setEditOpen(true)
  }

  function save() {
    const fd = new FormData()
    Object.entries(form).forEach(([k,v]) => fd.append(k, v))
    const file = photoRef.current?.files?.[0]
    if (file) fd.append('foto', file)
    updateMut.mutate(fd)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-5 flex-wrap">
        <div className="relative">
          <FotoAvatar user={user} size={72} />
          <button onClick={() => photoRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs border-2 border-white hover:bg-brand-700 transition-colors" title="Cambiar foto">📷</button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800">{user.nombre}</h2>
          <p className="text-sm text-slate-400 mt-0.5 mb-3">{user.cargo} · <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-200">Administrador</span></p>
          <div className="flex flex-wrap gap-2 text-xs">
            {user.rut && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">RUT: {user.rut}</span>}
            {user.telefono && <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">📱 {user.telefono}</span>}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={openEdit}>✏️ Editar perfil</Button>
      </div>

      {/* Team overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-semibold text-sm text-slate-700 mb-4">Equipo de trabajadores</p>
        {workers.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Sin trabajadores registrados</p> :
          workers.map(w => {
            const avg = w.evaluaciones?.length ? w.evaluaciones.reduce((a,e) => a+e.rating,0)/w.evaluaciones.length : null
            return (
              <div key={w.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                <FotoAvatar user={w} size={38} />
                <div className="flex-1"><p className="font-semibold text-sm">{w.nombre}</p><p className="text-xs text-slate-400">{w.cargo} · <EstadoBadge estado={w.estado} /></p></div>
                <div className="text-right">
                  {avg!=null ? <><StarsRating value={Math.round(avg)} size="sm" /><p className="text-xs text-yellow-600 font-bold">{avg.toFixed(1)}</p></> : <p className="text-xs text-slate-300">Sin eval.</p>}
                </div>
              </div>
            )
          })
        }
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil"
        footer={<><Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button><Button variant="primary" loading={updateMut.isPending} onClick={save}>Guardar</Button></>}>
        <Field label="Nombre"><Input value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} /></Field>
        <Field label="Cargo"><Input value={form.cargo} onChange={e => setForm(f=>({...f,cargo:e.target.value}))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="RUT"><Input value={form.rut} onChange={e => setForm(f=>({...f,rut:e.target.value}))} placeholder="12.345.678-9" /></Field>
          <Field label="Telefono"><Input value={form.telefono} onChange={e => setForm(f=>({...f,telefono:e.target.value}))} /></Field>
        </div>
      </Modal>
    </div>
  )
}
