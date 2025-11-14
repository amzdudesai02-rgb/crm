import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite's default port (spells "VITE" on phone keypad)
    // Change to a different port if needed, e.g.:
    // port: 3000,
    // Don't forget to update backend CORS settings if you change this!
  },
})
