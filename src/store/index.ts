import type { Store } from './types'
import { isSupabase } from './public'
import { localStore } from './local'

let cached: Store | null = null
/** Senza variabili Supabase l'app gira in demo; l'SDK viene caricato solo se serve. */
export async function getStore(): Promise<Store> {
  if (cached) return cached
  cached = isSupabase ? (await import('./supabase')).supabaseStore : localStore
  return cached
}
export { isSupabase }
