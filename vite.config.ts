import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages the app is served from /<repo-name>/; everywhere else (local
// dev, preview, the inlined Artifact) it's served from the root. The workflow
// passes REPO_NAME so this keeps working even if the repository is renamed.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${process.env.REPO_NAME || 'Onyx-Digital'}/` : '/',
  plugins: [react()],
  server: { host: true },
})
