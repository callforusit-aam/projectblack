import { useEffect, type ReactNode } from 'react'

export const Ico = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
export const P = {
  plus: 'M12 5v14M5 12h14',
  chev: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  home: 'M4 11l8-7 8 7v9h-5v-6h-6v6H4z',
  menu: 'M5 4h14v16H5zM9 9h6M9 13h6',
  brush: 'M4 20c3 0 4-2 4-4l9-9a2 2 0 0 1 3 3l-9 9c-2 0-4 1-7 1z',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2',
  store: 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  up: 'M12 19V5M5 12l7-7 7 7',
  print: 'M7 8V4h10v4M7 17H5v-7h14v7h-2M8 14h8v6H8z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  out: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9',
  search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
  check: 'M5 12l5 5 9-10',
  undo: 'M4 8h10a6 6 0 0 1 0 12H8M4 8l4-4M4 8l4 4',
  users: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6',
  dl: 'M12 4v11M7 11l5 5 5-5M5 20h14',
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'blue' | 'yellow' | 'ghost' | 'dark' | 'danger'; icon?: string; small?: boolean }
export function Btn({ kind = 'ghost', icon, small, children, className = '', ...rest }: BtnProps) {
  return (
    <button type="button" className={`btn btn--${kind}${small ? ' btn--s' : ''}${children ? '' : ' btn--icon'} ${className}`} {...rest}>
      {icon && <Ico d={icon} size={small ? 15 : 17} />}
      {children}
    </button>
  )
}

/** Badge a stella: figura di servizio delle tessere riassuntive. */
export function Star({ color, icon }: { color: string; icon: string }) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const r = i % 2 ? 23 : 30, a = (Math.PI * 2 * i) / 28
    return `${32 + r * Math.cos(a)},${32 + r * Math.sin(a)}`
  }).join(' ')
  return (
    <svg className="star" viewBox="0 0 64 64" width="60" height="60" aria-hidden="true">
      <polygon points={pts} fill={color} />
      <g transform="translate(20 20)" fill="none" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></g>
    </svg>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  )
}

export function Modal({ title, onClose, children, wide, footer }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-card${wide ? ' modal-card--wide' : ''}`}>
        <header><h2>{title}</h2><Btn icon={P.x} onClick={onClose} aria-label="Chiudi" /></header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

/** Riduce una foto prima di salvarla: i titolari caricano scatti da 8 MB. */
export function compressImage(file: File, max = 1100, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL(type, 0.78))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Immagine non leggibile')) }
    img.src = url
  })
}

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
export const daysAgo = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null)
