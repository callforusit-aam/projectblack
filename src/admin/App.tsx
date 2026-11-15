import { useEffect, useState } from 'react'
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { Session } from '../types'
import { getStore } from '../store'
import type { Store } from '../store/types'
import { AppProvider, useApp } from './ctx'
import { Btn, Ico, P } from './ui'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Editor } from './pages/Editor'
import { Aspetto } from './pages/Aspetto'
import { Qr } from './pages/Qr'
import { Locale } from './pages/Locale'
import { Versioni } from './pages/Versioni'
import { Stampa } from './pages/Stampa'
import { Super } from './pages/Super'

export const Wordmark = () => (
  <span className="wordmark" aria-label="ProjectBlack">
    <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true"><rect width="28" height="28" rx="8" fill="#141414" /><path d="M8 9h12M8 14h12M8 19h7" stroke="#cddbb5" strokeWidth="2.4" strokeLinecap="round" /></svg>
    PROJECTBLACK
  </span>
)

const NAV = [
  { to: '/', label: 'Oggi', icon: P.home, staff: true },
  { to: '/menu', label: 'Menù', icon: P.menu },
  { to: '/aspetto', label: 'Aspetto', icon: P.brush },
  { to: '/qr', label: 'QR code', icon: P.qr },
  { to: '/locale', label: 'Locale', icon: P.store },
]

function Shell() {
  const { session, setSession, store, venue, canEdit, dirty, publish, publicUrl } = useApp()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [busy, setBusy] = useState(false)
  const items = NAV.filter((n) => canEdit || n.staff)

  const logout = async () => { await store.signOut(); setSession(null); nav('/') }
  const backToClients = async () => { setSession(await store.impersonate(null)); nav('/') }
  const doPublish = async () => { setBusy(true); await publish(); setBusy(false) }

  if (!venue) return <div className="loading">Carico il locale…</div>

  return (
    <div className="shell">
      {session.impersonating && (
        <div className="imp no-print">
          Stai lavorando come <strong>{venue.name}</strong>
          <Btn small kind="dark" icon={P.undo} onClick={backToClients}>Torna ai clienti</Btn>
        </div>
      )}
      <header className="top no-print">
        <Wordmark />
        <nav aria-label="Sezioni">
          {items.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>)}
        </nav>
        <div className="who">
          <span className="avatar">{venue.name.replace(/^(Pizzeria|Osteria|Bar|Ristorante|Trattoria)\s+/i, '').slice(0, 1)}</span>
          <span className="who-txt"><strong>{venue.name}</strong><small>{session.role === 'fornitore' ? 'Fornitore' : session.role === 'staff' ? 'Staff' : 'Titolare'}</small></span>
          {!session.impersonating && <Btn small icon={P.out} onClick={logout} aria-label="Esci" />}
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          {canEdit && <>
            <Route path="/menu" element={<Editor />} />
            <Route path="/aspetto" element={<Aspetto />} />
            <Route path="/qr" element={<Qr />} />
            <Route path="/locale" element={<Locale />} />
            <Route path="/versioni" element={<Versioni />} />
            <Route path="/stampa" element={<Stampa />} />
          </>}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {canEdit && pathname !== '/stampa' && (dirty || !venue.published) && (
        <div className="pubbar no-print" role="region" aria-label="Pubblicazione">
          <span><strong>{venue.published ? 'Modifiche in bozza' : 'Menù non ancora online'}</strong><small>I clienti vedono {venue.published ? 'ancora la versione precedente' : 'una pagina di cortesia'}</small></span>
          <Btn kind="blue" icon={P.up} onClick={doPublish} disabled={busy}>Pubblica</Btn>
        </div>
      )}

      <nav className="tabs no-print" aria-label="Sezioni">
        {items.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'}><Ico d={n.icon} size={20} />{n.label}</NavLink>)}
      </nav>
      <a className="sr-only" href={publicUrl}>Pagina pubblica</a>
    </div>
  )
}

export function App() {
  const [store, setStore] = useState<Store | null>(null)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [bootError, setBootError] = useState('')

  useEffect(() => {
    getStore()
      .then(async (s) => { setStore(s); setSession(await s.getSession()) })
      .catch((e) => { setBootError(e.message); setSession(null) })
  }, [])

  if (!store || session === undefined) return <div className="loading">{bootError || 'Avvio…'}</div>
  if (!session) return <Login store={store} onLogin={setSession} error={bootError} />

  return (
    <HashRouter>
      <AppProvider store={store} session={session} setSession={setSession}>
        {session.role === 'fornitore' && !session.venueId ? <Super /> : <Shell />}
      </AppProvider>
    </HashRouter>
  )
}
