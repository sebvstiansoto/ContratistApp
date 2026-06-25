import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '../ui'
import { fmt, fmtVale } from '../../utils/format'
import type { Solicitud } from '../../types'

interface Props {
  solicitud: Solicitud
  esAdmin: boolean
}

export default function ValeImprimible({ solicitud: s, esAdmin }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const stColor = { pending: '#e67700', approved: '#2f9e44', rejected: '#e03131' }[s.status] ?? '#888'
  const stLabel = { pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' }[s.status] ?? s.status

  let total = 0
  let hasPrecio = false

  const rows = s.items.map((si, i) => {
    const item = si.item
    const precio = si.precioSnapshot ?? item?.precio
    const sub = precio != null ? precio * si.cantidad : null
    if (sub != null) { total += sub; hasPrecio = true }
    return { key: i, nombre: item?.nombre ?? '—', spec: item?.spec ?? '—', codigo: item?.codigo ?? '—', cantidad: si.cantidad, precio, sub }
  })

  const cellStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderBottom: '1px solid #eef0f5',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div>
      {/* Print button */}
      {s.status === 'approved' && (
        <div className="flex justify-end mb-4">
          <Button variant="primary" size="sm" onClick={handlePrint}>🖨 Imprimir</Button>
        </div>
      )}

      {/* Vale content */}
      <div ref={printRef} style={{ fontFamily: 'Inter, sans-serif', color: '#111', fontSize: '13px', lineHeight: '1.5' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1d2e', paddingBottom: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1d2e' }}>Inv<span style={{ color: '#3b5bdb' }}>Store</span></div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Sistema de Gestión de Insumos</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>Estado</div>
            <div style={{ fontWeight: 700, color: stColor, fontSize: '13px' }}>{stLabel}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
          Vale de Retiro N° {fmtVale(s.id)}
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '16px', fontSize: '12px' }}>
          {[
            ['Trabajador', s.user?.nombre ?? '—'],
            ['Cargo',      s.user?.cargo ?? '—'],
            ['N° Proyecto', s.proyecto],
            ['N° Plano',    s.plano],
            ['N° Ficha Contratista', s.ficha],
            ['Fecha', s.fecha ? new Date(s.fecha).toLocaleDateString('es-CL') : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{k}</div>
              <div style={{ fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <thead>
            <tr style={{ background: '#f4f6fa' }}>
              {['Insumo', 'Spec', 'Código', 'Cant.', ...(esAdmin ? ['P. Unit.', 'Subtotal'] : [])].map(h => (
                <th key={h} style={{ ...cellStyle, fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', color: '#666', textAlign: h === 'Cant.' || h === 'P. Unit.' || h === 'Subtotal' ? 'center' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td style={cellStyle}>{r.nombre}</td>
                <td style={{ ...cellStyle, color: '#666', fontSize: '11px' }}>{r.spec}</td>
                <td style={{ ...cellStyle, fontFamily: 'Courier New, monospace' }}>{r.codigo}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 600 }}>{r.cantidad}</td>
                {esAdmin && (
                  <>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 500 }}>{r.precio != null ? fmt(r.precio) : '—'}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700 }}>{r.sub != null ? fmt(r.sub) : '—'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total (admin only) */}
        {esAdmin && hasPrecio && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '2px solid #1a1d2e', paddingTop: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>Total del vale</span>
            <span style={{ fontWeight: 700, fontSize: '18px' }}>{fmt(total)}</span>
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
          {[s.user?.nombre ?? '', 'Administrador'].map((name, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#666' }}>
              <div style={{ borderTop: '1px solid #aaa', marginBottom: '4px', paddingTop: '4px' }}>{name}</div>
              {i === 0 ? 'Firma Trabajador' : 'Firma Administrador'}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#ccc', marginTop: '12px' }}>
          Vale generado el {new Date().toLocaleDateString('es-CL')} — InvStore
        </div>
      </div>
    </div>
  )
}
