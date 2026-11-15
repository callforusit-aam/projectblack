import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MenuDoc, Session, Venue } from '../types'
import type { Store } from '../store/types'

type Ctx = {
  store: Store
  session: Session
  setSession: (s: Session | null) => void
  venue: Venue | null
  canEdit: boolean
  dirty: boolean
  updateDraft: (fn: (d: MenuDoc) => void) => void
  setSoldOut: (ids: string[]) => void
  publish: () => Promise<void>
  toast: (msg: string) => void
  publicUrl: string
}

const C = createContext<Ctx | null>(null)
export const useApp = () => useContext(C)!

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

export function AppProvider({ store, session, setSession, children }: { store: Store; session: Session; setSession: (s: Session | null) => void; children: ReactNode }) {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<MenuDoc | null>(null)

  const toast = useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 3200)
  }, [])

  useEffect(() => {
    setVenue(null)
    if (session.venueId) store.getVenue(session.venueId).then(setVenue).catch((e) => toast(e.message))
  }, [session.venueId, store, toast])

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    const doc = pending.current
    if (!doc || !session.venueId) return
    pending.current = null
    try { await store.saveDraft(session.venueId, doc) } catch (e) { toast((e as Error).message) }
  }, [session.venueId, store, toast])

  const updateDraft = useCallback((fn: (d: MenuDoc) => void) => {
    setVenue((v) => {
      if (!v) return v
      const draft = clone(v.draft)
      fn(draft)
      pending.current = draft
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(flush, 500)
      return { ...v, draft }
    })
  }, [flush])

  const setSoldOut = useCallback((ids: string[]) => {
    setVenue((v) => (v ? { ...v, soldOut: ids } : v))
    if (session.venueId) store.setSoldOut(session.venueId, ids).catch((e) => toast(e.message))
  }, [session.venueId, store, toast])

  const publish = useCallback(async () => {
    if (!session.venueId) return
    await flush()
    try {
      const v = await store.publish(session.venueId, session.email)
      setVenue((cur) => (cur ? { ...cur, published: v.published, publishedAt: v.publishedAt } : cur))
      toast('Menù pubblicato: è già online')
    } catch (e) { toast((e as Error).message) }
  }, [flush, session, store, toast])

  const dirty = useMemo(() => !!venue && JSON.stringify(venue.draft) !== JSON.stringify(venue.published), [venue])
  const publicUrl = useMemo(() => {
    const base = location.origin + location.pathname.replace(/index\.html$/, '')
    return `${base}m/?l=${venue?.slug ?? ''}`
  }, [venue?.slug])

  const value: Ctx = { store, session, setSession, venue, canEdit: session.role !== 'staff', dirty, updateDraft, setSoldOut, publish, toast, publicUrl }
  return (
    <C.Provider value={value}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </C.Provider>
  )
}
