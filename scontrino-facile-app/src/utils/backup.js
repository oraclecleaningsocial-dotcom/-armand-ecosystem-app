export function serializeBackup(receipts, merchantCategoryMap) {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), receipts, merchantCategoryMap },
    null,
    2,
  )
}

export function parseBackup(jsonText) {
  let data
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }
  if (!data || !Array.isArray(data.receipts)) {
    throw new Error('Il file non è un backup di ScontrinoFacile riconoscibile.')
  }
  return { receipts: data.receipts, merchantCategoryMap: data.merchantCategoryMap || {} }
}

export function downloadJson(filename, jsonContent) {
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
