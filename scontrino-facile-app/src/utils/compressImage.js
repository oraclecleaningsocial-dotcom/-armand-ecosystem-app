// Le foto della fotocamera possono pesare diversi MB: salvate così come sono per ogni
// scontrino, la localStorage (quota tipica di pochi MB, spesso solo 5-10MB su iOS Safari)
// si riempie dopo poche decine di scansioni — e i salvataggi successivi falliscono in
// silenzio se non lo gestiamo esplicitamente (vedi storageAlert.js). Ridimensionare e
// ricomprimere prima di salvare tiene ogni scontrino a poche decine di KB invece di alcuni MB.
export function compressImage(dataUrl, maxDimension = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) { height = Math.round(height * (maxDimension / width)); width = maxDimension }
        else { width = Math.round(width * (maxDimension / height)); height = maxDimension }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('immagine non leggibile'))
    img.src = dataUrl
  })
}
