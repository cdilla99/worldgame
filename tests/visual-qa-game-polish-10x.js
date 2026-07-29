'use strict';

/**
 * Repeatable visual QA for the game-polish-10x acceptance matrix.
 *
 * Requires Playwright to be installed by the caller; this repository remains
 * dependency-free. Run `node tests/visual-qa-game-polish-10x.js --help` for
 * setup and artifact options.
 *
 * Validates: Requirements 3.1-3.7, 6.8, 7.1-7.8, 8.1-8.10, 9.1-9.5,
 * 10.1-10.7, 12.1-12.8
 */
const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'visual-qa-game-polish-10x.json');
const DEFAULT_OUTPUT = path.join(__dirname, 'visual-qa-artifacts');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.ogg': 'audio/ogg', '.png': 'image/png', '.svg': 'image/svg+xml'
};

function usage() {
  console.log(`Usage: node tests/visual-qa-game-polish-10x.js [options]

Captures the state fixture at five representative viewports, plus 200% page
scale at 1280px and 390px. Every motion-bearing state is also captured with
prefers-reduced-motion enabled.

Options:
  --output <path>     Screenshot directory (default: tests/visual-qa-artifacts)
  --base-url <url>    Use an existing static-server URL instead of starting one
  --headed            Show the browser while running
  --state <id>        Run one fixture state (for focused investigation)
  --viewport <id>     Run one viewport or zoom viewport
  --help              Print this message

Install a compatible local browser driver before the full run, for example:
  npm install --save-dev playwright@1.52.0
  npx playwright install chromium`);
}

function parseArgs(argv) {
  const options = { output: DEFAULT_OUTPUT, headed: false, state: null, viewport: null, baseUrl: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') { options.help = true; }
    else if (arg === '--headed') { options.headed = true; }
    else if (['--output', '--state', '--viewport', '--base-url'].includes(arg)) {
      if (!argv[index + 1]) throw new Error(`${arg} requires a value.`);
      options[{ '--output': 'output', '--state': 'state', '--viewport': 'viewport', '--base-url': 'baseUrl' }[arg]] = argv[++index];
    } else { throw new Error(`Unknown option: ${arg}`); }
  }
  return options;
}

function loadPlaywright() {
  try { return require('playwright'); }
  catch (error) {
    throw new Error('Playwright is required for visual capture but is not installed. Install the pinned command shown by --help, then rerun this script.');
  }
}

