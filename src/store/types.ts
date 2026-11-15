import type { LogEntry, MenuDoc, Role, Session, Venue, VenueStatus, VenueSummary, Version } from '../types'

export interface Store {
  mode: 'demo' | 'supabase'
  getSession(): Promise<Session | null>
  signIn(email: string, password: string): Promise<Session>
  demoSignIn(role: Role): Promise<Session>
  signOut(): Promise<void>
  impersonate(venueId: string | null): Promise<Session>
  getVenue(id: string): Promise<Venue>
  saveDraft(id: string, doc: MenuDoc): Promise<void>
  publish(id: string, by: string): Promise<Venue>
  setSoldOut(id: string, ids: string[]): Promise<void>
  listVersions(id: string): Promise<Version[]>
  listVenues(): Promise<VenueSummary[]>
  createVenue(input: { name: string; slug: string; preset: string }): Promise<Venue>
  setStatus(id: string, status: VenueStatus): Promise<void>
  listLog(): Promise<LogEntry[]>
  log(venue: string, action: string): Promise<void>
  uploadImage(venueId: string, dataUrl: string): Promise<string>
}
