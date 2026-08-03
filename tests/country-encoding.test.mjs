import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');

test('country content contains no common UTF-8 mojibake sequences', () => {
  const files = [
    path.join(root, 'data', 'countries.js'),
    ...fs.readdirSync(path.join(root, 'src', 'data', 'chunks'))
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(root, 'src', 'data', 'chunks', file))
  ];
  const corruptSequences = [
    '\u00e2\u20ac\u2122',
    '\u00e2\u20ac\u201d',
    '\u00e2\u20ac\u0153',
    '\u00e2\u20ac\u009d',
    '\u00c3\u00a9',
    '\u00c3\u00ad',
    '\u00c3\u00b6',
    '\u00c3\u00a1',
    '\u00c3\u00b3',
    '\u00c3\u00a7',
    '\u00c3\u00af'
  ];

  files.forEach(file => {
    const source = fs.readFileSync(file, 'utf8');
    corruptSequences.forEach(sequence => {
      assert.ok(!source.includes(sequence), `${path.basename(file)} contains ${sequence}`);
    });
  });
});

test('canonical Samoa copy and accented country details render correctly', () => {
  const source = `${fs.readFileSync(path.join(root, 'data', 'countries.js'), 'utf8')}
this.__cards = countryCards;`;
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context);

  const samoa = context.__cards.find(card => card.name === 'Samoa');
  const brazil = context.__cards.find(card => card.name === 'Brazil');
  const colombia = context.__cards.find(card => card.name === 'Colombia');
  const moldova = context.__cards.find(card => card.name === 'Moldova');

  assert.equal(samoa.fun_facts[0], "Fa'a Samoa — the Samoan way — governs village life");
  assert.equal(brazil.capital, 'Brasília');
  assert.equal(colombia.capital, 'Bogotá');
  assert.equal(moldova.capital, 'Chișinău');
  assert.equal(moldova.landmarks[0], 'Mileștii Mici wine cellars');
});

test('World Explorer is a prominent landing feature with independent music controls', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'globe-explorer.css'), 'utf8');
  const explorer = fs.readFileSync(path.join(root, 'globe-explorer.js'), 'utf8');
  const music = fs.readFileSync(path.join(root, 'background-music.js'), 'utf8');

  assert.match(html, /class="[^"]*landing-explore-feature[^"]*"[\s\S]*id="btn-open-explorer"/);
  assert.match(html, /World Explorer[\s\S]*Country Hunt/);
  assert.match(html, /id="btn-explorer-music"[\s\S]*Start music/);
  assert.match(styles, /\.landing-explore-feature[\s\S]*grid-template-columns/);
  assert.match(styles, /\.explorer-globe-controls[\s\S]*position: absolute/);
  assert.match(explorer, /startExplorerMusic/);
  assert.match(explorer, /toggleExplorerMusic/);
  assert.match(music, /isMuted: isMuted/);
  assert.match(music, /isPlaying: isPlaying/);
});
