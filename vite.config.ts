import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from /Onyx-Digital/; everywhere else (local
// dev, preview, the inlined Artifact) it's served from the root.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/Onyx-Digital/' : '/',
  plugins: [react()],
  server: { host: true },
})
