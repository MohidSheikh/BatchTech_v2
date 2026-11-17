import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeActiveNavSection,
  computeScrollProgress,
  toCachedSpotlightCoordinates,
} from './layoutGeometry.ts';

test('computeActiveNavSection selects current section without live DOM reads', () => {
  const sections = [
    { id: '#top', docTop: 0 },
    { id: '#about', docTop: 720 },
    { id: '#services', docTop: 1400 },
    { id: '#work', docTop: 2200 },
    { id: '#contact', docTop: 3400 },
  ];
  assert.equal(computeActiveNavSection(0, sections), '#top');
  assert.equal(computeActiveNavSection(150, sections), '#top');
  assert.equal(computeActiveNavSection(600, sections), '#about');
  assert.equal(computeActiveNavSection(1300, sections), '#services');
  assert.equal(computeActiveNavSection(3300, sections), '#contact');
});

test('computeScrollProgress clamps ratio, percent, and stroke-dashoffset', () => {
  const c = 144.513;
  assert.deepEqual(computeScrollProgress(0, 4000, 1000, c), {
    ratio: 0,
    percent: 0,
    dashOffset: c,
  });
  const mid = computeScrollProgress(1500, 4000, 1000, c);
  assert.equal(mid.percent, 50);
  assert.ok(Math.abs(mid.dashOffset - c * 0.5) < 0.001);
  assert.equal(computeScrollProgress(5000, 4000, 1000, c).percent, 100);
});

test('toCachedSpotlightCoordinates maps viewport pointer coordinates via scroll offsets', () => {
  const rect = { docLeft: 0, docTop: 1400, width: 1440, height: 600 };
  assert.deepEqual(toCachedSpotlightCoordinates(320, 250, 0, 1300, rect), {
    x: 320,
    y: 150,
    inside: true,
  });
  assert.deepEqual(toCachedSpotlightCoordinates(320, 50, 0, 1300, rect), {
    x: 320,
    y: -50,
    inside: false,
  });
});
