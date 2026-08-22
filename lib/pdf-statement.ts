/** Minimal multi-page PDF text builder (ASCII-safe, no external deps). */

function toAscii(value: string) {
  return value
    .replace(/[—–−]/g, '-')
    .replace(/[·•]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^
	
 -~]/g, '')
}

function escapePdfText(value: string) {
  return toAscii(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildPageContent(lines: string[]) {
  const parts: string[] = ['BT', '/F1 9 Tf', '40 770 Td', '11 TL']
  lines.forEach((line, idx) => {
    if (idx === 0) {
      parts.push(`(${escapePdfText(line)}) Tj`)
    } else {
      parts.push('T*')
      parts.push(`(${escapePdfText(line)}) Tj`)
    }
  })
  parts.push('ET')
  return parts.join('\n')
}

function byteLength(s: string) {
  return new TextEncoder().encode(s).length
}

export function buildStatementPdf(input: {
  memberName: string
  memberEmail: string
  routingNumber: string
  bankAddress: string
  periodLabel: string
  accounts: Array<{ name: string; type: string; accountNumber: string; balanceLabel: string }>
  transactions: Array<{ date: string; description: string; amountLabel: string }>
  generatedAt: string
}): Uint8Array {
  const header: string[] = [
    'Apex Bank - 12-Month Account Statement',
    `Bank address: ${input.bankAddress}`,
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
    const desc =
      t.description.length > 68 ? t.description.slice(0, 65) + '...' : t.description
    return `${t.date.padEnd(12)} ${t.amountLabel.padStart(12)}  ${desc}`
  })

  const allLines = [
    ...header,
    ...bodyLines,
    '',
    'Apex Bank - Member FDIC - Statement reflects account history on file',
    input.bankAddress,
  ]

  const LINES_PER_PAGE = 60
  const pages: string[][] = []
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pages.push(allLines.slice(i, i + LINES_PER_PAGE))
  }
  if (pages.length === 0) pages.push(['Apex Bank - empty statement'])

  const n = pages.length
  const pageObjIds = Array.from({ length: n }, (_, i) => 3 + i)
  const contentObjIds = Array.from({ length: n }, (_, i) => 3 + n + i)
  const fontObjId = 3 + 2 * n

  const objects: string[] = []
  objects.push('1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
')
  objects.push(
    `2 0 obj
<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${n} >>
endobj
`
  )

  for (let i = 0; i < n; i++) {
    objects.push(
      `${pageObjIds[i]} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjIds[i]} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>
endobj
`
    )
  }

  for (let i = 0; i < n; i++) {
    const stream = buildPageContent(pages[i])
    const len = byteLength(stream)
    objects.push(
      `${contentObjIds[i]} 0 obj
<< /Length ${len} >>
stream
${stream}
endstream
endobj
`
    )
  }

  objects.push(
    `${fontObjId} 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`
  )

  let pdf = '%PDF-1.4
'
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(byteLength(pdf))
    pdf += obj
  }
  const xrefStart = byteLength(pdf)
  pdf += `xref
0 ${objects.length + 1}
`
  pdf += '0000000000 65535 f 
'
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n 
`
  }
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
`
  pdf += `startxref
${xrefStart}
%%EOF
`

  return new TextEncoder().encode(pdf)
}
