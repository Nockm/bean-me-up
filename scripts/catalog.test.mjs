import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { catalog } from './catalog.mjs';

test('folder titles, alphabetic images, encoded paths, and immediate images only', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'coffee-catalog-'));
  try {
    const coffee = join(directory, 'Café & cream'); await mkdir(coffee);
    for (const name of ['03-beans.WEBP', '01-main.JPG', '02-bag #1.png', 'notes.txt', '.hidden.png']) await writeFile(join(coffee, name), '');
    await mkdir(join(coffee, 'nested.png'));
    await writeFile(join(coffee, 'nested.png', '01.png'), '');
    await mkdir(join(directory, 'Empty coffee'));
    await mkdir(join(directory, '.Hidden coffee'));
    await writeFile(join(directory, '.Hidden coffee', '01.jpg'), '');
    await writeFile(join(directory, 'Loose image.jpg'), '');
    await mkdir(join(directory, 'Another-blend'));
    await writeFile(join(directory, 'Another-blend', 'Main.svg'), '');
    assert.deepEqual(await catalog(directory), [
      { title: 'Another-blend', images: ['coffees/Another-blend/Main.svg'] },
      { title: 'Café & cream', images: ['coffees/Caf%C3%A9%20%26%20cream/01-main.JPG', 'coffees/Caf%C3%A9%20%26%20cream/02-bag%20%231.png', 'coffees/Caf%C3%A9%20%26%20cream/03-beans.WEBP'] }
    ]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('moving a coffee outside the scanned folder hides it; moving it back restores it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coffee-archive-'));
  try {
    const available = join(root, 'coffees'); const archive = join(root, 'archive');
    await mkdir(available); await mkdir(archive);
    assert.deepEqual(await catalog(available), []);
    await mkdir(join(available, 'House Blend'));
    await writeFile(join(available, 'House Blend', '01-main.png'), '');
    const original = await catalog(available); assert.equal(original.length, 1);
    await rename(join(available, 'House Blend'), join(archive, 'House Blend'));
    assert.deepEqual(await catalog(available), []);
    await rename(join(archive, 'House Blend'), join(available, 'House Blend'));
    assert.deepEqual(await catalog(available), original);
  } finally { await rm(root, { recursive: true, force: true }); }
});
