import type { Theme } from './types'

/* Un template è un preset di token su un layout strutturale: per aggiungerne uno basta una voce qui
   (domani: una riga nel database), non codice dedicato. */

export const FONTS: Record<string, { label: string; head: string; body: string; headUpper: boolean; load: () => Promise<unknown> }> = {
  vivace: {
    label: 'Vivace · Bebas + Bricolage',
    head: "'Bebas Neue', Impact, sans-serif",
    body: "'Bricolage Grotesque', system-ui, sans-serif",
    headUpper: true,
    load: () => Promise.all([
      import('@fontsource/bebas-neue/latin-400.css'),
      import('@fontsource/bricolage-grotesque/latin-400.css'),
      import('@fontsource/bricolage-grotesque/latin-600.css'),
    ]),
  },
  classico: {
    label: 'Classico · Playfair + Lato',
    head: "'Playfair Display', Georgia, serif",
    body: "'Lato', system-ui, sans-serif",
    headUpper: false,
    load: () => Promise.all([
      import('@fontsource/playfair-display/latin-600.css'),
      import('@fontsource/lato/latin-400.css'),
      import('@fontsource/lato/latin-700.css'),
    ]),
  },
  moderno: {
    label: 'Moderno · DM Sans',
    head: "'DM Sans', system-ui, sans-serif",
    body: "'DM Sans', system-ui, sans-serif",
    headUpper: false,
    load: () => Promise.all([
      import('@fontsource/dm-sans/latin-400.css'),
      import('@fontsource/dm-sans/latin-600.css'),
      import('@fontsource/dm-sans/latin-700.css'),
    ]),
  },
  elegante: {
    label: 'Elegante · Cormorant + Jost',
    head: "'Cormorant Garamond', Georgia, serif",
    body: "'Jost', system-ui, sans-serif",
    headUpper: false,
    load: () => Promise.all([
      import('@fontsource/cormorant-garamond/latin-600.css'),
      import('@fontsource/jost/latin-400.css'),
      import('@fontsource/jost/latin-500.css'),
    ]),
  },
}

const base: Omit<Theme, 'preset' | 'layout' | 'primary' | 'accent' | 'bg' | 'font'> = {
  scale: 'normale', radius: 'tondo', density: 'normale', card: 'sfondo', photo: 'lato', showDesc: true, showBadges: true,
}

export const PRESETS: { id: string; name: string; hint: string; theme: Theme }[] = [
  { id: 'vivace', name: 'Vivace', hint: 'Verde salvia, pillole, titoli condensati',
    theme: { ...base, preset: 'vivace', layout: 'lista', primary: '#3355d4', accent: '#cddbb5', bg: '#ffffff', font: 'vivace' } },
  { id: 'trattoria', name: 'Trattoria', hint: 'Carta crema e rosso mattone',
    theme: { ...base, preset: 'trattoria', layout: 'lista', primary: '#a3342a', accent: '#efe2c6', bg: '#fbf6ec', font: 'classico', radius: 'morbido', card: 'nessuno', photo: 'nessuna' } },
  { id: 'forno', name: 'Forno a legna', hint: 'Schede con foto, arancio brace',
    theme: { ...base, preset: 'forno', layout: 'schede', primary: '#d2470f', accent: '#ffd9a8', bg: '#fff8f0', font: 'vivace', photo: 'alto' } },
  { id: 'notte', name: 'Notte', hint: 'Scuro con accenti oro',
    theme: { ...base, preset: 'notte', layout: 'schede', primary: '#f0c04a', accent: '#262a33', bg: '#14161b', font: 'moderno', radius: 'morbido', photo: 'lato' } },
  { id: 'fresco', name: 'Fresco', hint: 'Griglia verde per bar e poke',
    theme: { ...base, preset: 'fresco', layout: 'griglia', primary: '#1c7f55', accent: '#cdeedd', bg: '#f4fbf6', font: 'moderno', photo: 'alto' } },
  { id: 'carta', name: 'Carta bianca', hint: 'Editoriale, solo testo',
    theme: { ...base, preset: 'carta', layout: 'editoriale', primary: '#1d1d1b', accent: '#f1efe9', bg: '#ffffff', font: 'elegante', radius: 'vivo', density: 'ariosa', card: 'nessuno', photo: 'nessuna', scale: 'ampia' } },
]

export const LAYOUTS: { id: Theme['layout']; name: string; hint: string }[] = [
  { id: 'lista', name: 'Lista compatta', hint: 'Menù lunghi, pizzerie, trattorie' },
  { id: 'schede', name: 'Scheda con foto', hint: 'Locali con foto curate' },
  { id: 'griglia', name: 'Griglia', hint: 'Bar, gelaterie, poke' },
  { id: 'editoriale', name: 'Editoriale', hint: 'Menù corti, fascia alta' },
]

/* ---------- colore e contrasto ---------- */

const toRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0')
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) || 0)
}
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const lum = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a), B = toRgb(b)
  return toHex(A.map((v, i) => v + (B[i] - v) * t))
}
const INK = '#17181c', PAPER = '#f7f6f2'
export const onColor = (bg: string) => (contrast(bg, INK) >= contrast(bg, PAPER) ? INK : PAPER)

/** Porta `color` ad almeno `min` di contrasto su `bg`, spostandolo verso il testo leggibile. */
export const readable = (color: string, bg: string, min = 4.5) => {
  if (contrast(color, bg) >= min) return color
  const target = onColor(bg)
  for (let t = 0.1; t <= 1; t += 0.1) {
    const c = mix(color, target, t)
    if (contrast(c, bg) >= min) return c
  }
  return target
}

const RADIUS = { vivo: 2, morbido: 10, tondo: 20 }
const SCALE = { compatta: 14.5, normale: 16, ampia: 17.5 }
const DENSITY = { compatta: 0.7, normale: 1, ariosa: 1.35 }

export function themeVars(t: Theme): { vars: Record<string, string>; corrected: boolean; headUpper: boolean } {
  const font = FONTS[t.font] ?? FONTS.vivace
  const text = onColor(t.bg)
  const ink = readable(t.primary, t.bg)
  const surface = mix(t.bg, text, 0.055)
  return {
    corrected: ink.toLowerCase() !== t.primary.toLowerCase(),
    headUpper: font.headUpper,
    vars: {
      '--m-bg': t.bg,
      '--m-text': text,
      '--m-muted': mix(text, t.bg, 0.38),
      '--m-line': mix(t.bg, text, 0.13),
      '--m-surface': surface,
      '--m-primary': t.primary,
      '--m-on-primary': onColor(t.primary),
      '--m-ink': ink,
      '--m-accent': t.accent,
      '--m-on-accent': onColor(t.accent),
      '--m-radius': RADIUS[t.radius] + 'px',
      '--m-fs': SCALE[t.scale] + 'px',
      '--m-d': String(DENSITY[t.density]),
      '--m-font-h': font.head,
      '--m-font-b': font.body,
    },
  }
}

export const loadFont = (id: string) => (FONTS[id] ?? FONTS.vivace).load().catch(() => {})
