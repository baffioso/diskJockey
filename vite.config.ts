import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base for GitHub Pages project site: https://<user>.github.io/diskJockey/
  base: '/diskJockey/',
})
