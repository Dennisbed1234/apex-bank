/** Minimal multi-page PDF text builder (no external deps). */

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildPageContent(lines: string[]) {
  const contentParts: string[] = ['BT', '/F1 9 Tf', '40 770 Td', '12 TL']
  lines.forEach((line, idx) => {
    if (idx === 0) {
      contentParts.push(`(${escapePdfText(line)}) Tj`)
    } else {
      contentParts.push('T*')
      contentParts.push(`(${escapePdfText(line)}) Tj`)
    }
  })
  contentParts.push('ET')
  return contentParts.join('\n')
}

export function buildStatementPdf(input: {
  memberName: string
  memberEmail: string
  routingNumber: string
  periodLabel: string
  accounts: Array<{ name: string; type: string; accountNumber: string; balanceLabel: string }>
  transactions: Array<{ date: string; description: string; amountLabel: string; accountLabel?: string }>
  generatedAt: string
}): Uint8Array {
  const header: string[] = [
    'Apex Bank — 12-Month Account Statement',
    `Generated: ${input.generatedAt}`,
    `Statement period: ${input.periodLabel}`,
    `Member: ${input.memberName}`,
    `Email: ${input.memberEmail}`,
    `Routing number: ${input.routingNumber}`,
    '',
    'Accounts (current balances)',
  ]

  for (const a of input.accounts) {
    header.push(
      `- ${a.name} (${a.type})  Acct ${a.accountNumber}  Balance ${a.balanceLabel}`
    )
  }

  header.push('')
  header.push(
    `Activity matching your ledger (${input.transactions.length} transactions in period)`
  )
  header.push('Date          Amount         Description')

  const bodyLines = input.transactions.map((t) => {
    const desc = t.description.length > 70 ? t.description.slice(0, 67) + '...' : t.description
    return `${t.date.padEnd(12)} ${t.amountLabel.padStart(12)}  ${desc}`
  })

  const allLines = [...header, ...bodyLines, '', 'Apex Bank · Member FDIC · Statement reflects account history on file']

  // ~60 lines per page at 12pt leading on letter size
  const LINES_PER_PAGE = 58
  const pages: string[][] = []
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pages.push(allLines.slice(i, i + LINES_PER_PAGE))
  }
  if (pages.length === 0) pages.push(['Apex Bank — empty statement'])

  const objects: string[] = []
  // 1 catalog, 2 pages root, then N page objs, N content objs, 1 font
  // Object numbering:
  // 1 = Catalog
  // 2 = Pages
  // 3..2+N = Page
  // 3+N .. 2+2N = Contents
  // 3+2N = Font

  const n = pages.length
  const pageObjIds = Array.from({ length: n }, (_, i) => 3 + i)
  const contentObjIds = Array.from({ length: n }, (_, i) => 3 + n + i)
  const fontObjId = 3 + 2 * n

  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj')
  objects.push(
    `2 0 obj<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${n} >>endobj`
  )

  for (let i = 0; i < n; i++) {
    objects.push(
      `${pageObjIds[i]} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjIds[i]} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>endobj`
    )
  }

  for (let i = 0; i < n; i++) {
    const stream = buildPageContent(pages[i])
    objects.push(
      `${contentObjIds[i]} 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj`
    )
  }

  objects.push(
    `${fontObjId} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`
  )

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += obj + '\n'
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefStart}\n%%EOF`

  return new TextEncoder().encode(pdf)
}
