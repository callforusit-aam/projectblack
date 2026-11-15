import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { PublicMenu } from '../types'
import { getPublic } from '../store/public'
import { MenuView } from './MenuView'
import './page.css'

const slug = new URLSearchParams(location.search).get('l') ?? ''

function Courtesy({ title, text, phone, address }: { title: string; text: string; phone?: string; address?: string }) {
  return (
    <div className="pg-courtesy">
      <div>
        <h1>{title}</h1>
        <p>{text}</p>
        {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>Chiama {phone}</a>}
        {address && <small>{address}</small>}
      </div>
    </div>
  )
}

function Page() {
  const [menu, setMenu] = useState<PublicMenu | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () => getPublic(slug).then((m) => alive && setMenu(m)).catch(() => alive && setError(true))
    load()
    // gli esauriti cambiano durante il servizio: si riallinea quando il cliente torna sulla pagina
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  useEffect(() => {
    if (menu && menu.state !== 'non-trovato') document.title = `${menu.name} · Menù`
    if (menu?.state === 'ok') document.body.style.background = menu.doc.theme.bg
  }, [menu])

  if (error) return <Courtesy title="Menù non raggiungibile" text="Controlla la connessione e riprova, oppure chiedi il menù al personale." />
  if (!menu) return <div className="pg-loading" aria-label="Caricamento" />
  if (menu.state === 'non-trovato') return <Courtesy title="Menù non trovato" text="Questo indirizzo non corrisponde a nessun locale. Chiedi il menù al personale." />
  if (menu.state !== 'ok')
    return <Courtesy title={menu.name} text="Il menù digitale non è disponibile in questo momento. Chiedi il menù al personale." phone={menu.phone} address={menu.address} />
  return <MenuView doc={menu.doc} soldOut={menu.soldOut} name={menu.name} />
}

createRoot(document.getElementById('root')!).render(<StrictMode><Page /></StrictMode>)
