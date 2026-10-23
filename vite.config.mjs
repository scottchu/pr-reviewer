import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { importPR } from './scripts/import-pr.mjs';
const previewHost = 'mac-mini.duckbill-ionian.ts.net';
const trustedOrigins = new Set(['http://127.0.0.1:4173', 'http://localhost:4173', `https://${previewHost}:8466`]);

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local", previewHost],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: 'local-pr-import',
    configureServer(server) {
      const clients = new Set();
      server.middlewares.use('/api/focus', async (req, res) => {
        if (req.method === 'GET' && req.url === '/stream') {
          res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
          res.write(': focus stream connected\n\n'); clients.add(res);
          req.on('close', () => clients.delete(res)); return;
        }
        res.setHeader('Content-Type','application/json');
        if (req.method !== 'POST' || req.headers['x-pr-teacher-agent'] !== '1' || (req.headers.origin && !trustedOrigins.has(req.headers.origin))) { res.statusCode=403;res.end(JSON.stringify({error:'Local agent POST required'}));return; }
        try {
          let input='';for await(const chunk of req){input+=chunk;if(input.length>8192)throw Error('Too large');}
          const command=JSON.parse(input);
          if(typeof command.head!=='string'||!/^[a-f0-9]{40}$/.test(command.head))throw Error('Pinned head required');
          if(typeof command.lessonId!=='string'&&typeof command.path!=='string')throw Error('Lesson or source path required');
          for(const client of clients)client.write(`data: ${JSON.stringify(command)}\n\n`);
          res.end(JSON.stringify({deliveredTo:clients.size,acceptance:'Delivery only; inspect the client to verify focus adoption'}));
        } catch {res.statusCode=400;res.end(JSON.stringify({error:'Invalid focus command'}));}
      });
      server.middlewares.use('/api/import', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST' || !trustedOrigins.has(req.headers.origin)) { res.statusCode = 403; res.end(JSON.stringify({error: 'Trusted preview origin required'})); return; }
        try {
          let input = ''; for await (const chunk of req) { input += chunk; if (input.length > 2048) throw new Error('Request too large'); }
          const {url} = JSON.parse(input);
          res.end(JSON.stringify(importPR(url)));
        } catch (error) { res.statusCode = 400; res.end(JSON.stringify({error: error.message.includes('Enter a GitHub') ? error.message : 'Import failed. Check GitHub access and PR URL; the current lesson is preserved.'})); }
      });
    }
  }],
});
