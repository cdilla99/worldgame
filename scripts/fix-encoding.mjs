import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, 'data', 'countries.js');
let content = fs.readFileSync(file, 'utf8');

// These are UTF-8 bytes that were incorrectly decoded as Latin-1 then re-encoded as UTF-8
const replacements = [
  ['M\u00c4\u0081ori', 'M\u0101ori'],           // Māori
  ['z\u00c5\u0082oty', 'z\u0142oty'],           // złoty
  ['Bia\u00c5\u0082owie\u00c5\u00bca', 'Bia\u0142owie\u017ca'], // Białowieża
  ['Gra\u00c4\u008danica', 'Gra\u010danica'],   // Gračanica
];

let totalFixed = 0;
for (const [bad, good] of replacements) {
  let count = 0;
  while (content.includes(bad)) {
    content = content.replace(bad, good);
    count++;
  }
  if (count) console.log(`Fixed: ${good} (${count} occurrence${count > 1 ? 's' : ''})`);
  totalFixed += count;
}

if (totalFixed) {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`\nWrote ${totalFixed} encoding fix${totalFixed > 1 ? 'es' : ''} to ${file}`);
} else {
  console.log('No mojibake patterns found - file is already clean.');
}
