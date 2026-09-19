const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { createPreviewServer } = require('../server.js');

let server;
test.before(async () => {
  server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
});
test.after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

function request(urlPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: server.address().port, path: urlPath, method, agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(3000, () => req.destroy(new Error('Preview request timed out')));
    req.on('error', reject);
    req.end();
  });
}

test('preview HTTP: serves the exact entry point with security and no-cache headers', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  assert.deepEqual(response.body, await readFile(path.join(__dirname, '../public/index.html')));
  assert.equal(response.headers['content-length'], String(response.body.length));
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.match(response.headers['content-security-policy'], /connect-src 'none'/);
  assert.match(response.headers['content-security-policy'], /frame-ancestors 'none'/);
});

test('preview HTTP: serves local scripts, styles, font and logo with matching bytes and MIME types', async () => {
  for (const [file, type] of [
    ['app.js', 'text/javascript; charset=utf-8'], ['model.js', 'text/javascript; charset=utf-8'],
    ['data.js', 'text/javascript; charset=utf-8'], ['styles.css', 'text/css; charset=utf-8'],
    ['assets/DMSans-Regular.ttf', 'font/ttf'], ['assets/brd-logo-on-dark.png', 'image/png'],
  ]) {
    const response = await request(`/${file}?version=demo`);
    assert.equal(response.status, 200, file);
    assert.equal(response.headers['content-type'], type, file);
    assert.deepEqual(response.body, await readFile(path.join(__dirname, '../public', file)), file);
  }
});

test('preview HTTP: HEAD preserves GET metadata and sends no content', async () => {
  for (const url of ['/', '/app.js', '/assets/brd-logo-on-dark.png']) {
    const get = await request(url);
    const head = await request(url, 'HEAD');
    assert.equal(head.status, get.status);
    assert.equal(head.headers['content-type'], get.headers['content-type']);
    assert.equal(head.headers['content-length'], get.headers['content-length']);
    assert.equal(head.body.length, 0);
  }
});

test('preview HTTP: rejects unsupported methods with allowed methods', async () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const response = await request('/', method);
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
    assert.equal(response.body.length, 0);
  }
});

test('preview HTTP: missing and private files remain inaccessible', async () => {
  for (const url of ['/missing.js', '/package.json', '/.env', '/.git/config', '/server.js', '/PROJECT_CONTEXT.md', '/assets/']) {
    const response = await request(url);
    assert.equal(response.status, 404, url);
    assert.ok(response.body.length < 100, url);
  }
});

test('preview HTTP: encoded traversal and Windows separators cannot expose repository files', async () => {
  for (const url of ['/../server.js', '/%2e%2e%2fserver.js', '/assets/%2e%2e/%2e%2e/server.js', '/..%5cserver.js', '/%252e%252e%252fserver.js', '/C:%5cWindows%5cwin.ini', '/app.js%00']) {
    const response = await request(url);
    assert.equal(response.status, 404, url);
    assert.ok(response.body.length < 100, url);
    assert.doesNotMatch(response.body.toString('utf8'), /createPreviewServer|require\(/);
  }
});

test('preview HTTP: malformed percent encodings return 400 without terminating the server', async () => {
  for (const url of ['/%', '/%ZZ', '/%E0%A4%A']) assert.equal((await request(url)).status, 400, url);
  assert.equal((await request('/')).status, 200);
});
