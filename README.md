# ProjectBlack

Webapp per gestire in autonomia il menù digitale con QR code di ristoranti e pizzerie.
«ProjectBlack» è il nome di lavoro: si cambia in `src/admin/App.tsx` (`Wordmark`) e in `index.html`.

Tre livelli di accesso:

| Livello | Dove | Cosa fa |
| --- | --- | --- |
| Cliente finale | `m/?l=<indirizzo-locale>` | Legge il menù: categorie, ricerca, filtri, allergeni, esauriti |
| Locale (titolare, staff) | `index.html` | Esauriti del giorno, editor menù, aspetto, QR, anagrafica, cronologia |
| Fornitore | `index.html` | Elenco clienti, creazione locale, accesso come cliente, sospensione |

## Avvio

```bash
npm install
npm run dev      # sviluppo
npm run build    # produzione, in dist/
```

Senza configurazione l'app gira in **modalità demo**: i dati stanno nel `localStorage` del browser, con tre locali di esempio.
Il menù aperto da un altro dispositivo mostra quindi solo i dati di esempio, non le modifiche fatte nel pannello.

## Collegare Supabase

1. Creare un progetto Supabase e applicare, in ordine, i file in `supabase/migrations/`.
2. Copiare `.env.example` in `.env` e inserire URL e chiave pubblica del progetto.
3. Creare gli utenti da Authentication, poi collegarli:
   - fornitore: una riga in `admins` con il suo `user_id`;
   - titolare o staff: una riga in `members` con `venue_id`, `user_id` e `role` (`titolare` oppure `staff`).

Per la pubblicazione su GitHub Pages le due variabili vanno in *Settings → Secrets and variables → Actions → Variables*.

Stato: lo schema e le regole di accesso (`0001_init.sql`) sono verificati su Postgres; l'adattatore `src/store/supabase.ts`
e le regole dello storage (`0002_storage.sql`) non sono ancora stati provati contro un progetto reale.

## Come è fatto

- **Menù come documento.** Ogni locale ha una bozza (`draft`) e uno snapshot pubblicato (`published`). La pagina pubblica
  legge solo lo snapshot con una singola richiesta (`public_menu`), quindi le bozze non sono mai esposte.
- **Esauriti fuori dalla pubblicazione.** Sono uno stato operativo: effetto immediato, consentito anche allo staff.
- **Template = preset di token.** `src/themes.ts`: quattro layout strutturali e un insieme di valori (colori, caratteri,
  angoli, spaziatura). Aggiungere un template è aggiungere una voce all'elenco `PRESETS`.
- **Contrasto garantito.** Il colore del testo deriva dallo sfondo; il colore principale viene corretto se illeggibile.
- **Due ingressi separati.** La pagina pubblica (`m/`) non carica il codice del pannello.

## Fuori dal primo rilascio

Multilingua, statistiche di consultazione, prezzi multipli per formato, varianti, menù multipli a fasce orarie,
modifica massiva dei prezzi, inviti utenti dal pannello, pagamenti.

Da decidere prima di stampare QR per clienti reali: la struttura definitiva dell'indirizzo pubblico
(oggi `m/?l=<indirizzo>`), perché cambiarla dopo significa ristampare.
