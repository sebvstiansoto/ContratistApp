// ══════════════════════════════════════
//  UI COMPONENTS — InvStore
//  Un archivo para todos los componentes base
// ══════════════════════════════════════

import React, { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { getCatColor } from '../../utils/colors'
import { estadoLabel } from '../../utils/format'
import type { Categoria, Estado } from '../../types'

// ── BUTTON ────────────────────────────────────
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'export'
type BtnSize    = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  children: React.ReactNode
}

const variantCls: Record<BtnVariant, string> = {
  primary: 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700 disabled:opacity-50',
  ghost:   'bg-white text-slate-600 border-slate-200 hover:border-brand-600 hover:text-brand-600',
  danger:  'bg-white text-slate-400 border-slate-200 hover:border-red-500 hover:text-red-500',
  success: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  export:  'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
}

const sizeCls: Record<BtnSize, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all',
        variantCls[variant], sizeCls[size], className
      )}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ── SPINNER ───────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }[size]
  return (
    <svg className={clsx('animate-spin', s, className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

// ── BADGE (categoría) ─────────────────────────
export function CategoriaBadge({ cat }: { cat: string }) {
  const { bg, c } = getCatColor(cat)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: bg, color: c }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
      {cat}
    </span>
  )
}

// ── BADGE (estado solicitud) ──────────────────
export function StatusBadge({ status }: { status: string }) {
  const cls = {
    pending:  'bg-yellow-50 text-yellow-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }[status] ?? 'bg-slate-100 text-slate-600'
  const label = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[status] ?? status
  return <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold', cls)}>{label}</span>
}

// ── BADGE (estado usuario) ────────────────────
export function EstadoBadge({ estado }: { estado?: Estado | string }) {
  const { label, cls } = estadoLabel(estado ?? 'active')
  return <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold', cls)}>{label}</span>
}

// ── BADGE ficha contratista ───────────────────
export function FichaBadge({ ficha }: { ficha: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
      FC {ficha}
    </span>
  )
}

// ── CODIGO TAG ────────────────────────────────
export function CodigoTag({ code }: { code: string }) {
  return (
    <span className="font-mono text-xs bg-slate-50 border border-slate-200 text-brand-600 font-semibold px-1.5 py-0.5 rounded">
      {code}
    </span>
  )
}

// ── STARS RATING ─────────────────────────────
export function StarsRating({
  value,
  onChange,
  size = 'md'
}: {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeCls = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }[size]
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange?.(n)}
          className={clsx(
            sizeCls,
            n <= value ? 'text-yellow-400' : 'text-slate-200',
            onChange && 'cursor-pointer hover:text-yellow-400 transition-colors'
          )}
        >
          ★
        </span>
      ))}
    </span>
  )
}

// ── FOTO AVATAR ───────────────────────────────
export function FotoAvatar({
  user,
  size = 36
}: {
  user: { nombre: string; foto?: string | null; role?: string }
  size?: number
}) {
  const bg = user.role === 'admin' ? '#3b5bdb' : '#2f9e44'
  if (user.foto) {
    return (
      <img
        src={user.foto}
        alt={user.nombre}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-slate-200 flex-shrink-0"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
    >
      {user.nombre.charAt(0).toUpperCase()}
    </div>
  )
}

// ── MODAL ─────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, footer, width = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widthCls = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl' }[width]

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className={clsx('bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]', widthCls)}
        style={{ animation: 'modalIn .18s ease' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-2 justify-end bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

// ── FIELD (form wrapper) ──────────────────────
export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── INPUT ─────────────────────────────────────
export const inputCls = 'w-full px-3 py-2 bg-white border-1.5 border-slate-200 rounded-lg text-sm text-slate-800 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 disabled:opacity-50 disabled:bg-slate-50'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, className, ...rest } = props
  return (
    <input
      {...rest}
      className={clsx(inputCls, error && 'border-red-400 focus:border-red-400', className)}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(inputCls, props.className)}>
      {props.children}
    </select>
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={clsx(inputCls, 'resize-y', props.className)} />
  )
}

// ── ALERT BANNER ─────────────────────────────
export function Alert({ type, children }: { type: 'warn' | 'error' | 'info' | 'success'; children: React.ReactNode }) {
  const cls = {
    warn:    'bg-yellow-50 border-yellow-200 text-yellow-700',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  }[type]
  return (
    <div className={clsx('flex items-start gap-2 px-4 py-3 rounded-xl border text-sm font-medium mb-4', cls)}>
      {children}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────
export function EmptyState({ icon, message, action }: { icon: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
