import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In produzione l'app è servita da GitHub Pages sotto /-armand-ecosystem-app/
// (pagina di progetto, non utente); in sviluppo resta sulla radice.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/-armand-ecosystem-app/' : '/',
  // Timestamp di build, mostrato in Impostazioni: serve a verificare in un secondo se il
  // dispositivo sta davvero eseguendo l'ultima versione o una copia vecchia rimasta in
  // cache, invece di doverlo dedurre da un bug che magari è già stato risolto.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}))
