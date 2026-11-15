/* Importazione del menù esistente: testo incollato o PDF con testo selezionabile.
   Le righe con un prezzo in fondo diventano piatti, le righe brevi senza prezzo diventano categorie,
   le righe senza prezzo subito dopo un piatto ne diventano la descrizione. Il risultato va sempre rivisto. */

export type ImportRow = { category: string; name: string; desc: string; price: number | null }

const PRICE = /(?:€\s*)?(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:€|euro)?\s*$/i

export function parseMenuText(text: string): ImportRow[] {
  const rows: ImportRow[] = []
  let category = 'Menù'
  let last: ImportRow | null = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[.·…_]{3,}/g, ' ').replace(/\s+/g, ' ').trim()
    if (!line) { last = null; continue }
    const m = line.match(PRICE)
    const before = m ? line.slice(0, m.index).replace(/[\s\-–—:]+$/, '').trim() : ''
    if (m && before.length >= 2 && /[a-zà-ù]/i.test(before)) {
      const [name, ...rest] = before.split(/\s+[-–—]\s+|\s*\(\s*|:\s+/)
      last = { category, name: name.trim(), desc: rest.join(' ').replace(/\)\s*$/, '').trim(), price: Number(m[1].replace(',', '.')) }
      rows.push(last)
    } else if (last && !last.desc && (line.length > 28 || /^[a-zà-ù]/.test(line))) {
      last.desc = line
    } else if (line.length <= 40 && /[a-zà-ù]/i.test(line)) {
      category = line.replace(/[:\-–—]+$/, '').trim()
      category = category === category.toUpperCase() ? category.charAt(0) + category.slice(1).toLowerCase() : category
      last = null
    }
  }
  return rows
}

/** Estrae il testo da un PDF ricostruendo le righe dalla posizione dei frammenti. */
export async function pdfToText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const out: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent()
    const lines = new Map<number, { x: number; s: string }[]>()
    for (const it of content.items as any[]) {
      if (!it.str?.trim()) continue
      const y = Math.round(it.transform[5] / 3) * 3
      const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 3) ?? y
      if (!lines.has(key)) lines.set(key, [])
      lines.get(key)!.push({ x: it.transform[4], s: it.str })
    }
    ;[...lines.entries()].sort((a, b) => b[0] - a[0]).forEach(([, parts]) => out.push(parts.sort((a, b) => a.x - b.x).map((x) => x.s).join(' ')))
    out.push('')
  }
  return out.join('\n')
}
