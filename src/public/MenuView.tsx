import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Dish, MenuDoc } from '../types'
import { DAYS, TAGS, euro } from '../types'
import { loadFont, themeVars } from '../themes'
import './menu.css'

type Props = { doc: MenuDoc; soldOut: string[]; name: string; embedded?: boolean }

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const I = {
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
  close: 'M6 6l12 12M18 6L6 18',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chat: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.4A8.5 8.5 0 1 1 21 12z',
  wifi: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01',
  at: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1',
}

const digits = (s: string) => s.replace(/[^\d+]/g, '')

export function MenuView({ doc, soldOut, name, embedded }: Props) {
  const { theme, info } = doc
  const { vars, headUpper } = useMemo(() => themeVars(theme), [theme])
  const cats = useMemo(() => doc.categories.filter((c) => c.active && c.dishes.length), [doc.categories])
  const [q, setQ] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [open, setOpen] = useState<Dish | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const sold = useMemo(() => new Set(soldOut), [soldOut])

  useEffect(() => { loadFont(theme.font) }, [theme.font])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return cats
      .map((c) => ({
        ...c,
        dishes: c.dishes.filter((d) =>
          (!needle || (d.name + ' ' + d.desc).toLowerCase().includes(needle)) && tags.every((t) => d.tags.includes(t))),
      }))
      .filter((c) => c.dishes.length)
  }, [cats, q, tags])

  const usedTags = useMemo(() => TAGS.filter((t) => cats.some((c) => c.dishes.some((d) => d.tags.includes(t.id)))), [cats])
  const anyFrozen = useMemo(() => cats.some((c) => c.dishes.some((d) => d.frozen)), [cats])

  // evidenzia nella barra la categoria che si sta leggendo
  useEffect(() => {
    const root = embedded ? scroller.current : null
    const els = Array.from((scroller.current ?? document).querySelectorAll<HTMLElement>('[data-cat]'))
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.cat!)),
      { root, rootMargin: '-25% 0px -65% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [shown, embedded])

  useEffect(() => {
    if (!active) return
    scroller.current?.querySelector(`[data-pill="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setActive(id)
    scroller.current?.querySelector(`[data-cat="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const toggleTag = (t: string) => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))
  const hasPhoto = (d: Dish) => theme.photo !== 'nessuna' && !!d.photo

  return (
    <div
      className={`mv mv--${theme.layout} mv--card-${theme.card} mv--photo-${theme.photo}${embedded ? ' mv--embedded' : ''}${headUpper ? ' mv--upper' : ''}`}
      style={vars as CSSProperties}
    >
      <div className="mv-scroll" ref={scroller}>
        {doc.cover && <div className="mv-cover" style={{ backgroundImage: `url(${doc.cover})` }} />}
        <header className={`mv-head${doc.cover ? ' mv-head--over' : ''}`}>
          {doc.logo && <img className="mv-logo" src={doc.logo} alt="" />}
          <div>
            <h1>{name}</h1>
            {info.tagline && <p>{info.tagline}</p>}
          </div>
        </header>

        <div className="mv-bar">
          <nav className="mv-cats" aria-label="Categorie">
            {cats.map((c) => (
              <button key={c.id} data-pill={c.id} className={active === c.id ? 'on' : ''} onClick={() => go(c.id)}>{c.name}</button>
            ))}
          </nav>
        </div>

        <div className="mv-tools">
          <label className="mv-search">
            <Icon d={I.search} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un piatto" aria-label="Cerca un piatto" />
            {q && <button onClick={() => setQ('')} aria-label="Cancella ricerca"><Icon d={I.close} /></button>}
          </label>
          {usedTags.length > 0 && (
            <div className="mv-filters">
              {usedTags.map((t) => (
                <button key={t.id} className={tags.includes(t.id) ? 'on' : ''} aria-pressed={tags.includes(t.id)} onClick={() => toggleTag(t.id)}>{t.label}</button>
              ))}
            </div>
          )}
        </div>

        <main>
          {shown.length === 0 && (
            <p className="mv-empty">{cats.length ? 'Nessun piatto corrisponde alla ricerca.' : 'Il menù è in preparazione.'}</p>
          )}
          {shown.map((c) => (
            <section key={c.id} data-cat={c.id} className="mv-section">
              <h2>{c.name}</h2>
              <div className="mv-items">
                {c.dishes.map((d) => {
                  const out = sold.has(d.id)
                  return (
                    <button key={d.id} className={`mv-item${out ? ' out' : ''}${hasPhoto(d) ? ' has-photo' : ''}`} onClick={() => setOpen(d)}>
                      {hasPhoto(d) && <img className="mv-photo" src={d.photo} alt="" loading="lazy" />}
                      <span className="mv-body">
                        <span className="mv-row">
                          <span className="mv-name">{d.name}{d.frozen && <sup title="Surgelato o congelato all'origine"> *</sup>}</span>
                          <span className="mv-price">{euro(d.price)}</span>
                        </span>
                        {theme.showDesc && d.desc && <span className="mv-desc">{d.desc}</span>}
                        {(out || (theme.showBadges && d.tags.length > 0)) && (
                          <span className="mv-badges">
                            {out && <span className="mv-out">Esaurito</span>}
                            {theme.showBadges && d.tags.map((t) => <span key={t} className="mv-tag">{TAGS.find((x) => x.id === t)?.short}</span>)}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </main>

        <footer className="mv-foot">
          {(info.coperto != null || info.servizio) && (
            <p className="mv-coperto">
              {info.coperto != null && <span>Coperto {euro(info.coperto)}</span>}
              {info.servizio && <span>{info.servizio}</span>}
            </p>
          )}
          <div className="mv-legal">
            <p>Per allergie e intolleranze rivolgiti al personale: gli allergeni di ogni piatto sono indicati nella sua scheda.</p>
            {anyFrozen && <p>* Prodotto surgelato o congelato all'origine{info.frozenNote ? ', oppure sostituibile con prodotto surgelato in base alla disponibilità' : ''}.</p>}
            {info.rawFishNote && <p>Il pesce destinato a essere consumato crudo è sottoposto a bonifica preventiva secondo il Reg. CE 853/2004.</p>}
            <p>Prezzi in euro, IVA inclusa.</p>
          </div>
          {info.hours.some(Boolean) && (
            <dl className="mv-hours">
              {DAYS.map((day, i) => info.hours[i] ? <div key={day}><dt>{day}</dt><dd>{info.hours[i]}</dd></div> : null)}
            </dl>
          )}
          <div className="mv-contacts">
            {info.phone && <a href={`tel:${digits(info.phone)}`}><Icon d={I.phone} />Chiama</a>}
            {info.whatsapp && <a href={`https://wa.me/${digits(info.whatsapp).replace('+', '')}`}><Icon d={I.chat} />WhatsApp</a>}
            {info.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`}><Icon d={I.pin} />Mappa</a>}
            {info.instagram && <a href={`https://instagram.com/${info.instagram.replace('@', '')}`}><Icon d={I.at} />Instagram</a>}
          </div>
          {info.address && <p className="mv-addr">{info.address}</p>}
          {info.wifi && <p className="mv-wifi"><Icon d={I.wifi} />Wi-Fi: <strong>{info.wifi}</strong></p>}
        </footer>
      </div>

      {open && (
        <div className="mv-sheet" role="dialog" aria-modal="true" aria-label={open.name} onClick={() => setOpen(null)}>
          <div className="mv-sheet-card" onClick={(e) => e.stopPropagation()}>
            <button className="mv-sheet-x" onClick={() => setOpen(null)} aria-label="Chiudi"><Icon d={I.close} /></button>
            {hasPhoto(open) && <img className="mv-sheet-photo" src={open.photo} alt="" />}
            <h3>{open.name}</h3>
            <p className="mv-sheet-price">{euro(open.price)}{sold.has(open.id) && <span className="mv-out">Esaurito</span>}</p>
            {open.desc && <p className="mv-sheet-desc">{open.desc}</p>}
            {open.tags.length > 0 && (
              <p className="mv-badges">{open.tags.map((t) => <span key={t} className="mv-tag">{TAGS.find((x) => x.id === t)?.label}</span>)}</p>
            )}
            <div className="mv-allergens">
              <h4>Allergeni</h4>
              <p>{open.allergens.length ? open.allergens.join(', ') : 'Nessun allergene dichiarato per questo piatto.'}</p>
              {open.frozen && <p>* Prodotto surgelato o congelato all'origine.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
