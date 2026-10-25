import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');

function worker() {
  const handlers = {};
  const entries = new Map();
  const removed = [];
  let offline = false;
  const key = request => new URL(typeof request === 'string' ? request : request.url,
    'https://example.com/bean-me-up/').href;
  const cache = {
    addAll: async paths => { for (const path of paths) entries.set(key(path), new Response(path)); },
    match: async request => entries.get(key(request))?.clone(),
    put: async (request, response) => { entries.set(key(request), response); }
  };
  runInNewContext(source, {
    URL, Response, console,
    self: { location: { href: 'https://example.com/bean-me-up/sw.js' },
      clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    caches: { open: async () => cache, keys: async () => ['bean-me-up-v0', 'other-app'],
      delete: async name => { removed.push(name); } },
    fetch: async () => { if (offline) throw new Error('Offline'); return new Response('fresh'); }
  });
  return { handlers, entries, removed, setOffline: () => { offline = true; },
    async lifecycle(name) { let result; handlers[name]({ waitUntil: promise => { result = promise; } }); await result; },
    request(path, options = {}) {
      let result;
      handlers.fetch({ request: { url: key(path), method: 'GET', mode: 'cors', ...options },
        respondWith: promise => { result = promise; } });
      return result;
    }
  };
}

test('manifest icons exist at the required dimensions and URLs stay relative', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url)));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const data = await readFile(new URL(`../${icon.src}`, import.meta.url));
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(data.readUInt32BE(16), size);
    assert.equal(data.readUInt32BE(20), size);
  }
});

test('offline shell works under the GitHub Pages repository path', async () => {
  const w = worker();
  await w.lifecycle('install');
  w.setOffline();
  assert.equal(await (await w.request('./')).text(), './');
  assert.equal(await (await w.request('coffees.json')).text(), 'coffees.json');
  assert.equal(await (await w.request('./?installed', { mode: 'navigate' })).text(), 'index.html');
});

test('fresh photos are cached for offline use and unrelated requests are ignored', async () => {
  const w = worker();
  const path = 'coffees/House%20Blend/01.jpg';
  assert.equal(await (await w.request(path)).text(), 'fresh');
  w.setOffline();
  assert.equal(await (await w.request(path)).text(), 'fresh');
  assert.equal(w.request('https://other.example/style.css'), undefined);
  assert.equal(w.request('/another-app/style.css'), undefined);
  assert.equal(w.request('archive/private.jpg'), undefined);
  assert.equal(w.request('app.js', { method: 'POST' }), undefined);
});

test('activation removes only old caches belonging to this app', async () => {
  const w = worker();
  await w.lifecycle('activate');
  assert.deepEqual(w.removed, ['bean-me-up-v0']);
});
