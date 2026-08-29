import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from /parkpals/; everywhere else (local
// dev, preview, the inlined Artifact) it's served from the root.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/parkpals/' : '/',
  plugins: [react()],
  server: { host: true },
})
