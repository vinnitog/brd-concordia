const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const publicRoot = path.resolve(__dirname, '../public');

function references(source, extension) {
  if (extension === '.html') {
    return [...source.matchAll(/<(?:link|script|img)\b[^>]*\b(?:href|src)=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
  }
  if (extension === '.css') {
    return [...source.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map(match => match[1]);
  }
  if (extension === '.js') {
    return [...source.matchAll(/^\s*import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/gm)].map(match => match[1]);
  }
  return [];
}

async function checkResourceGraph(documentUrl, deploymentBase) {
  const pending = [new URL(documentUrl)];
  const visited = new Set();
  const fileTypes = new Set();

  while (pending.length) {
    const url = pending.pop();
    assert.equal(url.origin, deploymentBase.origin, `${url.href} must remain on the deployment origin`);
    assert.ok(url.pathname.startsWith(deploymentBase.pathname), `${url.href} must preserve ${deploymentBase.pathname}`);
    if (visited.has(url.pathname)) continue;
    visited.add(url.pathname);

    const relative = decodeURIComponent(url.pathname.slice(deploymentBase.pathname.length)) || 'index.html';
    const filePath = path.resolve(publicRoot, relative);
    assert.ok(filePath.startsWith(publicRoot + path.sep), `${url.href} must map to a public file`);
    const source = await readFile(filePath, 'utf8');
    const extension = path.extname(filePath);
    fileTypes.add(extension);
    pending.push(...references(source, extension).map(reference => new URL(reference, url)));

    if (extension === '.html') {
      const navigation = [...source.matchAll(/<a\b[^>]*\bhref=["'](#[^"']+)["'][^>]*>/g)];
      assert.ok(navigation.length > 0, 'Actual page navigation must be inspected');
      for (const [, reference] of navigation) {
        const destination = new URL(reference, url);
        assert.equal(destination.origin, url.origin);
        assert.equal(destination.pathname, url.pathname, 'Hash navigation must preserve the document path');
        assert.equal(destination.hash, reference);
      }
    }
  }

  for (const extension of ['.html', '.css', '.js', '.ttf', '.png', '.svg']) {
    assert.ok(fileTypes.has(extension), `The real resource graph must include ${extension} files`);
  }
  assert.ok(visited.has(new URL('model.js', deploymentBase).pathname), 'Application imports must reach the model');
  assert.ok(visited.has(new URL('data.js', deploymentBase).pathname), 'Transitive imports must reach the demo data');
}

for (const base of ['http://127.0.0.1:4317/', 'https://vinnitog.github.io/brd-concordia/']) {
  test(`preview assets: resolve the real dependency graph within ${base}`, async () => {
    const deploymentBase = new URL(base);
    for (const entry of ['', '#agreements', 'index.html#deadlines']) {
      await checkResourceGraph(new URL(entry, deploymentBase), deploymentBase);
    }
  });
}
