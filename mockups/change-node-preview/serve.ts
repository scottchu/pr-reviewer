import {createServer} from 'node:http';
import type {Server} from 'node:http';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

const acceptsGzip = (value: string) => value.split(',').some(part => {
    const [encoding, ...parameters] = part.trim().split(';');
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='));
    return encoding === 'gzip' && (!quality || Number(quality.trim().slice(2)) > 0);
});
const mime: Readonly<Record<string, string>> = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ttf': 'font/ttf'};
/** Private preview transport only. It exposes files from one already-built directory. */
export const createPreviewServer = (directory: string): Server => {
    const files = new Map<string, {body: Buffer; gzip: Buffer; type: string}>();
    const visit = (folder: string, prefix = '') => {
        for (const entry of readdirSync(folder)) {
            const file = join(folder, entry), path = prefix + entry;
            if (statSync(file).isDirectory()) visit(file, path + '/');
            else {
                const body = readFileSync(file);
                files.set('/' + path, {body, gzip: gzipSync(body, {level: 6}), type: mime[extname(path)] ?? 'application/octet-stream'});
            }
        }
    };
    visit(resolve(directory));
    return createServer((request, response) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {response.writeHead(405, {Allow: 'GET, HEAD'}); response.end(); return;}
        let path: string;
        try {path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;}
        catch {response.writeHead(400); response.end(); return;}
        const file = files.get(path === '/' ? '/index.html' : path);
        if (!file) {response.writeHead(404); response.end(); return;}
        const compressed = acceptsGzip(String(request.headers['accept-encoding'] ?? ''));
        const body = compressed ? file.gzip : file.body;
        response.writeHead(200, {'Content-Type': file.type, 'Content-Length': body.length,
            Vary: 'Accept-Encoding', 'Cache-Control': 'no-cache', ...(compressed ? {'Content-Encoding': 'gzip'} : {})});
        response.end(request.method === 'HEAD' ? undefined : body);
    });
};
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const directory = process.argv[2];
    if (!directory) throw new Error('preview_build_directory_required');
    createPreviewServer(directory).listen(57944, '127.0.0.1', () => process.stdout.write('Preview listening on http://127.0.0.1:57944/\n'));
}
