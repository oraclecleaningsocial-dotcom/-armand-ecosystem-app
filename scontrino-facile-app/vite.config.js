import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'

const buildTime = new Date().toISOString()

// Scrive lo stesso timestamp di build anche come file statico a parte (non
// incluso nel bundle JS): serve a useUpdateChecker.js per scoprire che è uscita
// una versione più nuova senza dover ricaricare l'intero bundle (che potrebbe
// restare in cache) — un fetch con cache:'no-store' su questo file singolo e
// piccolo basta a bucare qualunque cache intermedia.
function writeVersionFile() {
  return {
    name: 'write-version-file',
    writeBundle(options) {
      writeFileSync(`${options.dir}/version.json`, JSON.stringify({ buildTime }))
    },
  }
}

// In produzione l'app è servita da GitHub Pages sotto /-armand-ecosystem-app/
// (pagina di progetto, non utente); in sviluppo resta sulla radice.
export default defineConfig(({ command }) => ({
  plugins: [react(), writeVersionFile()],
  base: command === 'build' ? '/-armand-ecosystem-app/' : '/',
  // Timestamp di build, mostrato in Impostazioni: serve a verificare in un secondo se il
  // dispositivo sta davvero eseguendo l'ultima versione o una copia vecchia rimasta in
  // cache, invece di doverlo dedurre da un bug che magari è già stato risolto.
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
}))
