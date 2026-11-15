import type { Info } from '../../types'
import { DAYS } from '../../types'
import { useApp } from '../ctx'
import { Field, Toggle } from '../ui'

export function Locale() {
  const { venue, updateDraft } = useApp()
  const info = venue!.draft.info
  const set = <K extends keyof Info>(k: K, val: Info[K]) => updateDraft((d) => { d.info[k] = val })
  const txt = (k: 'legalName' | 'vat' | 'address' | 'phone' | 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'wifi' | 'servizio' | 'tagline', label: string, hint?: string, type = 'text') => (
    <Field label={label} hint={hint}><input type={type} value={info[k]} onChange={(e) => set(k, e.target.value)} /></Field>
  )

  return (
    <>
      <div className="head"><h1>Locale</h1></div>
      <div className="cols">
        <section className="panel pad stack">
          <h2>Sul menù</h2>
          <Field label="Nome del locale" hint="Lo modifica il fornitore: compare anche nell'indirizzo del menù."><input value={venue!.name} disabled /></Field>
          {txt('tagline', 'Sottotitolo', 'Una riga sotto il nome, facoltativa')}
          {txt('address', 'Indirizzo')}
          {txt('phone', 'Telefono', undefined, 'tel')}
          {txt('whatsapp', 'WhatsApp', undefined, 'tel')}
          {txt('instagram', 'Instagram', 'Solo il nome del profilo')}
          {txt('wifi', 'Password Wi-Fi')}
        </section>

        <section className="panel pad stack">
          <h2>Coperto e avvertenze</h2>
          <Field label="Coperto (€)" hint="Lascia vuoto se non applicato">
            <input type="number" min="0" step="0.5" inputMode="decimal" value={info.coperto ?? ''} onChange={(e) => set('coperto', e.target.value === '' ? null : Number(e.target.value))} />
          </Field>
          {txt('servizio', 'Servizio', 'Es. “Servizio 10%”. Lascia vuoto se non applicato')}
          <div className="switch-row"><span><strong>Possibile uso di surgelati</strong><small>Aggiunge la dicitura sulla sostituzione con prodotto surgelato</small></span><Toggle on={info.frozenNote} onChange={(x) => set('frozenNote', x)} label="Dicitura surgelati" /></div>
          <div className="switch-row"><span><strong>Pesce crudo abbattuto</strong><small>Dicitura sulla bonifica preventiva, Reg. CE 853/2004</small></span><Toggle on={info.rawFishNote} onChange={(x) => set('rawFishNote', x)} label="Dicitura pesce crudo" /></div>
          <h2>Dati fiscali</h2>
          {txt('legalName', 'Ragione sociale')}
          {txt('vat', 'Partita IVA')}
          {txt('email', 'Email', undefined, 'email')}
        </section>

        <section className="panel pad stack">
          <h2>Orari</h2>
          {DAYS.map((day, i) => (
            <Field key={day} label={day}>
              <input value={info.hours[i] ?? ''} placeholder="Es. 19:00 – 23:30 oppure Chiuso" onChange={(e) => updateDraft((d) => { d.info.hours[i] = e.target.value })} />
            </Field>
          ))}
        </section>
      </div>
    </>
  )
}
