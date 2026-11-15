import type { Category, Info, MenuDoc, Venue } from './types'
import { uid } from './types'
import { PRESETS } from './themes'

const d = (name: string, desc: string, price: number, allergens: string[] = [], tags: string[] = [], frozen = false) =>
  ({ id: uid(), name, desc, price, allergens, tags, frozen })

export const emptyInfo = (): Info => ({
  legalName: '', vat: '', address: '', phone: '', email: '', whatsapp: '', instagram: '', facebook: '', wifi: '',
  coperto: null, servizio: '', hours: ['', '', '', '', '', '', ''], tagline: '', frozenNote: true, rawFishNote: false,
})

export const emptyDoc = (presetId = 'vivace'): MenuDoc => ({
  categories: [],
  theme: { ...(PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]).theme },
  info: emptyInfo(),
})

const pizzeria = (): Category[] => [
  { id: uid(), name: 'Antipasti', active: true, dishes: [
    d('Bruschette miste', 'Pomodoro e basilico, crema di olive, lardo e miele', 6.5, ['Glutine'], []),
    d('Tagliere della casa', 'Salumi e formaggi del territorio, confettura di cipolle', 14, ['Latte', 'Solfiti']),
    d('Frittura di paranza', 'Alici, calamari e gamberi', 12, ['Glutine', 'Pesce', 'Crostacei', 'Molluschi'], [], true),
    d('Caponata', 'Melanzane, sedano, capperi e olive in agrodolce', 7, ['Sedano', 'Solfiti'], ['vegano', 'senza-glutine', 'senza-lattosio']),
  ] },
  { id: uid(), name: 'Pizze classiche', active: true, dishes: [
    d('Marinara', 'Pomodoro San Marzano, aglio, origano, olio evo', 5.5, ['Glutine'], ['vegano', 'senza-lattosio']),
    d('Margherita', 'Pomodoro San Marzano, fiordilatte, basilico', 6.5, ['Glutine', 'Latte'], ['vegetariano']),
    d('Diavola', 'Pomodoro, fiordilatte, salame piccante', 8, ['Glutine', 'Latte'], ['piccante']),
    d('Capricciosa', 'Pomodoro, fiordilatte, prosciutto cotto, funghi, carciofi, olive', 9, ['Glutine', 'Latte']),
    d('Quattro formaggi', 'Fiordilatte, gorgonzola, provola, parmigiano', 9, ['Glutine', 'Latte'], ['vegetariano']),
    d('Napoli', 'Pomodoro, fiordilatte, acciughe, capperi', 8, ['Glutine', 'Latte', 'Pesce']),
  ] },
  { id: uid(), name: 'Pizze speciali', active: true, dishes: [
    d('La Brace', 'Provola affumicata, salsiccia, friarielli, peperoncino', 11, ['Glutine', 'Latte'], ['piccante']),
    d('Pistacchio e mortadella', 'Fiordilatte, mortadella, granella e crema di pistacchio', 12.5, ['Glutine', 'Latte', 'Frutta a guscio']),
    d('Ortolana', 'Verdure grigliate di stagione, pomodorini, basilico', 9.5, ['Glutine'], ['vegano', 'senza-lattosio']),
    d('Bufala e crudo', 'Mozzarella di bufala a crudo, prosciutto crudo, rucola', 12, ['Glutine', 'Latte']),
  ] },
  { id: uid(), name: 'Dolci', active: true, dishes: [
    d('Tiramisù', 'Fatto in casa, con savoiardi e mascarpone', 5.5, ['Glutine', 'Latte', 'Uova'], ['vegetariano']),
    d('Cannolo siciliano', 'Ricotta di pecora, scorza d’arancia candita', 4.5, ['Glutine', 'Latte'], ['vegetariano']),
    d('Sorbetto al limone', '', 4, [], ['vegano', 'senza-glutine', 'senza-lattosio']),
  ] },
  { id: uid(), name: 'Bevande', active: true, dishes: [
    d('Acqua naturale o frizzante', '75 cl', 2.5, [], ['vegano']),
    d('Birra alla spina', 'Media 40 cl', 5, ['Glutine']),
    d('Vino della casa', 'Bianco o rosso, mezzo litro', 7, ['Solfiti']),
    d('Caffè', '', 1.5, [], ['vegano']),
  ] },
]

const days = (n: number) => new Date(Date.now() - n * 864e5).toISOString()

export function seedVenues(): Venue[] {
  const brace: MenuDoc = {
    ...emptyDoc('vivace'),
    categories: pizzeria(),
    info: {
      ...emptyInfo(),
      legalName: 'La Brace S.r.l.', vat: 'IT00000000000', address: 'Via Roma 12, 00100 Città', phone: '+39 000 000 0000',
      email: 'info@example.com', whatsapp: '+39 000 000 0000', instagram: 'labrace.demo', wifi: 'labrace2026',
      coperto: 2, servizio: '', tagline: 'Forno a legna dal 1998',
      hours: ['Chiuso', '19:00 – 23:30', '19:00 – 23:30', '19:00 – 23:30', '19:00 – 24:00', '12:30 – 15:00 · 19:00 – 24:00', '12:30 – 15:00 · 19:00 – 23:30'],
    },
  }
  const osteria: MenuDoc = {
    ...emptyDoc('trattoria'),
    categories: [
      { id: uid(), name: 'Primi', active: true, dishes: [
        d('Tagliatelle al ragù', 'Pasta all’uovo tirata a mano', 11, ['Glutine', 'Uova', 'Sedano']),
        d('Risotto ai porcini', '', 13, ['Latte'], ['vegetariano', 'senza-glutine'], true),
      ] },
      { id: uid(), name: 'Secondi', active: true, dishes: [
        d('Tagliata di manzo', 'Rucola, grana e pomodorini', 18, ['Latte'], ['senza-glutine']),
        d('Baccalà in umido', 'Con polenta abbrustolita', 16, ['Pesce']),
      ] },
    ],
    info: { ...emptyInfo(), address: 'Piazza del Borgo 3', phone: '+39 000 000 0001', coperto: 2.5, tagline: 'Cucina di casa' },
  }
  const bar: MenuDoc = {
    ...emptyDoc('fresco'),
    categories: [{ id: uid(), name: 'Caffetteria', active: true, dishes: [d('Espresso', '', 1.3), d('Cappuccino', '', 1.8, ['Latte'])] }],
    info: { ...emptyInfo(), address: 'Corso Italia 40', phone: '+39 000 000 0002' },
  }
  const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
  return [
    { id: 'v-brace', slug: 'la-brace', name: 'Pizzeria La Brace', status: 'attivo', trialEnds: null, createdAt: days(140), lastAccess: days(0),
      draft: brace, published: copy(brace), publishedAt: days(2), soldOut: [brace.categories[2].dishes[1].id] },
    { id: 'v-osteria', slug: 'osteria-del-borgo', name: 'Osteria del Borgo', status: 'prova', trialEnds: days(-18), createdAt: days(12), lastAccess: days(3),
      draft: osteria, published: copy(osteria), publishedAt: days(10), soldOut: [] },
    { id: 'v-bar', slug: 'bar-centrale', name: 'Bar Centrale', status: 'sospeso', trialEnds: null, createdAt: days(300), lastAccess: days(74),
      draft: bar, published: copy(bar), publishedAt: days(200), soldOut: [] },
  ]
}
