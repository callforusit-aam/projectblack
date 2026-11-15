import { createClient } from '@supabase/supabase-js'
import type { Role, Session, Venue, VenueSummary } from '../types'
import { emptyDoc } from '../seed'
import type { Store } from './types'

/* Adattatore Supabase. Il menù è un documento JSON per locale (draft / published):
   una lettura per aprire il pannello, una per la pagina pubblica. Schema in supabase/migrations. */

const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
const IMP = 'pb.impersonate'

const toVenue = (r: any): Venue => ({
  id: r.id, slug: r.slug, name: r.name, status: r.status, trialEnds: r.trial_ends, createdAt: r.created_at,
  lastAccess: r.last_access, draft: r.draft, published: r.published, publishedAt: r.published_at, soldOut: r.sold_out ?? [],
})
const must = <T,>(res: { data: T | null; error: { message: string } | null }): T => {
  if (res.error) throw new Error(res.error.message)
  return res.data as T
}

async function buildSession(): Promise<Session | null> {
  const { data } = await sb.auth.getUser()
  const user = data.user
  if (!user) return null
  const email = user.email ?? ''
  const admin = await sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (admin.data) {
    const venueId = sessionStorage.getItem(IMP)
    return { email, role: 'fornitore', venueId, impersonating: !!venueId }
  }
  const m = await sb.from('members').select('venue_id, role').eq('user_id', user.id).limit(1).maybeSingle()
  if (!m.data) throw new Error('Questo utente non è collegato a nessun locale.')
  await sb.rpc('touch_venue', { p_venue: m.data.venue_id })
  return { email, role: m.data.role as Role, venueId: m.data.venue_id }
}

export const supabaseStore: Store = {
  mode: 'supabase',
  getSession: buildSession,
  async signIn(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Email o password non corretti')
    const s = await buildSession()
    if (!s) throw new Error('Accesso non riuscito')
    return s
  },
  async demoSignIn() { throw new Error('Non disponibile') },
  async signOut() { sessionStorage.removeItem(IMP); await sb.auth.signOut() },
  async impersonate(venueId) {
    venueId ? sessionStorage.setItem(IMP, venueId) : sessionStorage.removeItem(IMP)
    const s = await buildSession()
    if (!s) throw new Error('Sessione scaduta')
    if (venueId) { const v = await this.getVenue(venueId); await this.log(v.name, 'Accesso come cliente') }
    return s
  },
  async getVenue(id) { return toVenue(must(await sb.from('venues').select('*').eq('id', id).single())) },
  async saveDraft(id, doc) { must(await sb.from('venues').update({ draft: doc }).eq('id', id).select('id')) },
  async publish(id, by) { return toVenue(must(await sb.rpc('publish_menu', { p_venue: id, p_author: by }))) },
  async setSoldOut(id, ids) { must(await sb.rpc('set_sold_out', { p_venue: id, p_ids: ids })) },
  async listVersions(id) {
    const rows = must(await sb.from('versions').select('id, created_at, author, doc').eq('venue_id', id).order('created_at', { ascending: false }).limit(15)) as any[]
    return rows.map((r) => ({ id: r.id, at: r.created_at, by: r.author, doc: r.doc }))
  },
  async listVenues() {
    const rows = must(await sb.from('venues').select('*').order('created_at')) as any[]
    return rows.map((r): VenueSummary => {
      const v = toVenue(r)
      return { id: v.id, slug: v.slug, name: v.name, status: v.status, trialEnds: v.trialEnds, createdAt: v.createdAt, lastAccess: v.lastAccess,
        publishedAt: v.publishedAt, isPublished: !!v.published, dishes: v.draft.categories.reduce((n, c) => n + c.dishes.length, 0) }
    })
  },
  async createVenue({ name, slug, preset }) {
    const res = await sb.from('venues').insert({ name, slug, status: 'prova', trial_ends: new Date(Date.now() + 30 * 864e5).toISOString(), draft: emptyDoc(preset) }).select('*').single()
    if (res.error) throw new Error(res.error.code === '23505' ? 'Indirizzo già usato da un altro locale' : res.error.message)
    await this.log(name, 'Locale creato')
    return toVenue(res.data)
  },
  async setStatus(id, status) {
    const v = toVenue(must(await sb.rpc('set_venue_status', { p_venue: id, p_status: status })))
    await this.log(v.name, status === 'sospeso' ? 'Locale sospeso' : 'Locale riattivato')
  },
  async listLog() {
    const rows = must(await sb.from('activity').select('*').order('at', { ascending: false }).limit(40)) as any[]
    return rows.map((r) => ({ id: r.id, at: r.at, actor: r.actor, venue: r.venue, action: r.action }))
  },
  async log(venue, action) {
    const { data } = await sb.auth.getUser()
    await sb.from('activity').insert({ venue, action, actor: data.user?.email ?? '' })
  },
  async uploadImage(venueId, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob()
    const path = `${venueId}/${crypto.randomUUID()}.jpg`
    const up = await sb.storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
    if (up.error) throw new Error(up.error.message)
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl
  },
}
