import { cp, rm } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'ui/public');
const destination = resolve(root, 'public');

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log('Prepared Vercel static output in public/');
