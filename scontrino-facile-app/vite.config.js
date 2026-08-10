import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In produzione l'app è servita da GitHub Pages sotto /-armand-ecosystem-app/
// (pagina di progetto, non utente); in sviluppo resta sulla radice.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/-armand-ecosystem-app/' : '/',
}))
