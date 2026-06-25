import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { iaApi } from '../../api'
import { Button, Spinner, CodigoTag } from '../../components/ui'
import { getCatColor } from '../../utils/colors'
import { fmt } from '../../utils/format'
import type { IAMaterial } from '../../types'

export default function IAPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'texto'|'pdf'>('texto')
  const [prompt, setPrompt] = useState('')
  const [extra, setExtra]   = useState('')
  const [file, setFile]     = useState<File|null>(null)
  const [result, setResult] = useState<{resumen:string;materiales:IAMaterial[]}|null>(null)
  const [pending, setPending] = useState<{itemId:number;qty:number}[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const analizarMut = useMutation({
    mutationFn: iaApi.analizar,
    onSuccess: data => setResult(data),
    onError: () => toast.error('Error al analizar. Verifica la conexion.')
  })

  async function run() {
    if (mode === 'texto' && !prompt.trim()) { toast.error('Describe el proyecto primero'); return }
    if (mode === 'pdf' && !file) { toast.error('Sube un documento primero'); return }
    let contenido = prompt
    if (mode === 'pdf' && file) {
      contenido = await new Promise(res => { const r = new FileReader(); r.onload = e => res(String(e.target?.result??'')); r.readAsText(file) })
    }
    analizarMut.mutate({ modo: mode, contenido, extra })
  }

  function addItem(m: IAMaterial) {
    if (!m.catalogId) return
    setPending(p => {
      const exists = p.findIndex(x => x.itemId === m.catalogId)
      if (exists >= 0) return p.map((x,i) => i===exists?{...x,qty:x.qty+m.cantidadSugerida}:x)
      return [...p, { itemId: m.catalogId!, qty: m.cantidadSugerida }]
    })
    toast.success(`${m.nombre} agregado`)
  }

  function createAll() {
    const inCat = result?.materiales.filter(m => m.enCatalogo && m.catalogId) ?? []
    setPending(inCat.map(m => ({ itemId: m.catalogId!, qty: m.cantidadSugerida })))
    toast.success(`${inCat.length} insumos listos`)
    setTimeout(() => navigate('/solicitar'), 600)
  }

  const loadingMsgs = ['Analizando proyecto...','Buscando materiales...','Calculando cantidades...','Preparando presupuesto...']
  const [lIdx, setLIdx] = useState(0)

  const TIPS = ['Sé específico con las dimensiones y materiales (ej: tuberías DN50, inox)', 'Menciona el tipo de proyecto (piping, eléctrico, estructura)', 'Indica si hay restricciones de material o presupuesto']

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:'linear-gradient(135deg,#6741d9,#3b5bdb)'}}>🤖</div>
          <div><p className="font-bold text-slate-800">Asistente de Presupuesto con IA</p><p className="text-xs text-slate-400">Describe tu proyecto y la IA extrae los insumos del catalogo</p></div>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mb-5 border border-slate-200">
          {(['texto','pdf'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode===m?'bg-white text-brand-600 font-semibold shadow-sm':'text-slate-500'}`}>
              {m==='texto'?'📝 Descripcion de proyecto':'📄 Subir plano / memoria'}
            </button>
          ))}
        </div>

        {mode === 'texto' ? (
          <>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Describe el proyecto</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/10 resize-y" placeholder="Ej: Instalacion de linea de tuberias de agua fria en nave industrial. 150 metros lineales DN50, con 8 flanges de union, 4 curvas de 90 grados y 2 reducciones a DN32. Material inox..." />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {TIPS.map((t,i) => <span key={i} className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">💡 {t}</span>)}
            </div>
          </>
        ) : (
          <div className="mb-4">
            {file ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-3">
                <span className="text-xl">📄</span>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 transition-colors mb-3">
                <p className="text-3xl mb-2">📄</p>
                <p className="text-sm font-medium text-slate-600">Arrastra o haz clic para seleccionar</p>
                <p className="text-xs text-slate-400 mt-1">Memorias descriptivas, especificaciones tecnicas (TXT, PDF)</p>
                <input ref={fileRef} type="file" accept=".txt,.pdf" className="hidden" onChange={e => setFile(e.target.files?.[0]??null)} />
              </div>
            )}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Contexto adicional <span className="text-slate-300 font-normal">(opcional)</span></label>
          <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-brand-400 resize-none" placeholder="Ej: Solo material inox, presupuesto objetivo $2.000.000..." />
        </div>

        <button onClick={run} disabled={analizarMut.isPending} className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity" style={{background:'linear-gradient(135deg,#6741d9,#3b5bdb)'}}>
          {analizarMut.isPending ? <><Spinner size="sm" className="text-white" />Analizando...</> : <>🤖 {mode==='texto'?'Generar lista de materiales':'Analizar documento'}</>}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-brand-50 border-b border-slate-100">
              <p className="font-semibold text-sm text-slate-700">🤖 Lista de materiales</p>
              <p className="text-xs text-slate-400">{result.materiales.filter(m=>m.enCatalogo).length} en catálogo · {result.materiales.filter(m=>!m.enCatalogo).length} sin stock</p>
            </div>
            {result.resumen && <div className="px-4 py-3 bg-white border-b border-slate-100 text-sm text-slate-600 leading-relaxed">{result.resumen}</div>}
            <div className="p-4 space-y-2">
              {result.materiales.map((m,i) => {
                const {bg,c} = m.enCatalogo ? {bg:'#ebfbee',c:'#2f9e44'} : {bg:'#fff9db',c:'#e67700'}
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{background:bg}}>
                    <span className="text-lg flex-shrink-0">{m.enCatalogo?'✅':'⚠️'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{m.nombre}</p>
                      <p className="text-xs mt-0.5" style={{color:c}}>{m.enCatalogo?'En catalogo':'No en catalogo'}{m.spec && ` · ${m.spec}`}{m.razon && ` · ${m.razon}`}</p>
                    </div>
                    <span className="font-bold text-sm text-slate-700 flex-shrink-0">{m.cantidadSugerida} {m.unidad}</span>
                    {m.enCatalogo && m.catalogId && (
                      <button onClick={() => addItem(m)} className="px-2.5 py-1 bg-white border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">+ Solicitar</button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 px-4 pb-4 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setResult(null)}>Nueva consulta</Button>
              {result.materiales.some(m=>m.enCatalogo) && <Button variant="primary" size="sm" onClick={createAll}>Crear solicitud con todos</Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
