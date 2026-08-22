/** Minimal PDF text builder (no external deps). */

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function buildStatementPdf(input: {
  memberName: string
  memberEmail: string
  routingNumber: string
  accounts: Array<{ name: string; type: string; accountNumber: string; balanceLabel: string }>
  transactions: Array<{ date: string; description: string; amountLabel: string }>
  generatedAt: string
}): Uint8Array {
  const lines: string[] = []
  lines.push('Apex Bank — Account Statement')
  lines.push(`Generated: ${input.generatedAt}`)
  lines.push(`Member: ${input.memberName}`)
  lines.push(`Email: ${input.memberEmail}`)
  lines.push(`Routing: ${input.routingNumber}`)
  lines.push('')
  lines.push('Accounts')
  for (const a of input.accounts) {
    lines.push(
      `- ${a.name} (${a.type})  Acct ${a.accountNumber}  Bal ${a.balanceLabel}`
    )
  }
  lines.push('')
  lines.push('Recent transactions')
  const txSlice = input.transactions.slice(0, 80)
  for (const t of txSlice) {
    lines.push(`${t.date}  ${t.amountLabel.padStart(12)}  ${t.description}`)
  }
  if (input.transactions.length > txSlice.length) {
    lines.push(`... and ${input.transactions.length - txSlice.length} more transactions on file`)
  }
  lines.push('')
  lines.push('Apex Bank · Member FDIC · For demonstration purposes')

  const contentParts: string[] = ['BT', '/F1 10 Tf', '50 780 Td', '14 TL']
  lines.forEach((line, idx) => {
    if (idx === 0) {
      contentParts.push(`(${escapePdfText(line)}) Tj`)
    } else {
      contentParts.push('T*')
      contentParts.push(`(${escapePdfText(line)}) Tj`)
    }
  })
  contentParts.push('ET')
  const stream = contentParts.join('\n')

  const objects: string[] = []
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj')
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj')
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj'
  )
  objects.push(
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj`
  )
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj')

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
