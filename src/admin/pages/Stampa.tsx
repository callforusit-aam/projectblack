import { Link } from 'react-router-dom'
import { euro } from '../../types'
import { useApp } from '../ctx'
import { Btn, Ico, P } from '../ui'

/** Versione cartacea: il menù digitale non può essere l'unico modo di consultare il listino. */
export function Stampa() {
  const { venue } = useApp()
  const v = venue!
  const { info } = v.draft
  const cats = v.draft.categories.filter((c) => c.active && c.dishes.length)
  const anyFrozen = cats.some((c) => c.dishes.some((d) => d.frozen))

  return (
    <>
      <div className="head no-print">
        <h1>Versione stampabile</h1>
        <div className="head-actions">
          <Link to="/menu" className="btn btn--ghost"><Ico d={P.undo} size={17} />Torna al menù</Link>
          <Btn kind="blue" icon={P.print} onClick={() => window.print()}>Stampa o salva in PDF</Btn>
        </div>
      </div>
      <article className="sheet">
        <header><h1>{v.name}</h1>{info.tagline && <p>{info.tagline}</p>}</header>
        <div className="sheet-cols">
          {cats.map((c) => (
            <section key={c.id}>
              <h2>{c.name}</h2>
              {c.dishes.map((d) => (
                <div className="sheet-item" key={d.id}>
                  <div><strong>{d.name}{d.frozen ? ' *' : ''}</strong><span>{euro(d.price)}</span></div>
                  {d.desc && <p>{d.desc}</p>}
                  {d.allergens.length > 0 && <small>Allergeni: {d.allergens.join(', ').toLowerCase()}</small>}
                </div>
              ))}
            </section>
          ))}
        </div>
        <footer>
          {info.coperto != null && <p><strong>Coperto {euro(info.coperto)}</strong>{info.servizio && ` · ${info.servizio}`}</p>}
          {info.coperto == null && info.servizio && <p><strong>{info.servizio}</strong></p>}
          <p>Per allergie e intolleranze rivolgersi al personale.{anyFrozen && ' * Prodotto surgelato o congelato all\'origine.'}{info.rawFishNote && ' Il pesce destinato a essere consumato crudo è sottoposto a bonifica preventiva secondo il Reg. CE 853/2004.'} Prezzi in euro, IVA inclusa.</p>
          {(info.address || info.phone) && <p>{[info.address, info.phone].filter(Boolean).join(' · ')}</p>}
        </footer>
      </article>
    </>
  )
}
