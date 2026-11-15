import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Dish } from '../../types'
import { ALLERGENS, TAGS, uid } from '../../types'
import { parseMenuText, pdfToText, type ImportRow } from '../../import'
import { useApp } from '../ctx'
import { Preview } from '../Preview'
import { Sortable } from '../Sortable'
import { Btn, Field, Ico, Modal, P, Toggle, compressImage } from '../ui'

const blank = (): Dish => ({ id: uid(), name: '', desc: '', price: null, allergens: [], tags: [], frozen: false })

function DishModal({ dish, catId, isNew, onClose }: { dish: Dish; catId: string; isNew: boolean; onClose: () => void }) {
  const { venue, updateDraft, store, toast } = useApp()
  const [d, setD] = useState<Dish>(dish)
  const [cat, setCat] = useState(catId)
  const [busy, setBusy] = useState(false)
  const flip = (k: 'allergens' | 'tags', v: string) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }))

  const save = () => {
    if (!d.name.trim()) return
    updateDraft((doc) => {
      for (const c of doc.categories) {
        const i = c.dishes.findIndex((x) => x.id === d.id)
        if (i >= 0) c.id === cat ? (c.dishes[i] = d) : c.dishes.splice(i, 1)
      }
      const target = doc.categories.find((c) => c.id === cat)!
      if (!target.dishes.some((x) => x.id === d.id)) target.dishes.push(d)
    })
    onClose()
  }
  const remove = () => { updateDraft((doc) => doc.categories.forEach((c) => { c.dishes = c.dishes.filter((x) => x.id !== d.id) })); onClose() }
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try { const url = await store.uploadImage(venue!.id, await compressImage(f)); setD((x) => ({ ...x, photo: url })) } catch (x) { toast((x as Error).message) }
    setBusy(false)
  }

  return (
    <Modal title={isNew ? 'Nuovo piatto' : 'Modifica piatto'} onClose={onClose}
      footer={<>
        {!isNew && <Btn kind="danger" icon={P.trash} onClick={remove}>Elimina</Btn>}
        <span className="grow" />
        <Btn onClick={onClose}>Annulla</Btn>
        <Btn kind="blue" icon={P.check} onClick={save} disabled={!d.name.trim() || busy}>Salva</Btn>
      </>}>
      <div className="stack">
        <Field label="Nome"><input autoFocus value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="Descrizione"><textarea rows={2} value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} /></Field>
        <div className="two">
          <Field label="Prezzo (€)"><input type="number" min="0" step="0.5" inputMode="decimal" value={d.price ?? ''} onChange={(e) => setD({ ...d, price: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
          <Field label="Categoria"><select value={cat} onChange={(e) => setCat(e.target.value)}>{venue!.draft.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
        <div className="field">
          <span>Foto</span>
          <div className="photo-pick">
            {d.photo && <img src={d.photo} alt="" />}
            <label className="btn btn--ghost btn--s"><Ico d={P.plus} size={15} />{busy ? 'Carico…' : d.photo ? 'Cambia' : 'Carica foto'}<input type="file" accept="image/*" hidden onChange={pick} /></label>
            {d.photo && <Btn small icon={P.trash} onClick={() => setD({ ...d, photo: undefined })}>Rimuovi</Btn>}
          </div>
        </div>
        <div className="field">
          <span>Allergeni</span>
          <div className="chips">{ALLERGENS.map((a) => <button type="button" key={a} aria-pressed={d.allergens.includes(a)} className={`chipbtn${d.allergens.includes(a) ? ' on' : ''}`} onClick={() => flip('allergens', a)}>{a}</button>)}</div>
        </div>
        <div className="field">
          <span>Indicazioni</span>
          <div className="chips">{TAGS.map((t) => <button type="button" key={t.id} aria-pressed={d.tags.includes(t.id)} className={`chipbtn chipbtn--tag${d.tags.includes(t.id) ? ' on' : ''}`} onClick={() => flip('tags', t.id)}>{t.label}</button>)}</div>
        </div>
        <div className="switch-row"><span><strong>Surgelato o congelato all'origine</strong><small>Compare l'asterisco accanto al nome</small></span><Toggle on={d.frozen} onChange={(x) => setD({ ...d, frozen: x })} label="Surgelato" /></div>
      </div>
    </Modal>
  )
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { updateDraft, toast } = useApp()
  const [text, setText] = useState('')
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const fromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true); setErr('')
    try {
      const t = f.name.toLowerCase().endsWith('.pdf') ? await pdfToText(f) : await f.text()
      if (!t.trim()) setErr('In questo PDF non c\'è testo selezionabile (probabilmente è una scansione): incolla il testo a mano.')
      setText(t)
    } catch { setErr('File non leggibile.') }
    setBusy(false)
  }
  const analyse = () => { const r = parseMenuText(text); r.length ? setRows(r) : setErr('Non ho riconosciuto nessun piatto: serve una riga per piatto con il prezzo in fondo.') }
  const edit = (i: number, patch: Partial<ImportRow>) => setRows((r) => r!.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const confirm = () => {
    updateDraft((doc) => {
      for (const r of rows!) {
        if (!r.name.trim()) continue
        const name = r.category.trim() || 'Menù'
        let c = doc.categories.find((x) => x.name.toLowerCase() === name.toLowerCase())
        if (!c) { c = { id: uid(), name, active: true, dishes: [] }; doc.categories.push(c) }
        c.dishes.push({ ...blank(), name: r.name.trim(), desc: r.desc.trim(), price: r.price })
      }
    })
    toast(`${rows!.length} piatti aggiunti alla bozza. Ricorda gli allergeni.`)
    onClose()
  }

  return (
    <Modal wide title="Importa un menù esistente" onClose={onClose}
      footer={rows
        ? <><Btn onClick={() => setRows(null)}>Indietro</Btn><span className="grow" /><Btn kind="blue" icon={P.check} onClick={confirm}>Aggiungi {rows.length} piatti</Btn></>
        : <><span className="grow" /><Btn kind="blue" icon={P.chev} onClick={analyse} disabled={!text.trim() || busy}>Analizza</Btn></>}>
      {!rows ? (
        <div className="stack">
          <p className="muted">Carica un PDF con testo selezionabile o un file di testo, oppure incolla il menù qui sotto: una riga per piatto, con il prezzo in fondo. I titoli senza prezzo diventano categorie.</p>
          <label className="btn btn--ghost"><Ico d={P.up} size={17} />{busy ? 'Leggo il file…' : 'Carica PDF o testo'}<input type="file" accept=".pdf,.txt,.csv,text/plain,application/pdf" hidden onChange={fromFile} /></label>
          <textarea rows={11} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} placeholder={'PIZZE\nMargherita - pomodoro, fiordilatte, basilico 6,50\nDiavola 8,00'} aria-label="Testo del menù" />
          {err && <p className="error" role="alert">{err}</p>}
        </div>
      ) : (
        <div className="stack">
          <p className="muted">Controlla e correggi prima di aggiungere. Gli allergeni non vengono dedotti: vanno indicati piatto per piatto.</p>
          <div className="imp-table">
            <div className="imp-row imp-head"><span>Categoria</span><span>Piatto</span><span>Descrizione</span><span>Prezzo</span><span /></div>
            {rows.map((r, i) => (
              <div className="imp-row" key={i}>
                <input aria-label="Categoria" value={r.category} onChange={(e) => edit(i, { category: e.target.value })} />
                <input aria-label="Piatto" value={r.name} onChange={(e) => edit(i, { name: e.target.value })} />
                <input aria-label="Descrizione" value={r.desc} onChange={(e) => edit(i, { desc: e.target.value })} />
                <input aria-label="Prezzo" type="number" step="0.5" value={r.price ?? ''} onChange={(e) => edit(i, { price: e.target.value === '' ? null : Number(e.target.value) })} />
                <Btn small icon={P.x} aria-label="Scarta riga" onClick={() => setRows(rows.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

export function Editor() {
  const { venue, updateDraft } = useApp()
  const cats = venue!.draft.categories
  const [editing, setEditing] = useState<{ dish: Dish; catId: string; isNew: boolean } | null>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState(false)
  const [closed, setClosed] = useState<string[]>([])
  const newCat = useRef<string | null>(null)

  const addCat = () => { const id = uid(); newCat.current = id; updateDraft((d) => { d.categories.push({ id, name: 'Nuova categoria', active: true, dishes: [] }) }) }
  const cat = (id: string, fn: (c: (typeof cats)[number]) => void) => updateDraft((d) => { const c = d.categories.find((x) => x.id === id); if (c) fn(c) })
  const dupCat = (id: string) => updateDraft((d) => {
    const i = d.categories.findIndex((x) => x.id === id), c = d.categories[i]
    d.categories.splice(i + 1, 0, { ...c, id: uid(), name: c.name + ' (copia)', dishes: c.dishes.map((x) => ({ ...x, id: uid() })) })
  })
  const delCat = (id: string) => {
    const c = cats.find((x) => x.id === id)!
    if (c.dishes.length && !window.confirm(`Eliminare “${c.name}” e i suoi ${c.dishes.length} piatti?`)) return
    updateDraft((d) => { d.categories = d.categories.filter((x) => x.id !== id) })
  }
  const dupDish = (cid: string, did: string) => cat(cid, (c) => {
    const i = c.dishes.findIndex((x) => x.id === did)
    c.dishes.splice(i + 1, 0, { ...c.dishes[i], id: uid(), name: c.dishes[i].name + ' (copia)' })
  })

  return (
    <>
      <div className="head">
        <h1>Menù</h1>
        <div className="head-actions">
          <Btn icon={P.up} onClick={() => setImporting(true)}>Importa</Btn>
          <Link to="/stampa" className="btn btn--ghost"><Ico d={P.print} size={17} />Versione stampabile</Link>
          <Btn className="only-narrow" icon={P.eye} onClick={() => setPreview(true)}>Anteprima</Btn>
          <Btn kind="blue" icon={P.plus} onClick={addCat}>Categoria</Btn>
        </div>
      </div>

      <div className="split">
        <div className="split-main">
          {cats.length === 0 && (
            <section className="panel empty">
              <p>Nessuna categoria. Parti da un menù che hai già oppure crea la prima categoria.</p>
              <div className="head-actions center"><Btn kind="yellow" icon={P.up} onClick={() => setImporting(true)}>Importa un menù</Btn><Btn kind="blue" icon={P.plus} onClick={addCat}>Categoria</Btn></div>
            </section>
          )}
          <Sortable items={cats} onReorder={(next) => updateDraft((d) => { d.categories = next })} render={(c, handle) => {
            const isClosed = closed.includes(c.id)
            return (
              <section className={`panel cat${c.active ? '' : ' cat--off'}`}>
                <div className="cat-head">
                  {handle}
                  <button type="button" className="fold" aria-expanded={!isClosed} aria-label={isClosed ? 'Apri categoria' : 'Chiudi categoria'} onClick={() => setClosed((x) => (isClosed ? x.filter((y) => y !== c.id) : [...x, c.id]))}><Ico d={isClosed ? P.chev : P.down} size={16} /></button>
                  <input className="cat-name" aria-label="Nome categoria" value={c.name} autoFocus={newCat.current === c.id} onFocus={(e) => newCat.current === c.id && e.target.select()} onChange={(e) => cat(c.id, (x) => { x.name = e.target.value })} />
                  <span className="count">{c.dishes.length}</span>
                  <Toggle on={c.active} onChange={(on) => cat(c.id, (x) => { x.active = on })} label={`Categoria ${c.name} visibile`} />
                  <Btn small icon={P.copy} aria-label="Duplica categoria" title="Duplica categoria" onClick={() => dupCat(c.id)} />
                  <Btn small icon={P.trash} aria-label="Elimina categoria" title="Elimina categoria" onClick={() => delCat(c.id)} />
                </div>
                {!isClosed && (
                  <div className="cat-body">
                    <Sortable items={c.dishes} onReorder={(next) => cat(c.id, (x) => { x.dishes = next })} render={(d, h) => (
                      <div className="row dish">
                        {h}
                        <button type="button" className="dish-main" onClick={() => setEditing({ dish: d, catId: c.id, isNew: false })}>
                          {d.photo && <img src={d.photo} alt="" />}
                          <span><strong>{d.name}</strong>{d.desc && <small>{d.desc}</small>}{d.allergens.length === 0 && <small className="warn">Allergeni non indicati</small>}</span>
                        </button>
                        <label className="price"><input aria-label={`Prezzo di ${d.name}`} type="number" min="0" step="0.5" inputMode="decimal" value={d.price ?? ''} onChange={(e) => cat(c.id, (x) => { x.dishes.find((y) => y.id === d.id)!.price = e.target.value === '' ? null : Number(e.target.value) })} /><span>€</span></label>
                        <Btn small icon={P.copy} aria-label={`Duplica ${d.name}`} title="Duplica" onClick={() => dupDish(c.id, d.id)} />
                      </div>
                    )} />
                    <Btn kind="yellow" small icon={P.plus} onClick={() => setEditing({ dish: blank(), catId: c.id, isNew: true })}>Aggiungi piatto</Btn>
                  </div>
                )}
              </section>
            )
          }} />
        </div>
        <aside className="split-side no-print"><Preview /></aside>
      </div>

      {editing && <DishModal {...editing} onClose={() => setEditing(null)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
      {preview && <Modal title="Anteprima" onClose={() => setPreview(false)}><Preview /></Modal>}
    </>
  )
}
