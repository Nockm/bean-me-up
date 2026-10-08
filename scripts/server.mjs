import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.json': 'application/json', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // Serve only the page and its public assets, never repository or server files.
    if (!['/', '/index.html', '/style.css', '/app.js', '/coffees.json'].includes(path) && !/^\/coffees\/[^/]+\/[^/]+$/.test(path)) {
      response.writeHead(404); return response.end('Not found');
    }
    const file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
    if (!file.startsWith(root + sep) || !types[extname(file).toLowerCase()]) {
      response.writeHead(404); return response.end('Not found');
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()], 'Cache-Control': 'no-cache' });
    response.end(content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Unable to load coffees');
  }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Coffee cards listening on port ${server.address().port}`));
