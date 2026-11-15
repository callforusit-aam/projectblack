import { useEffect, useState } from 'react'
import type { Version } from '../../types'
import { useApp } from '../ctx'
import { Btn, P, fmtDate } from '../ui'

export function Versioni() {
  const { store, venue, updateDraft, toast } = useApp()
  const [list, setList] = useState<Version[] | null>(null)
  useEffect(() => { store.listVersions(venue!.id).then(setList) }, [store, venue!.id, venue!.publishedAt])

  const restore = (v: Version) => {
    updateDraft((d) => Object.assign(d, JSON.parse(JSON.stringify(v.doc))))
    toast('Versione riportata in bozza: controlla e pubblica')
  }

  return (
    <>
      <div className="head"><h1>Cronologia</h1></div>
      <section className="panel">
        <p className="muted pad">Ogni pubblicazione viene conservata (le ultime 15). Il ripristino riporta la versione in bozza: va online solo quando premi Pubblica.</p>
        {list && list.length === 0 && <p className="empty">Nessuna pubblicazione registrata finora.</p>}
        {list?.map((v, i) => (
          <div key={v.id} className="row">
            <span className="row-name">{fmtDate(v.at)}{i === 0 && <span className="chip chip--green">Online</span>}</span>
            <span className="row-state">{v.by} · {v.doc.categories.reduce((n, c) => n + c.dishes.length, 0)} piatti</span>
            <Btn small icon={P.undo} onClick={() => restore(v)}>Ripristina in bozza</Btn>
          </div>
        ))}
      </section>
    </>
  )
}
