import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui'

interface Notif {
  id: number
  msg: string
  type: 'info' | 'success' | 'warning' | 'pending'
  time: string
  read: boolean
  action?: () => void
}

// Singleton store for notifications (simple — no zustand needed)
let _notifs: Notif[] = []
let _listeners: (() => void)[] = []

export function addNotif(msg: string, type: Notif['type'] = 'info', action?: () => void) {
  _notifs = [{
    id: Date.now(),
    msg, type, action,
    time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  }, ..._notifs].slice(0, 20)
  _listeners.forEach(l => l())
}

export function Topbar({ title }: { title: string }) {
  const { user, logout, timeoutWarning, resetTimeout, dismissWarning } = useAuthStore()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync notification singleton
  useEffect(() => {
    const sync = () => setNotifs([..._notifs])
    _listeners.push(sync)
    return () => { _listeners = _listeners.filter(l => l !== sync) }
  }, [])

  // Session countdown
  useEffect(() => {
    if (!timeoutWarning) { setCountdown(60); return }
    setCountdown(60)
    const interval = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(interval)
  }, [timeoutWarning])

  // Close panel on outside click
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  const unread = notifs.filter(n => !n.read).length

  function markAllRead() {
    _notifs = _notifs.map(n => ({ ...n, read: true }))
    setNotifs([..._notifs])
  }

  function clickNotif(n: Notif) {
    _notifs = _notifs.map(x => x.id === n.id ? { ...x, read: true } : x)
    setNotifs([..._notifs])
    n.action?.()
    setPanelOpen(false)
  }

  const fmtCountdown = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`

  return (
    <>
      {/* Session timeout warning */}
      {timeoutWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-5 py-3 flex items-center justify-between shadow-lg text-sm font-medium">
          <span>⚠️ Tu sesión expirará en <strong>{fmtCountdown}</strong> por inactividad</span>
          <div className="flex gap-2">
            <button
              onClick={dismissWarning}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              Mantener sesión
            </button>
            <button
              onClick={() => logout()}
              className="text-white/80 hover:text-white text-xs underline"
            >
              Cerrar sesión ahora
            </button>
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className={`bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-3 sticky top-0 z-40 ${timeoutWarning ? 'mt-12' : ''}`}>
        <h1 className="font-bold text-slate-800 text-base">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          {/* Date */}
          <span className="text-xs text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>

          {/* Notification bell (admin only) */}
          {user?.role === 'admin' && (
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setPanelOpen(p => !p)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:border-brand-500 hover:text-brand-600 text-slate-500 text-base transition-colors"
              >
                🔔
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>

              {panelOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-800">
                      Notificaciones {unread > 0 && (
                        <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
                      )}
                    </span>
                    <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:underline">
                      Marcar como leídas
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Sin notificaciones</p>
                    ) : notifs.map(n => (
                      <button
                        key={n.id}
                        onClick={() => clickNotif(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-brand-50' : ''}`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                          n.type === 'success' ? 'bg-green-100' : n.type === 'warning' ? 'bg-yellow-100' : 'bg-brand-50'
                        }`}>
                          {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : '📋'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 leading-snug">{n.msg}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  )
}
