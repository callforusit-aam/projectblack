import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../ctx'
import { Btn, Ico, P, Star, Toggle, fmtDate } from '../ui'

export function Home() {
  const { venue, canEdit, setSoldOut, dirty, publicUrl } = useApp()
  const [q, setQ] = useState('')
  const v = venue!
  const sold = useMemo(() => new Set(v.soldOut), [v.soldOut])
  const cats = v.draft.categories
  const total = cats.reduce((n, c) => n + c.dishes.length, 0)
  const validIds = useMemo(() => new Set(cats.flatMap((c) => c.dishes.map((d) => d.id))), [cats])
  const out = v.soldOut.filter((id) => validIds.has(id)).length
  const needle = q.trim().toLowerCase()

  const flip = (id: string, available: boolean) =>
    setSoldOut(available ? v.soldOut.filter((x) => x !== id) : [...v.soldOut, id])

  return (
    <>
      <div className="head">
        <h1>Oggi in sala</h1>
        <div className="head-actions">
          <a className="btn btn--ghost" href={publicUrl} target="_blank" rel="noreferrer"><Ico d={P.eye} size={17} />Vedi il menù</a>
          <Btn kind="yellow" icon={P.undo} disabled={!out} onClick={() => setSoldOut([])}>Ripristina esauriti</Btn>
        </div>
      </div>

      <div className="tiles">
        <div className="tile"><Star color="#c9b9ea" icon="M5 4h14v16H5zM9 9h6M9 13h6" /><div><strong>{total - out} piatti</strong><span>Disponibili ora</span></div></div>
        <div className="tile"><Star color="#f6dc6b" icon="M12 3v9M12 17h.01M4 20h16L12 3z" /><div><strong>{out} esauriti</strong><span>Segnalati ai clienti</span></div></div>
        <div className="tile"><Star color="#f3b6bb" icon="M12 19V5M5 12l7-7 7 7" /><div><strong>{!v.published ? 'Non online' : dirty ? 'Bozza aperta' : 'Online'}</strong><span>{v.publishedAt ? `Pubblicato il ${fmtDate(v.publishedAt)}` : 'Mai pubblicato'}</span></div></div>
      </div>

      <section className="panel">
        <div className="panel-tools">
          <label className="search"><Ico d={P.search} size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un piatto" aria-label="Cerca un piatto" /></label>
          <span className="muted">Un tocco e il cliente lo vede subito, senza pubblicare.</span>
        </div>
        {total === 0 && <p className="empty">Il menù è vuoto.{canEdit && <> <Link to="/menu">Aggiungi i primi piatti</Link></>}</p>}
        {cats.map((c) => {
          const list = c.dishes.filter((d) => !needle || d.name.toLowerCase().includes(needle))
          if (!list.length) return null
          return (
            <div key={c.id} className="group">
              <h3>{c.name}</h3>
              {list.map((d) => (
                <div key={d.id} className={`row${sold.has(d.id) ? ' row--out' : ''}`}>
                  <span className="row-name">{d.name}</span>
                  <span className="row-state">{sold.has(d.id) ? 'Esaurito' : 'Disponibile'}</span>
                  <Toggle on={!sold.has(d.id)} onChange={(on) => flip(d.id, on)} label={`${d.name} disponibile`} />
                </div>
              ))}
            </div>
          )
        })}
      </section>

      {canEdit && (
        <div className="shortcuts">
          <Link to="/menu" className="btn btn--ghost"><Ico d={P.menu} size={17} />Modifica piatti e prezzi</Link>
          <Link to="/aspetto" className="btn btn--ghost"><Ico d={P.brush} size={17} />Cambia aspetto</Link>
          <Link to="/qr" className="btn btn--ghost"><Ico d={P.qr} size={17} />Scarica il QR</Link>
          <Link to="/versioni" className="btn btn--ghost"><Ico d={P.clock} size={17} />Cronologia</Link>
        </div>
      )}
    </>
  )
}
