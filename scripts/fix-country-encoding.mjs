import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  path.join(root, 'data', 'countries.js'),
  path.join(root, 'src', 'data', 'chunks', 'Africa.js')
];

const replacements = new Map([
  ['\u00e2\u20ac\u2122', '\u2019'],
  ['\u00e2\u20ac\u201d', '\u2014'],
  ['\u00e2\u20ac\u0153', '\u201c'],
  ['\u00e2\u20ac\u009d', '\u201d'],
  ['\u00c3\u00a9', '\u00e9'],
  ['\u00c3\u00ad', '\u00ed'],
  ['\u00c3\u00b6', '\u00f6'],
  ['\u00c3\u00a1', '\u00e1'],
  ['\u00c3\u00b3', '\u00f3'],
  ['\u00c3\u00a7', '\u00e7'],
  ['\u00c3\u00af', '\u00ef'],
  ['\u00c3\u00a2', '\u00e2'],
  ['\u00c3\u00a4', '\u00e4'],
  ['\u00c3\u00ba', '\u00fa'],
  ['\u00c3\u00b1', '\u00f1'],
  ['\u00c3\u00a8', '\u00e8']
]);

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  for (const [corrupt, corrected] of replacements) {
    source = source.replaceAll(corrupt, corrected);
  }
  fs.writeFileSync(file, source, 'utf8');
}
