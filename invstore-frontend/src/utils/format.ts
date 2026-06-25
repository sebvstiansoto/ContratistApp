/** Formatea número como pesos CLP: $1.234.567 */
export function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return '$' + Number(n).toLocaleString('es-CL')
}

/** Formatea fecha ISO a DD/MM/YYYY HH:MM */
export function fmtFecha(iso: string): string {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('es-CL')
  const hora  = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} ${hora}`
}

/** Fecha corta: DD/MM/YYYY */
export function fmtFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL')
}

/** Mes/año: MM/YYYY */
export function fmtMes(iso: string): string {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${m}/${d.getFullYear()}`
}

/** N° de vale con ceros: #0042 */
export function fmtVale(id: number): string {
  return '#' + String(id).padStart(4, '0')
}

/** Label de estado de solicitud */
export function statusLabel(s: string): string {
  return { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[s] ?? s
}

/** Label de estado de usuario */
export function estadoLabel(s: string): { label: string; cls: string } {
  return ({
    active:  { label: 'Activo',        cls: 'bg-green-50 text-green-700' },
    pause:   { label: 'En Pausa',      cls: 'bg-yellow-50 text-yellow-700' },
    leave:   { label: 'Con Licencia',  cls: 'bg-blue-50 text-blue-700' },
    off:     { label: 'Dado de Baja',  cls: 'bg-red-50 text-red-700' },
  } as Record<string, {label:string;cls:string}>)[s] ?? { label: s, cls: '' }
}

/** Descarga un array 2D como CSV con BOM UTF-8 */
export function downloadCSV(rows: (string | number | null)[][], filename: string) {
  const bom = '\uFEFF'
  const csv = bom + rows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
