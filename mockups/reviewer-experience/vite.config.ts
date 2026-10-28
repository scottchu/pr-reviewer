import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),cacheDir:'../../node_modules/.vite/reviewer-experience',server:{host:'127.0.0.1',port:56676,strictPort:true,allowedHosts:['mac-mini.duckbill-ionian.ts.net']},build:{outDir:'/tmp/pr-reviewer-experience-mockup-build',emptyOutDir:true}});
