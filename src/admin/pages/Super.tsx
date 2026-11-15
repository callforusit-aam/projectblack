import { useCallback, useEffect, useState } from 'react'
import type { LogEntry, VenueSummary } from '../../types'
import { PRESETS } from '../../themes'
import { useApp } from '../ctx'
import { Btn, Field, Modal, P, Star, daysAgo, fmtDate } from '../ui'
import { Wordmark } from '../App'

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const STATUS = { attivo: 'Attivo', prova: 'In prova', sospeso: 'Sospeso' }

export function Super() {
  const { store, session, setSession, toast } = useApp()
  const [venues, setVenues] = useState<VenueSummary[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', preset: 'vivace' })
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    store.listVenues().then(setVenues).catch((e) => toast(e.message))
    store.listLog().then(setLog).catch(() => {})
  }, [store, toast])
  useEffect(load, [load])

  const base = location.origin + location.pathname.replace(/index\.html$/, '')
  const enter = async (id: string) => setSession(await store.impersonate(id))
  const status = async (v: VenueSummary) => {
    const next = v.status === 'sospeso' ? 'attivo' : 'sospeso'
    if (next === 'sospeso' && !window.confirm(`Sospendere ${v.name}? Chi inquadra il QR vedrà una pagina di cortesia. I dati restano.`)) return
    await store.setStatus(v.id, next)
    load()
  }
  const activate = async (v: VenueSummary) => { await store.setStatus(v.id, 'attivo'); load() }
  const create = async () => {
    setErr('')
    try {
      const v = await store.createVenue({ name: form.name.trim(), slug: form.slug, preset: form.preset })
      setCreating(false)
      setSession(await store.impersonate(v.id))
    } catch (e) { setErr((e as Error).message) }
  }
  const logout = async () => { await store.signOut(); setSession(null) }

  const count = (s: string) => venues.filter((v) => v.status === s).length
  const atRisk = venues.filter((v) => v.status !== 'sospeso' && (daysAgo(v.lastAccess) ?? 999) >= 60)

  return (
    <div className="shell">
      <header className="top">
        <Wordmark />
        <nav aria-label="Sezioni"><a className="active" href="#/">Clienti</a></nav>
        <div className="who">
          <span className="avatar">F</span>
          <span className="who-txt"><strong>{session.email}</strong><small>Fornitore</small></span>
          <Btn small icon={P.out} onClick={logout} aria-label="Esci" />
        </div>
      </header>
      <main className="page">
        <div className="head">
          <h1>Clienti</h1>
          <Btn kind="blue" icon={P.plus} onClick={() => { setForm({ name: '', slug: '', preset: 'vivace' }); setErr(''); setCreating(true) }}>Nuovo locale</Btn>
        </div>

        <div className="tiles">
          <div className="tile"><Star color="#c9b9ea" icon="M5 12l5 5 9-10" /><div><strong>{count('attivo')} attivi</strong><span>Abbonamento in corso</span></div></div>
          <div className="tile"><Star color="#f6dc6b" icon="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" /><div><strong>{count('prova')} in prova</strong><span>Da convertire</span></div></div>
          <div className="tile"><Star color="#f3b6bb" icon="M12 3v9M12 17h.01M4 20h16L12 3z" /><div><strong>{atRisk.length} a rischio</strong><span>Nessun accesso da 60 giorni</span></div></div>
        </div>

        <section className="panel">
          <div className="vtable" role="table" aria-label="Clienti">
            <div className="vrow vhead" role="row"><span>Locale</span><span>Stato</span><span>Ultimo accesso</span><span>Menù</span><span /></div>
            {venues.map((v) => {
              const idle = daysAgo(v.lastAccess)
              return (
                <div className="vrow" role="row" key={v.id}>
                  <span><strong>{v.name}</strong><small>/{v.slug}</small></span>
                  <span>
                    <span className={`chip chip--${v.status}`}>{STATUS[v.status]}</span>
                    {v.status === 'prova' && v.trialEnds && <small>fino al {new Date(v.trialEnds).toLocaleDateString('it-IT')}</small>}
                  </span>
                  <span>{idle == null ? 'Mai' : idle === 0 ? 'Oggi' : `${idle} giorni fa`}{idle != null && idle >= 60 && v.status !== 'sospeso' && <small className="warn">Da richiamare</small>}</span>
                  <span>{v.dishes} piatti<small>{v.isPublished ? `Online dal ${new Date(v.publishedAt!).toLocaleDateString('it-IT')}` : 'Non pubblicato'}</small></span>
                  <span className="vactions">
                    <Btn small kind="yellow" icon={P.chev} onClick={() => enter(v.id)}>Entra</Btn>
                    <a className="btn btn--ghost btn--s" href={`${base}m/?l=${v.slug}`} target="_blank" rel="noreferrer">Menù</a>
                    {v.status === 'prova' && <Btn small onClick={() => activate(v)}>Attiva</Btn>}
                    <Btn small onClick={() => status(v)}>{v.status === 'sospeso' ? 'Riattiva' : 'Sospendi'}</Btn>
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <div className="cols">
          <section className="panel pad stack">
            <h2>Template disponibili</h2>
            <p className="muted">Ogni template è un insieme di valori su uno dei quattro layout: ne aggiungi uno con una voce in <code>src/themes.ts</code>, senza codice dedicato.</p>
            <div className="presets presets--ro">
              {PRESETS.map((p) => (
                <div key={p.id} className="preset">
                  <span className="swatch" style={{ background: p.theme.bg }}><i style={{ background: p.theme.accent }} /><i style={{ background: p.theme.primary }} /><i style={{ background: '#eceef3' }} /></span>
                  <strong>{p.name}</strong><small>{p.hint}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel pad stack">
            <h2>Attività recenti</h2>
            {log.length === 0 && <p className="muted">Ancora nessuna attività registrata.</p>}
            {log.map((l) => <div className="logrow" key={l.id}><strong>{l.action}</strong><span>{l.venue}</span><small>{fmtDate(l.at)} · {l.actor}</small></div>)}
          </section>
        </div>
      </main>

      {creating && (
        <Modal title="Nuovo locale" onClose={() => setCreating(false)}
          footer={<><span className="grow" /><Btn onClick={() => setCreating(false)}>Annulla</Btn><Btn kind="blue" icon={P.check} disabled={form.name.trim().length < 2 || form.slug.length < 3} onClick={create}>Crea ed entra</Btn></>}>
          <div className="stack">
            <Field label="Nome del locale"><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} /></Field>
            <Field label="Indirizzo del menù" hint={`${base}m/?l=${form.slug || '…'} — finisce nel QR stampato: sceglilo bene, cambiarlo dopo significa ristampare.`}><input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></Field>
            <Field label="Template di partenza"><select value={form.preset} onChange={(e) => setForm({ ...form, preset: e.target.value })}>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.hint}</option>)}</select></Field>
            <p className="muted">Parte con 30 giorni di prova. Dopo la creazione entri nel suo pannello per importare il menù.</p>
            {err && <p className="error" role="alert">{err}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
