import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { contrast } from '../../themes'
import { useApp } from '../ctx'
import { Btn, Field, P, Seg, Toggle } from '../ui'

type Opts = { fg: string; round: boolean; logo?: string }

/** QR in SVG vettoriale: va bene a qualunque dimensione di stampa. Con il logo al centro si alza la correzione d'errore. */
export function qrSvg(url: string, { fg, round, logo }: Opts) {
  const qr = qrcode(0, logo ? 'H' : 'M')
  qr.addData(url)
  qr.make()
  const n = qr.getModuleCount(), q = 3, size = n + q * 2
  const hole = logo ? Math.max(5, Math.floor(n * 0.24) | 1) : 0
  const from = (n - hole) / 2, to = from + hole
  // i tre riquadri d'angolo restano pieni anche nella versione arrotondata: sono ciò che il telefono cerca per primo
  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)
  let cells = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!qr.isDark(r, c)) continue
    if (hole && r >= from && r < to && c >= from && c < to) continue
    if (round && inFinder(r, c)) continue
    cells += round
      ? `<rect x="${c + q}" y="${r + q}" width="1" height="1" rx=".3"/>`
      : `<rect x="${c + q}" y="${r + q}" width="1.02" height="1.02"/>`
  }
  if (round) for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = c + q, y = r + q
    cells += `<path fill-rule="evenodd" d="M${x + 2} ${y}h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zM${x + 1.8} ${y + 1}a.8.8 0 0 0-.8.8v3.4a.8.8 0 0 0 .8.8h3.4a.8.8 0 0 0 .8-.8v-3.4a.8.8 0 0 0-.8-.8z"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".9"/>`
  }
  const img = logo ? `<image href="${logo}" x="${from + q + 0.5}" y="${from + q + 0.5}" width="${hole - 1}" height="${hole - 1}" preserveAspectRatio="xMidYMid meet"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="1024" height="1024"><rect width="${size}" height="${size}" fill="#fff"/><g fill="${fg}">${cells}</g>${img}</svg>`
}

const download = (name: string, blob: Blob) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export function Qr() {
  const { venue, publicUrl, toast } = useApp()
  const v = venue!
  const [fg, setFg] = useState('#141414')
  const [round, setRound] = useState<'quadrati' | 'tondi'>('quadrati')
  const [withLogo, setWithLogo] = useState(false)
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(8)
  const [cards, setCards] = useState<number[] | null>(null)
  const opts: Opts = { fg, round: round === 'tondi', logo: withLogo ? v.draft.logo : undefined }
  const svg = useMemo(() => qrSvg(publicUrl, opts), [publicUrl, fg, round, withLogo, v.draft.logo])
  const weak = contrast(fg, '#ffffff') < 4

  const png = () => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = 2048
      c.getContext('2d')!.drawImage(img, 0, 0, 2048, 2048)
      c.toBlob((b) => b && download(`qr-${v.slug}.png`, b), 'image/png')
    }
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  }
  const print = (list: number[]) => { setCards(list); setTimeout(() => window.print(), 150) }
  const tables = () => {
    const a = Math.max(1, Math.min(from, to)), b = Math.min(a + 199, Math.max(from, to))
    print(Array.from({ length: b - a + 1 }, (_, i) => a + i))
  }

  return (
    <>
      <div className="head no-print"><h1>QR code</h1></div>
      <div className="cols cols--qr no-print">
        <section className="panel pad qr-box">
          <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="url">{publicUrl}</p>
          <div className="head-actions center">
            <Btn icon={P.copy} onClick={() => navigator.clipboard?.writeText(publicUrl).then(() => toast('Indirizzo copiato'))}>Copia indirizzo</Btn>
            <a className="btn btn--ghost" href={publicUrl} target="_blank" rel="noreferrer">Apri il menù</a>
          </div>
          {!v.published && <p className="note">Il menù non è ancora pubblicato: chi inquadra il QR vede una pagina di cortesia.</p>}
        </section>

        <section className="panel pad stack">
          <h2>Aspetto</h2>
          <label className="color"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} aria-label="Colore del QR" /><span><strong>Colore</strong><small>{fg.toUpperCase()}</small></span></label>
          {weak && <p className="note" role="status">Questo colore è troppo chiaro: molti telefoni non riusciranno a leggere il codice. Scegline uno più scuro.</p>}
          <div className="field"><span>Moduli</span><Seg label="Moduli" value={round} onChange={setRound} options={[{ id: 'quadrati', label: 'Quadrati' }, { id: 'tondi', label: 'Arrotondati' }]} /></div>
          <div className="switch-row"><span><strong>Logo al centro</strong><small>{v.draft.logo ? 'Usa il logo caricato in Aspetto' : 'Carica prima un logo in Aspetto'}</small></span><Toggle on={withLogo && !!v.draft.logo} onChange={(x) => setWithLogo(x && !!v.draft.logo)} label="Logo al centro" /></div>
          <h2>Scarica</h2>
          <div className="head-actions">
            <Btn kind="blue" icon={P.dl} onClick={() => download(`qr-${v.slug}.svg`, new Blob([svg], { type: 'image/svg+xml' }))}>SVG per la tipografia</Btn>
            <Btn icon={P.dl} onClick={png}>PNG 2048 px</Btn>
          </div>
          <h2>Biglietti da tavolo</h2>
          <p className="muted">Quattro biglietti per foglio A4, da stampare o salvare in PDF. Prova sempre una scansione prima di stampare in quantità.</p>
          <div className="two">
            <Field label="Dal tavolo"><input type="number" min="1" value={from} onChange={(e) => setFrom(Number(e.target.value) || 1)} /></Field>
            <Field label="Al tavolo"><input type="number" min="1" value={to} onChange={(e) => setTo(Number(e.target.value) || 1)} /></Field>
          </div>
          <div className="head-actions">
            <Btn kind="yellow" icon={P.print} onClick={tables}>Stampa numerati</Btn>
            <Btn icon={P.print} onClick={() => print([0, 0, 0, 0])}>Stampa senza numero</Btn>
          </div>
        </section>
      </div>

      {cards && (
        <div className="print-only cards">
          {cards.map((n, i) => (
            <div className="card" key={i}>
              <strong>{v.name}</strong>
              <div dangerouslySetInnerHTML={{ __html: svg }} />
              <span>Inquadra per il menù</span>
              {n > 0 && <em>Tavolo {n}</em>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
