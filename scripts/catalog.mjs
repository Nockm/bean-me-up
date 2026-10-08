import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const imageFile = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const alphabetically = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.name.localeCompare(b.name, 'en');

export async function catalog(directory) {
  const folders = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).sort(alphabetically);
  const coffees = [];
  for (const folder of folders) {
    const files = (await readdir(join(directory, folder.name), { withFileTypes: true }))
      .filter(entry => entry.isFile() && !entry.name.startsWith('.') && imageFile.test(entry.name)).sort(alphabetically);
    if (files.length) coffees.push({
      title: folder.name,
      images: files.map(file => `coffees/${encodeURIComponent(folder.name)}/${encodeURIComponent(file.name)}`)
    });
  }
  return coffees;
}
