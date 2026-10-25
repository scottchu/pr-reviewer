import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: '../../node_modules/.vite/pr-file-tree',
  server: {
    host: '127.0.0.1',
    port: 57943,
    strictPort: true,
    allowedHosts: [
      'mac-mini.duckbill-ionian.ts.net'
    ]
  },
  build: {
    outDir: '/tmp/pr-reviewer-reading-journey-evidence/build',
    emptyOutDir: true
  }
});
