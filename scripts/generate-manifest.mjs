import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { catalog } from './catalog.mjs';
const coffees = await catalog(fileURLToPath(new URL('../coffees/', import.meta.url)));
await writeFile(new URL('../coffees.json', import.meta.url), JSON.stringify(coffees, null, 2) + '\n');
console.log(`Updated coffees.json: ${coffees.length} available coffees.`);
