function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function receiptsToCsv(receipts, categoryLabel) {
  const header = ['Data', 'Esercente', 'Categoria', 'Totale (EUR)', 'Voci']
  const rows = receipts.map((r) => [
    r.date,
    r.merchant,
    categoryLabel(r.category),
    r.total.toFixed(2).replace('.', ','),
    r.items.map((it) => `${it.name} ${it.amount.toFixed(2)}`).join(' | '),
  ])
  return [header, ...rows].map((row) => row.map(csvEscape).join(';')).join('\n')
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
