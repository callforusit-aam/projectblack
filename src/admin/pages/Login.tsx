import { useState } from 'react'
import type { Role, Session } from '../../types'
import type { Store } from '../../store/types'
import { resetDb } from '../../store/localdb'
import { Btn, Field, P } from '../ui'
import { Wordmark } from '../App'

export function Login({ store, onLogin, error }: { store: Store; onLogin: (s: Session) => void; error?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(error ?? '')
  const [busy, setBusy] = useState(false)

  const demo = async (role: Role) => onLogin(await store.demoSignIn(role))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { onLogin(await store.signIn(email, password)) } catch (x) { setErr((x as Error).message) }
    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login-card">
        <Wordmark />
        <h1>Il menù del tuo locale, sempre aggiornato</h1>
        {store.mode === 'demo' ? (
          <>
            <p className="muted">Modalità demo: i dati restano in questo browser. Scegli con quale ruolo entrare.</p>
            <div className="login-roles">
              <button onClick={() => demo('titolare')}><strong>Titolare</strong><span>Menù, aspetto, QR, pubblicazione</span></button>
              <button onClick={() => demo('staff')}><strong>Staff di sala</strong><span>Solo piatti esauriti</span></button>
              <button onClick={() => demo('fornitore')}><strong>Fornitore</strong><span>Tutti i locali, assistenza, stati</span></button>
            </div>
            <Btn small icon={P.undo} onClick={() => { resetDb(); location.reload() }}>Ripristina i dati demo</Btn>
          </>
        ) : (
          <form onSubmit={submit} className="stack">
            <Field label="Email"><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password"><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            {err && <p className="error" role="alert">{err}</p>}
            <button className="btn btn--blue" disabled={busy}>Entra</button>
          </form>
        )}
      </div>
    </div>
  )
}
