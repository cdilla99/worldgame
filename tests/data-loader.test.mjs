import assert from 'node:assert/strict';
import eventBus from '../src/core/events.js';
import loadChunk, {
  createChunkLoader,
  MAX_CHUNK_RETRIES,
  RETRY_BASE_DELAY_MS
} from '../src/data/loader.js';

const tests = [];
function test(name, run) { tests.push({ name, run }); }

function eventRecorder() {
  const emitted = [];
  return {
    emitted,
    events: { emit: (name, payload) => emitted.push({ name, payload }) }
  };
}

test('loads a chunk and emits loading before ready', async () => {
  const countries = Object.freeze([{ id: 1, name: 'Example' }]);
  const { emitted, events } = eventRecorder();
  const loader = createChunkLoader({
    importers: { Africa: async () => ({ default: countries }) },
    events
  });

  assert.strictEqual(await loader.loadChunk('Africa'), countries);
  assert.deepEqual(emitted.map(event => event.name), ['data:loading', 'data:ready']);
  assert.equal(emitted[0].payload.chunkId, 'Africa');
  assert.equal(emitted[1].payload.continent, 'Africa');
  assert.strictEqual(emitted[1].payload.countries, countries);
  assert.equal(emitted[1].payload.attempts, 1);
});

test('caches completed chunks without importing or emitting twice', async () => {
  const countries = [];
  const { emitted, events } = eventRecorder();
  let imports = 0;
  const loader = createChunkLoader({
    importers: { Asia: async () => { imports += 1; return { default: countries }; } },
    events
  });

  assert.strictEqual(await loader.loadChunk('Asia'), countries);
  assert.strictEqual(await loader.loadChunk('asia'), countries);
  assert.equal(imports, 1);
  assert.deepEqual(emitted.map(event => event.name), ['data:loading', 'data:ready']);
});

test('deduplicates concurrent requests for the same chunk', async () => {
  const countries = [{ id: 2 }];
  const { emitted, events } = eventRecorder();
  let imports = 0;
  let resolveImport;
  const imported = new Promise(resolve => { resolveImport = resolve; });
  const loader = createChunkLoader({
    importers: { Europe: () => { imports += 1; return imported; } },
    events
  });

  const first = loader.loadChunk('Europe');
  const second = loader.loadChunk('Europe');
  assert.equal(imports, 1);
  resolveImport({ default: countries });
  assert.strictEqual(await first, countries);
  assert.strictEqual(await second, countries);
  assert.deepEqual(emitted.map(event => event.name), ['data:loading', 'data:ready']);
});

test('retries with exponential backoff and succeeds on the fourth attempt', async () => {
  const countries = [{ id: 3 }];
  const { emitted, events } = eventRecorder();
  const delays = [];
  let attempts = 0;
  const loader = createChunkLoader({
    importers: {
      Oceania: async () => {
        attempts += 1;
        if (attempts <= MAX_CHUNK_RETRIES) throw new Error(`failure ${attempts}`);
        return { default: countries };
      }
    },
    events,
    delay: async milliseconds => { delays.push(milliseconds); },
    baseDelayMs: 5
  });

  assert.strictEqual(await loader.loadChunk('Oceania'), countries);
  assert.equal(attempts, 4);
  assert.deepEqual(delays, [5, 10, 20]);
  assert.deepEqual(emitted.map(event => event.name), ['data:loading', 'data:ready']);
  assert.equal(emitted[1].payload.attempts, 4);
});
test('emits one terminal error after the maximum retry count', async () => {
  const failure = new Error('network unavailable');
  const { emitted, events } = eventRecorder();
  const delays = [];
  let attempts = 0;
  const loader = createChunkLoader({
    importers: {
      Africa: async () => { attempts += 1; throw failure; }
    },
    events,
    delay: async milliseconds => { delays.push(milliseconds); },
    baseDelayMs: RETRY_BASE_DELAY_MS
  });

  await assert.rejects(loader.loadChunk('Africa'), error => error === failure);
  assert.equal(attempts, MAX_CHUNK_RETRIES + 1);
  assert.deepEqual(delays, [100, 200, 400]);
  assert.deepEqual(emitted.map(event => event.name), ['data:loading', 'data:error']);
  assert.equal(emitted[1].payload.chunkId, 'Africa');
  assert.strictEqual(emitted[1].payload.error, failure);
  assert.equal(emitted[1].payload.attempts, 4);
});

test('removes failed requests from the in-flight cache so a later call can recover', async () => {
  const countries = [{ id: 4 }];
  const { emitted, events } = eventRecorder();
  let imports = 0;
  const loader = createChunkLoader({
    importers: {
      Asia: async () => {
        imports += 1;
        if (imports === 1) throw new Error('temporary failure');
        return { default: countries };
      }
    },
    events,
    delay: async () => {},
    maxRetries: 0
  });

  await assert.rejects(loader.loadChunk('Asia'), /temporary failure/);
  assert.strictEqual(await loader.loadChunk('Asia'), countries);
  assert.equal(imports, 2);
  assert.deepEqual(
    emitted.map(event => event.name),
    ['data:loading', 'data:error', 'data:loading', 'data:ready']
  );
});

test('rejects unknown chunks with an identifying error event', async () => {
  const { emitted, events } = eventRecorder();
  const loader = createChunkLoader({ importers: { Africa: async () => ({ default: [] }) }, events });

  await assert.rejects(loader.loadChunk('Atlantis'), /Unknown country-data chunk/);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].name, 'data:error');
  assert.equal(emitted[0].payload.chunkId, 'Atlantis');
  assert.ok(emitted[0].payload.error instanceof RangeError);
  assert.equal(emitted[0].payload.attempts, 0);
});

test('rejects malformed chunk modules after retrying', async () => {
  const { emitted, events } = eventRecorder();
  let attempts = 0;
  const loader = createChunkLoader({
    importers: { Europe: async () => { attempts += 1; return { default: {} }; } },
    events,
    delay: async () => {},
    maxRetries: 1
  });

  await assert.rejects(loader.loadChunk('Europe'), /default array export/);
  assert.equal(attempts, 2);
  assert.equal(emitted.at(-1).name, 'data:error');
  assert.ok(emitted.at(-1).payload.error instanceof TypeError);
});

test('the default loader dynamically imports real chunks and accepts underscore IDs', async () => {
  const observed = [];
  const stopLoading = eventBus.on('data:loading', payload => observed.push(['loading', payload]));
  const stopReady = eventBus.on('data:ready', payload => observed.push(['ready', payload]));
  try {
    const countries = await loadChunk('South_America');
    assert.equal(countries.length, 12);
    assert.ok(countries.every(country => country.continent === 'South America'));
    assert.deepEqual(observed.map(([name]) => name), ['loading', 'ready']);
    assert.equal(observed[0][1].chunkId, 'South_America');
  } finally {
    stopLoading();
    stopReady();
  }
});

test('factory validates retry and dependency configuration', () => {
  assert.throws(() => createChunkLoader({ importers: null }), TypeError);
  assert.throws(() => createChunkLoader({ events: {} }), TypeError);
  assert.throws(() => createChunkLoader({ delay: null }), TypeError);
  assert.throws(() => createChunkLoader({ maxRetries: -1 }), RangeError);
  assert.throws(() => createChunkLoader({ baseDelayMs: -1 }), RangeError);
});

let passed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    passed += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

console.log(`data loader unit tests passed (${passed}/${tests.length})`);
