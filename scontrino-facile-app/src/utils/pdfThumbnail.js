// pdfjs-dist è pesante (motore di rendering PDF completo) e serve solo per dettagli
// visivi — l'anteprima nella card del documento, e le pagine renderizzate nel visore —
// quindi import dinamico, fuori dal bundle principale, come già per tesseract.js e
// @zxing/library.
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.mjs?url')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

export async function generatePdfThumbnail(dataUrl, maxWidth = 320) {
  const pdfjsLib = await loadPdfjs()
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

// Il visore PDF nativo del browser dentro un <iframe> (usato prima) apre spesso a uno
// zoom fisso e scomodo su iOS in modalità standalone, con pinch-to-zoom-out che non
// funziona in modo affidabile dentro l'iframe annidato. Renderizzando ogni pagina come
// immagine larga quanto il contenitore, il documento si legge intero da subito, scorrendo
// verticalmente come qualsiasi altro contenuto dell'app — niente zoom da gestire.
export async function renderPdfPages(dataUrl, targetWidth = 380) {
  const pdfjsLib = await loadPdfjs()
  const pdf = await pdfjsLib.getDocument({ data: dataUrlToUint8Array(dataUrl) }).promise
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = (targetWidth * dpr) / baseViewport.width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push(canvas.toDataURL('image/jpeg', 0.9))
  }
  pdf.destroy()
  return pages
}
