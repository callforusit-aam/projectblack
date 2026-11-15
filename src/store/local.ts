import type { Role, Session, Venue, VenueSummary } from '../types'
import { uid } from '../types'
import { emptyDoc } from '../seed'
import { readDb, writeDb } from './localdb'
import type { Store } from './types'

const SKEY = 'pb.session'
const copy = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const readSession = (): Session | null => { try { return JSON.parse(localStorage.getItem(SKEY) || 'null') } catch { return null } }
const writeSession = (s: Session | null) => { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY) } catch { /* niente */ } }

const find = (id: string) => {
  const db = readDb()
  const v = db.venues.find((x) => x.id === id)
  if (!v) throw new Error('Locale non trovato')
  return { db, v }
}

export const summary = (v: Venue): VenueSummary => ({
  id: v.id, slug: v.slug, name: v.name, status: v.status, trialEnds: v.trialEnds, createdAt: v.createdAt,
  lastAccess: v.lastAccess, publishedAt: v.publishedAt, isPublished: !!v.published,
  dishes: v.draft.categories.reduce((n, c) => n + c.dishes.length, 0),
})

export const localStore: Store = {
  mode: 'demo',
  async getSession() { return readSession() },
  async signIn() { throw new Error('In modalità demo scegli un ruolo qui sotto.') },
  async demoSignIn(role: Role) {
    const s: Session = role === 'fornitore'
      ? { email: 'fornitore@demo', role, venueId: null }
      : { email: `${role}@demo`, role, venueId: readDb().venues[0].id }
    if (s.venueId) { const { db, v } = find(s.venueId); v.lastAccess = new Date().toISOString(); writeDb(db) }
    writeSession(s)
    return s
  },
  async signOut() { writeSession(null) },
  async impersonate(venueId) {
    const cur = readSession()
    const s: Session = { email: cur?.email ?? 'fornitore@demo', role: 'fornitore', venueId, impersonating: !!venueId }
    writeSession(s)
    if (venueId) await this.log(find(venueId).v.name, 'Accesso come cliente')
    return s
  },
  async getVenue(id) { return find(id).v },
  async saveDraft(id, doc) { const { db, v } = find(id); v.draft = doc; writeDb(db) },
  async publish(id, by) {
    const { db, v } = find(id)
    v.published = copy(v.draft)
    v.publishedAt = new Date().toISOString()
    const list = db.versions[id] ?? (db.versions[id] = [])
    list.unshift({ id: uid(), at: v.publishedAt, by, doc: copy(v.draft) })
    db.versions[id] = list.slice(0, 15)
    db.log.unshift({ id: uid(), at: v.publishedAt, actor: by, venue: v.name, action: 'Menù pubblicato' })
    writeDb(db)
    return v
  },
  async setSoldOut(id, ids) { const { db, v } = find(id); v.soldOut = ids; writeDb(db) },
  async listVersions(id) { return readDb().versions[id] ?? [] },
  async listVenues() { return readDb().venues.map(summary) },
  async createVenue({ name, slug, preset }) {
    const db = readDb()
    if (db.venues.some((v) => v.slug === slug)) throw new Error('Indirizzo già usato da un altro locale')
    const v: Venue = {
      id: 'v-' + uid(), slug, name, status: 'prova', trialEnds: new Date(Date.now() + 30 * 864e5).toISOString(),
      createdAt: new Date().toISOString(), lastAccess: null, draft: emptyDoc(preset), published: null, publishedAt: null, soldOut: [],
    }
    db.venues.push(v)
    db.log.unshift({ id: uid(), at: v.createdAt, actor: readSession()?.email ?? '', venue: name, action: 'Locale creato' })
    writeDb(db)
    return v
  },
  async setStatus(id, status) {
    const { db, v } = find(id)
    v.status = status
    if (status === 'attivo') v.trialEnds = null
    db.log.unshift({ id: uid(), at: new Date().toISOString(), actor: readSession()?.email ?? '', venue: v.name, action: status === 'sospeso' ? 'Locale sospeso' : 'Locale riattivato' })
    writeDb(db)
  },
  async listLog() { return readDb().log.slice(0, 40) },
  async log(venue, action) {
    const db = readDb()
    db.log.unshift({ id: uid(), at: new Date().toISOString(), actor: readSession()?.email ?? '', venue, action })
    db.log = db.log.slice(0, 200)
    writeDb(db)
  },
  async uploadImage(_venueId, dataUrl) { return dataUrl },
}
