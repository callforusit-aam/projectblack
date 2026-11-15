import { useApp } from './ctx'
import { MenuView } from '../public/MenuView'

/** Anteprima in formato telefono: stessa vista della pagina pubblica, sulla bozza. */
export function Preview() {
  const { venue } = useApp()
  const v = venue!
  return (
    <div className="phone" aria-label="Anteprima del menù">
      <div className="phone-screen"><MenuView doc={v.draft} soldOut={v.soldOut} name={v.name} embedded /></div>
    </div>
  )
}