function startStaticServer(root) {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url, 'http://127.0.0.1');
      const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const filePath = path.resolve(root, '.' + decodeURIComponent(pathname));
      if (!filePath.startsWith(root + path.sep)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const contents = await fsp.readFile(filePath);
      response.writeHead(200, {
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(contents);
    } catch (error) {
      response.writeHead(error && error.code === 'ENOENT' ? 404 : 500).end('Not found');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}/index.html` });
    });
  });
}

function isVisible(element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

async function assertVisible(page, selector, label) {
  const control = page.locator(selector).first();
  if (await control.count() !== 1 || !await control.evaluate(isVisible)) {
    throw new Error(`${label}: required control ${selector} is missing or hidden.`);
  }
  return control;
}

async function loadLanding(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#landing:not(.hidden)').waitFor();
  await page.locator('#btn-start-game').waitFor();
}

async function startFreshPractice(page, baseUrl) {
  await loadLanding(page, baseUrl);
  await page.locator('#btn-showoff').click();
  await page.locator('#btn-start-game').click();
  await page.locator('#game:not(.hidden)').waitFor();
  await page.locator('#btn-i-know').waitFor();
}

async function showChoices(page) {
  await page.locator('#btn-show-options').click();
  await page.locator('#choices:not(.hidden) .choice-btn').first().waitFor();
}

async function createFeedback(page, baseUrl, expectedOutcome) {
  for (let index = 0; index < 6; index += 1) {
    await startFreshPractice(page, baseUrl);
    await showChoices(page);
    await page.locator('#choices .choice-btn').nth(index).click();
    await page.locator('#feedback:not(.hidden)').waitFor();
    if ((await page.locator('#feedback-heading').innerText()).trim() === expectedOutcome) return;
  }
  throw new Error(`Unable to produce the ${expectedOutcome} feedback fixture with a real choice.`);
}

async function prepareState(page, baseUrl, stateId) {
  if (stateId === 'landing') {
    await loadLanding(page, baseUrl);
    return;
  }
  if (stateId === 'unanswered-stage') return startFreshPractice(page, baseUrl);
  if (stateId === 'typed-answer') {
    await startFreshPractice(page, baseUrl);
    await page.locator('#btn-i-know').click();
    await page.locator('#type-answer:not(.hidden)').waitFor();
    return;
  }
  if (stateId === 'choices') {
    await startFreshPractice(page, baseUrl);
    return showChoices(page);
  }
  if (stateId === 'correct-feedback') return createFeedback(page, baseUrl, 'Correct');
  if (stateId === 'incorrect-feedback') return createFeedback(page, baseUrl, 'Incorrect');
  if (stateId === 'results') {
    await createFeedback(page, baseUrl, 'Correct');
    await page.locator('#btn-feedback-results').click();
    await page.locator('#results:not(.hidden)').waitFor();
    return;
  }
  throw new Error(`Unsupported fixture state: ${stateId}`);
}

async function assertFixtureContract(page, fixture) {
  for (const selector of fixture.requiredControls) await assertVisible(page, selector, fixture.title);
  const visibleText = await page.locator('body').innerText();
  for (const text of fixture.requiredText) {
    if (!visibleText.includes(text)) throw new Error(`${fixture.title}: required text “${text}” is missing.`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  if (dimensions.documentWidth > dimensions.viewport + 1 || dimensions.bodyWidth > dimensions.viewport + 1) {
    throw new Error(`${label}: horizontal overflow (${JSON.stringify(dimensions)}).`);
  }
}

async function assertPrimaryControlIsReachable(page, selector, label) {
  const control = await assertVisible(page, selector, label);
  await control.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const measurement = await control.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom,
      width: rect.width, height: rect.height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight
    };
  });
  const clipped = measurement.left < 0 || measurement.top < 0 || measurement.right > measurement.viewportWidth || measurement.bottom > measurement.viewportHeight;
  if (clipped || measurement.width < 44 || measurement.height < 44) {
    throw new Error(`${label}: primary control ${selector} is clipped or below the 44×44px target (${JSON.stringify(measurement)}).`);
  }
}

async function assertNoBrokenAssets(page, label) {
  const brokenAssets = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    return Array.from(document.images)
      .filter(image => visible(image) && (image.currentSrc || image.getAttribute('src')) && image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.getAttribute('src'));
  });
  if (brokenAssets.length) throw new Error(`${label}: player-facing broken asset(s): ${brokenAssets.join(', ')}`);
}

async function assertNoTextOverlap(page, label) {
  const overlaps = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const records = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      const element = node.parentElement;
      if (!element || element.closest('script, style, svg, .hidden, [aria-hidden="true"], [inert]') || !visible(element)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width > 1 && rect.height > 1) records.push({ element, text: node.nodeValue.trim().slice(0, 40), rect });
      }
    }
    const intersect = (first, second) => Math.min(first.right, second.right) - Math.max(first.left, second.left) > 2 && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 2;
    const results = [];
    for (let firstIndex = 0; firstIndex < records.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < records.length; secondIndex += 1) {
        const first = records[firstIndex];
        const second = records[secondIndex];
        if (first.element === second.element || first.element.contains(second.element) || second.element.contains(first.element) || !intersect(first.rect, second.rect)) continue;
        results.push(`${first.text} ↔ ${second.text}`);
      }
    }
    return [...new Set(results)].slice(0, 8);
  });
  if (overlaps.length) throw new Error(`${label}: overlapping text detected: ${overlaps.join('; ')}`);
}

async function assertReducedMotion(page, label) {
  const violations = await page.evaluate(() => Array.from(document.querySelectorAll('*')).flatMap(element => {
    const style = getComputedStyle(element);
    const hasMotion = (value) => value.split(',').some(item => parseFloat(item) > 0);
    if (style.animationName !== 'none' && hasMotion(style.animationDuration)) return [`${element.tagName}.${element.className}: animation`];
    if (style.transitionProperty !== 'none' && hasMotion(style.transitionDuration)) return [`${element.tagName}.${element.className}: transition`];
    return [];
  }).slice(0, 8));
  if (violations.length) throw new Error(`${label}: non-essential motion remains under reduced motion: ${violations.join('; ')}`);
}

async function assertApplicableControlStates(page, fixture) {
  if (fixture.id === 'landing') {
    const start = await assertVisible(page, '#btn-start-game', fixture.title);
    await start.hover();
    if (!await start.evaluate(element => element.matches(':hover'))) throw new Error('Landing: primary action does not expose a hover state.');
    await start.focus();
    if (!await start.evaluate(element => element.matches(':focus-visible'))) throw new Error('Landing: primary action does not expose focus-visible.');
    const box = await start.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const active = await start.evaluate(element => element.matches(':active'));
    await page.mouse.up();
    if (!active) throw new Error('Landing: primary action does not expose an active state.');
    const selected = await page.locator('#btn-sprint').evaluate(element => element.classList.contains('active') && element.getAttribute('aria-pressed') === 'true');
    if (!selected) throw new Error('Landing: selected mode state is missing.');
  }
  if (fixture.id === 'unanswered-stage') {
    await page.locator('#btn-show-flag').click();
    const consumed = await page.locator('#btn-show-flag').evaluate(element => element.disabled && element.getAttribute('aria-disabled') === 'true' && element.getAttribute('aria-pressed') === 'true');
    if (!consumed) throw new Error('Unanswered stage: consumed hint disabled state is missing.');
  }
}

async function applyPageScale(page, scaleFactor) {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: scaleFactor || 1 });
  if (scaleFactor && scaleFactor !== 1) {
    await page.waitForFunction(scale => Math.abs(window.visualViewport.scale - scale) < 0.05, scaleFactor);
  }
}

function screenshotPath(output, state, viewport, suffix) {
  return path.join(output, state.id, `${viewport.id}--${suffix}.png`);
}

async function captureState(browser, baseUrl, output, fixture, viewport, reducedMotion) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    let seed = 0x6d2b79f5;
    Math.random = () => {
      seed |= 0;
      seed = seed + 0x6d2b79f5 | 0;
      let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  });
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const label = `${fixture.title} at ${viewport.id}${reducedMotion ? ' (reduced motion)' : ''}`;
  try {
    await prepareState(page, baseUrl, fixture.id);
    await applyPageScale(page, viewport.pageScaleFactor || 1);
    await page.waitForTimeout(100);
    const destination = screenshotPath(output, fixture, viewport, reducedMotion ? 'reduced-motion' : 'default');
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await page.screenshot({ path: destination, fullPage: true });
    await assertFixtureContract(page, fixture);
    await assertNoHorizontalOverflow(page, label);
    await assertPrimaryControlIsReachable(page, fixture.primaryControl, label);
    await assertNoTextOverlap(page, label);
    await assertNoBrokenAssets(page, label);
    await assertApplicableControlStates(page, fixture);
    if (reducedMotion) await assertReducedMotion(page, label);
    return destination;
  } finally {
    await context.close();
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); return; }
  const fixtures = JSON.parse(await fsp.readFile(FIXTURE_PATH, 'utf8'));
  const states = fixtures.states.filter(state => !options.state || state.id === options.state);
  const viewports = [...fixtures.representativeViewports, ...fixtures.zoomViewports].filter(viewport => !options.viewport || viewport.id === options.viewport);
  if (!states.length) throw new Error(`No state fixture matches ${options.state}.`);
  if (!viewports.length) throw new Error(`No viewport fixture matches ${options.viewport}.`);
  const { chromium } = loadPlaywright();
  const staticServer = options.baseUrl ? null : await startStaticServer(ROOT);
  const baseUrl = options.baseUrl || staticServer.baseUrl;
  const browser = await chromium.launch({ headless: !options.headed });
  const failures = [];
  let captures = 0;
  try {
    for (const viewport of viewports) {
      for (const state of states) {
        for (const reducedMotion of state.motionBearing ? [false, true] : [false]) {
          try {
            const destination = await captureState(browser, baseUrl, options.output, state, viewport, reducedMotion);
            captures += 1;
            console.log(`PASS ${path.relative(ROOT, destination)}`);
          } catch (error) {
            const label = `${state.id} at ${viewport.id}${reducedMotion ? ' (reduced motion)' : ''}`;
            failures.push(`${label}: ${error.message}`);
            console.error(`FAIL ${label}: ${error.message}`);
          }
        }
      }
    }
  } finally {
    await browser.close();
    if (staticServer) await new Promise(resolve => staticServer.server.close(resolve));
  }
  if (failures.length) throw new Error(`Visual QA failed (${failures.length}/${captures + failures.length} captures):\n${failures.join('\n')}`);
  console.log(`Visual QA passed: ${captures} captures written to ${options.output}.`);
}

run().catch(error => {
  console.error(`Visual QA could not complete: ${error.message}`);
  process.exitCode = 1;
});
