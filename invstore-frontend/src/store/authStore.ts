import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api'

interface AuthState {
  user: User | null
  loading: boolean
  timeoutWarning: boolean
  setUser: (u: User | null) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  // session timers
  _warnTimer: ReturnType<typeof setTimeout> | null
  _logoutTimer: ReturnType<typeof setTimeout> | null
  resetTimeout: () => void
  showWarning: () => void
  dismissWarning: () => void
}

const SESSION_MS  = 30 * 60 * 1000   // 30 min
const WARNING_MS  = 29 * 60 * 1000   // 29 min → show warning with 60s left

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  timeoutWarning: false,
  _warnTimer: null,
  _logoutTimer: null,

  setUser: (u) => set({ user: u }),

  async login(username, password) {
    const data = await authApi.login({ user: username, password })
    set({ user: data.user })
    get().resetTimeout()
  },

  async logout() {
    await authApi.logout().catch(() => {})
    const { _warnTimer, _logoutTimer } = get()
    if (_warnTimer)  clearTimeout(_warnTimer)
    if (_logoutTimer) clearTimeout(_logoutTimer)
    set({ user: null, timeoutWarning: false, _warnTimer: null, _logoutTimer: null })
  },

  async hydrate() {
    try {
      const user = await authApi.me()
      set({ user, loading: false })
      if (user) get().resetTimeout()
    } catch {
      set({ user: null, loading: false })
    }
  },

  resetTimeout() {
    const { _warnTimer, _logoutTimer } = get()
    if (_warnTimer)  clearTimeout(_warnTimer)
    if (_logoutTimer) clearTimeout(_logoutTimer)
    set({ timeoutWarning: false })
    const wt  = setTimeout(() => get().showWarning(), WARNING_MS)
    const lt  = setTimeout(() => get().logout(),      SESSION_MS)
    set({ _warnTimer: wt, _logoutTimer: lt })
  },

  showWarning: () => set({ timeoutWarning: true }),
  dismissWarning: () => {
    get().resetTimeout()
    set({ timeoutWarning: false })
  },
}))
