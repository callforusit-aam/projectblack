import type { PublicMenu, Venue } from '../types'
import { readDb } from './localdb'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const isSupabase = Boolean(URL_ && KEY)

export function toPublic(v: Venue | undefined): PublicMenu {
  if (!v) return { state: 'non-trovato' }
  const info = (v.published ?? v.draft).info
  if (v.status === 'sospeso') return { state: 'sospeso', name: v.name, phone: info.phone, address: info.address }
  if (!v.published) return { state: 'non-pubblicato', name: v.name, phone: info.phone, address: info.address }
  return { state: 'ok', name: v.name, doc: v.published, soldOut: v.soldOut }
}

/** Lettura pubblica: una sola richiesta che restituisce lo snapshot pubblicato. Niente SDK, per restare leggeri. */
export async function getPublic(slug: string): Promise<PublicMenu> {
  if (!isSupabase) return toPublic(readDb().venues.find((v) => v.slug === slug))
  const res = await fetch(`${URL_}/rest/v1/rpc/public_menu`, {
    method: 'POST',
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug }),
  })
  if (!res.ok) throw new Error('Menù non raggiungibile')
  const row = await res.json()
  if (!row) return { state: 'non-trovato' }
  return row as PublicMenu
}
