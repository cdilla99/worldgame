import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { EventBus } from '../src/core/events.js';
import { createTimer, TimerRing } from '../src/features/timer/index.js';

class FakeClassList {
  constructor() { this.values = new Set(); }
  set(value) { this.values = new Set(value.split(/\s+/).filter(Boolean)); }
  add(...values) { values.forEach(value => this.values.add(value)); }
  remove(...values) { values.forEach(value => this.values.delete(value)); }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.classList = new FakeClassList();
  }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'class') this.classList.set(String(value));
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentNode = null;
    return child;
  }
}

const document = { createElementNS: (_namespace, tagName) => new FakeElement(tagName) };
const source = await readFile(new URL('../timer-ring.js', import.meta.url), 'utf8');
const window = {};
const context = vm.createContext({ window, document, console });
vm.runInContext(source, context);
const classicTimerRing = window.TimerRing;
assert.equal(typeof classicTimerRing.create, 'function', 'classic script exports TimerRing');
vm.runInContext(source, context);
assert.strictEqual(window.TimerRing, classicTimerRing, 'module re-evaluation preserves the classic global');
assert.strictEqual(TimerRing, globalThis.TimerRing, 'ES module re-exports the global component');

const container = new FakeElement('div');
classicTimerRing.create(container, 999);
const events = new EventBus();
let intervalCallback = null;
const clock = {
  setInterval(callback) { intervalCallback = callback; return 1; },
  clearInterval() { intervalCallback = null; }
};
const timer = createTimer({ events, clock, timerRing: classicTimerRing });
events.emit('game:start', { mode: 'blitz' });
assert.equal(container.children[0].children[1].getAttribute('stroke-dashoffset'), '0', 'start resets ring');

intervalCallback();
const progress = container.children[0].children[1];
const circumference = 2 * Math.PI * 24;
assert.ok(
  Math.abs(Number(progress.getAttribute('stroke-dashoffset')) - circumference * (1 - 59 / 60)) < 1e-10,
  'clock tick updates visual depletion using the active duration'
);
assert.equal(container.children[0].classList.contains('timer-ring--green'), true);

events.emit('timer:tick', { remaining: 30 });
assert.ok(
  Math.abs(Number(progress.getAttribute('stroke-dashoffset')) - circumference / 2) < 1e-10,
  'timer:tick events directly update the visual component'
);
assert.equal(container.children[0].classList.contains('timer-ring--yellow'), true);

timer.dispose();
assert.equal(events.handlerCount('timer:tick'), 0, 'dispose removes visual tick subscription');
assert.throws(() => createTimer({ events, clock, timerRing: {} }), /Timer ring/);
console.log('timer ring integration tests passed (classic global + tick-driven SVG)');