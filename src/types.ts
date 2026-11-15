export type Dish = {
  id: string
  name: string
  desc: string
  price: number | null
  photo?: string
  allergens: string[]
  tags: string[]
  frozen: boolean
}

export type Category = { id: string; name: string; active: boolean; dishes: Dish[] }

export type Layout = 'lista' | 'schede' | 'griglia' | 'editoriale'

export type Theme = {
  preset: string
  layout: Layout
  primary: string
  accent: string
  bg: string
  font: string
  scale: 'compatta' | 'normale' | 'ampia'
  radius: 'vivo' | 'morbido' | 'tondo'
  density: 'compatta' | 'normale' | 'ariosa'
  card: 'nessuno' | 'bordo' | 'sfondo'
  photo: 'nessuna' | 'lato' | 'alto'
  showDesc: boolean
  showBadges: boolean
}

export type Info = {
  legalName: string
  vat: string
  address: string
  phone: string
  email: string
  whatsapp: string
  instagram: string
  facebook: string
  wifi: string
  coperto: number | null
  servizio: string
  hours: string[] // 7 voci, da lunedì a domenica
  tagline: string
  frozenNote: boolean
  rawFishNote: boolean
}

export type MenuDoc = {
  categories: Category[]
  theme: Theme
  info: Info
  logo?: string
  cover?: string
}

export type Version = { id: string; at: string; by: string; doc: MenuDoc }

export type VenueStatus = 'attivo' | 'prova' | 'sospeso'

export type Venue = {
  id: string
  slug: string
  name: string
  status: VenueStatus
  trialEnds: string | null
  createdAt: string
  lastAccess: string | null
  draft: MenuDoc
  published: MenuDoc | null
  publishedAt: string | null
  soldOut: string[]
}

export type VenueSummary = Omit<Venue, 'draft' | 'published' | 'soldOut'> & { dishes: number; isPublished: boolean }

export type Role = 'titolare' | 'staff' | 'fornitore'

export type Session = { email: string; role: Role; venueId: string | null; impersonating?: boolean }

export type LogEntry = { id: string; at: string; actor: string; venue: string; action: string }

export type PublicMenu =
  | { state: 'ok'; name: string; doc: MenuDoc; soldOut: string[] }
  | { state: 'sospeso' | 'non-pubblicato'; name: string; phone?: string; address?: string }
  | { state: 'non-trovato' }

export const ALLERGENS = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte', 'Frutta a guscio',
  'Sedano', 'Senape', 'Sesamo', 'Solfiti', 'Lupini', 'Molluschi',
]

export const TAGS: { id: string; label: string; short: string }[] = [
  { id: 'vegetariano', label: 'Vegetariano', short: 'V' },
  { id: 'vegano', label: 'Vegano', short: 'VG' },
  { id: 'senza-glutine', label: 'Senza glutine', short: 'SG' },
  { id: 'senza-lattosio', label: 'Senza lattosio', short: 'SL' },
  { id: 'piccante', label: 'Piccante', short: 'Picc' },
]

export const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

export const uid = () => Math.random().toString(36).slice(2, 10)

export const euro = (n: number | null) =>
  n == null ? '' : n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
