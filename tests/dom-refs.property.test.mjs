import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.NODE_ENV = 'development';
const source = await readFile(new URL('../src/core/dom-refs.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { get, clear } = await import(moduleUrl);

const seed = 0xD0A8E8;
let randomState = seed;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 0x100000000;
}

function integer(min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_:';
function elementId() {
  const length = integer(1, 32);
  let id = '';
  for (let index = 0; index < length; index += 1) {
    id += alphabet[integer(0, alphabet.length - 1)];
  }
  return id;
}

function uniqueId(used) {
  let id;
  do id = elementId(); while (used.has(id));
  used.add(id);
  return id;
}

function generateCase() {
  const used = new Set();
  const elements = new Map();
  const existingCount = integer(0, 12);
  for (let index = 0; index < existingCount; index += 1) {
    const id = uniqueId(used);
    elements.set(id, { id });
  }

  const ids = [...elements.keys()];
  const missingCount = integer(1, 24);
  for (let index = 0; index < missingCount; index += 1) ids.push(uniqueId(used));

  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = integer(0, index);
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  return { elements, ids };
}

// Property 8: Null safety for non-existent elements
// **Validates: Requirements 2.5**
const iterations = 250;
const originalWarn = console.warn;
console.warn = () => {};
try {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const { elements, ids } = generateCase();
    globalThis.document = {
      getElementById(id) {
        return elements.get(id) ?? null;
      }
    };
    clear();

    try {
      for (const id of ids) {
        let result;
        assert.doesNotThrow(() => { result = get(id); }, `lookup must not throw for id ${JSON.stringify(id)}`);
        if (!elements.has(id)) {
          assert.strictEqual(result, null, `non-existent id ${JSON.stringify(id)} must return null`);
        }
      }
    } catch (error) {
      const input = { existingIds: [...elements.keys()], queriedIds: ids };
      error.message = `Property 8 failed (seed=${seed}, iteration=${iteration}, input=${JSON.stringify(input)}): ${error.message}`;
      throw error;
    }
  }
} finally {
  console.warn = originalWarn;
  clear();
  delete globalThis.document;
}

console.log(`Property 8: DOM registry null safety passed (${iterations} generated cases, seed=${seed})`);
