import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {gunzipSync} from 'node:zlib';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPreviewServer} from './serve.ts';

test('preview serves unchanged source bytes with negotiated compression and excludes unsupported requests', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'pr-reviewer-preview-http-'));
    writeFileSync(join(directory, 'index.html'), readFileSync('mockups/change-node-preview/index.html'));
    const server = createPreviewServer(directory);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const get = (encoding: string, path = '/', method = 'GET') => new Promise<{body: Buffer; headers: import('node:http').IncomingHttpHeaders; status: number | undefined}>((resolve, reject) => {
        const req = request({host: '127.0.0.1', port: address.port, path, method, headers: {'Accept-Encoding': encoding}}, response => {
            const chunks: Buffer[] = [];response.on('data', chunk => chunks.push(chunk));response.on('end', () => resolve({body: Buffer.concat(chunks), headers: response.headers, status: response.statusCode}));
        });req.on('error', reject);req.end();
    });
    try {
        const plain = await get('identity');assert.equal(plain.status, 200);assert.deepEqual(plain.body, readFileSync(directory + '/index.html'));assert.equal(plain.headers['content-encoding'], undefined);
        const gzip = await get('gzip, br');assert.equal(gzip.headers['content-encoding'], 'gzip');assert.equal(gzip.headers.vary, 'Accept-Encoding');assert.deepEqual(gunzipSync(gzip.body), plain.body);
        const disabled = await get('gzip;q=0');assert.equal(disabled.headers['content-encoding'], undefined);assert.deepEqual(disabled.body, plain.body);
        const head = await get('gzip', '/', 'HEAD');assert.equal(head.body.length, 0);assert.equal(Number(head.headers['content-length']), gzip.body.length);
        assert.equal((await get('gzip', '//[')).status, 400);assert.equal((await get('identity')).status, 200);
        assert.equal((await get('gzip', '/unknown')).status, 404);assert.equal((await get('gzip', '/', 'POST')).status, 405);
    } finally {await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));rmSync(directory, {recursive: true, force: true});}
});
