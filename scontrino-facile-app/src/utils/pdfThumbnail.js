// pdfjs-dist è pesante (motore di rendering PDF completo) e serve solo per un dettaglio
// visivo — l'anteprima nella card del documento — quindi import dinamico, fuori dal bundle
// principale, come già per tesseract.js e @zxing/library.
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function generatePdfThumbnail(dataUrl, maxWidth = 320) {
  const pdfjsLib = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjsLib.getDocument({ data: dataUrlToUint8Array(dataUrl) }).promise
  const page = await pdf.getPage(1)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / baseViewport.width
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise

  const thumbnail = canvas.toDataURL('image/jpeg', 0.85)
  pdf.destroy()
  return thumbnail
}
