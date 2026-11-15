import type { Theme } from '../../types'
import { FONTS, LAYOUTS, PRESETS, themeVars } from '../../themes'
import { useApp } from '../ctx'
import { Preview } from '../Preview'
import { Btn, Field, Ico, P, Seg, Toggle, compressImage } from '../ui'

export function Aspetto() {
  const { venue, updateDraft, store, toast } = useApp()
  const doc = venue!.draft
  const t = doc.theme
  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => updateDraft((d) => { d.theme[k] = v })
  const { corrected } = themeVars(t)

  const upload = (key: 'logo' | 'cover') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const data = key === 'logo' ? await compressImage(f, 360, 'image/png') : await compressImage(f, 1400)
      const url = await store.uploadImage(venue!.id, data)
      updateDraft((d) => { d[key] = url })
    } catch (x) { toast((x as Error).message) }
  }
  const color = (k: 'primary' | 'accent' | 'bg', label: string) => (
    <label className="color">
      <input type="color" value={t[k]} onChange={(e) => set(k, e.target.value)} aria-label={label} />
      <span><strong>{label}</strong><small>{t[k].toUpperCase()}</small></span>
    </label>
  )

  return (
    <>
      <div className="head"><h1>Aspetto</h1></div>
      <div className="split">
        <div className="split-main">
          <section className="panel pad stack">
            <h2>Template</h2>
            <div className="presets">
              {PRESETS.map((p) => (
                <button key={p.id} type="button" className={`preset${t.preset === p.id ? ' on' : ''}`} aria-pressed={t.preset === p.id} onClick={() => updateDraft((d) => { d.theme = { ...p.theme } })}>
                  <span className="swatch" style={{ background: p.theme.bg }}>
                    <i style={{ background: p.theme.accent }} /><i style={{ background: p.theme.primary }} /><i style={{ background: p.theme.bg === '#ffffff' ? '#eceef3' : p.theme.bg, outline: '1px solid rgba(128,128,128,.25)' }} />
                  </span>
                  <strong>{p.name}</strong><small>{p.hint}</small>
                </button>
              ))}
            </div>
            <p className="muted">Scegli un punto di partenza, poi cambia quello che vuoi qui sotto.</p>
          </section>

          <section className="panel pad stack">
            <h2>Logo e copertina</h2>
            <div className="two">
              <div className="field"><span>Logo</span>
                <div className="photo-pick">{doc.logo && <img src={doc.logo} alt="" className="round" />}
                  <label className="btn btn--ghost btn--s"><Ico d={P.plus} size={15} />{doc.logo ? 'Cambia' : 'Carica logo'}<input type="file" accept="image/*" hidden onChange={upload('logo')} /></label>
                  {doc.logo && <Btn small icon={P.trash} aria-label="Rimuovi logo" onClick={() => updateDraft((d) => { delete d.logo })} />}
                </div>
              </div>
              <div className="field"><span>Copertina</span>
                <div className="photo-pick">{doc.cover && <img src={doc.cover} alt="" />}
                  <label className="btn btn--ghost btn--s"><Ico d={P.plus} size={15} />{doc.cover ? 'Cambia' : 'Carica immagine'}<input type="file" accept="image/*" hidden onChange={upload('cover')} /></label>
                  {doc.cover && <Btn small icon={P.trash} aria-label="Rimuovi copertina" onClick={() => updateDraft((d) => { delete d.cover })} />}
                </div>
              </div>
            </div>
          </section>

          <section className="panel pad stack">
            <h2>Colori</h2>
            <div className="colors">{color('primary', 'Principale')}{color('accent', 'Testata')}{color('bg', 'Sfondo')}</div>
            {corrected && <p className="note" role="status">Il colore principale si legge poco su questo sfondo: prezzi e accenti usano una tonalità più leggibile. Il testo si adatta sempre da solo.</p>}
          </section>

          <section className="panel pad stack">
            <h2>Impaginazione</h2>
            <div className="layouts">
              {LAYOUTS.map((l) => (
                <button key={l.id} type="button" className={`layout${t.layout === l.id ? ' on' : ''}`} aria-pressed={t.layout === l.id} onClick={() => set('layout', l.id)}>
                  <span className={`lay lay--${l.id}`}><i /><i /><i /><i /></span><strong>{l.name}</strong><small>{l.hint}</small>
                </button>
              ))}
            </div>
            <Field label="Caratteri"><select value={t.font} onChange={(e) => set('font', e.target.value)}>{Object.entries(FONTS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</select></Field>
            <div className="field"><span>Dimensione testo</span><Seg label="Dimensione testo" value={t.scale} onChange={(v) => set('scale', v)} options={[{ id: 'compatta', label: 'Compatta' }, { id: 'normale', label: 'Normale' }, { id: 'ampia', label: 'Ampia' }]} /></div>
            <div className="field"><span>Angoli</span><Seg label="Angoli" value={t.radius} onChange={(v) => set('radius', v)} options={[{ id: 'vivo', label: 'Vivi' }, { id: 'morbido', label: 'Morbidi' }, { id: 'tondo', label: 'Tondi' }]} /></div>
            <div className="field"><span>Spaziatura</span><Seg label="Spaziatura" value={t.density} onChange={(v) => set('density', v)} options={[{ id: 'compatta', label: 'Compatta' }, { id: 'normale', label: 'Normale' }, { id: 'ariosa', label: 'Ariosa' }]} /></div>
            <div className="field"><span>Scheda piatto</span><Seg label="Scheda piatto" value={t.card} onChange={(v) => set('card', v)} options={[{ id: 'nessuno', label: 'Solo righe' }, { id: 'bordo', label: 'Con bordo' }, { id: 'sfondo', label: 'Su pannello' }]} /></div>
            <div className="field"><span>Foto dei piatti</span><Seg label="Foto dei piatti" value={t.photo} onChange={(v) => set('photo', v)} options={[{ id: 'nessuna', label: 'Nascoste' }, { id: 'lato', label: 'A lato' }, { id: 'alto', label: 'In alto' }]} /></div>
            <div className="switch-row"><span><strong>Descrizioni</strong></span><Toggle on={t.showDesc} onChange={(v) => set('showDesc', v)} label="Mostra descrizioni" /></div>
            <div className="switch-row"><span><strong>Indicazioni dietetiche</strong></span><Toggle on={t.showBadges} onChange={(v) => set('showBadges', v)} label="Mostra indicazioni dietetiche" /></div>
            <Btn icon={P.undo} onClick={() => updateDraft((d) => { d.theme = { ...(PRESETS.find((p) => p.id === t.preset) ?? PRESETS[0]).theme } })}>Ripristina il template</Btn>
          </section>
        </div>
        <aside className="split-side"><Preview /></aside>
      </div>
    </>
  )
}
