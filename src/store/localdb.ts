import type { LogEntry, Venue, Version } from '../types'
import { seedVenues } from '../seed'

export type Db = { venues: Venue[]; versions: Record<string, Version[]>; log: LogEntry[] }
const KEY = 'pb.db.v1'

export function readDb(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* storage non disponibile: si riparte dal seed */ }
  const db: Db = { venues: seedVenues(), versions: {}, log: [] }
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* idem */ }
  return db
}

export function writeDb(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    throw new Error('Spazio del browser esaurito: in modalità demo le foto restano nel browser. Rimuovi qualche foto o collega il database.')
  }
}

export const resetDb = () => { try { localStorage.removeItem(KEY) } catch { /* niente */ } }
