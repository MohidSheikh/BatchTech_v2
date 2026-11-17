import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DARK_SPOTLIGHT_SELECTORS,
  LIGHT_EXCLUDED_SELECTORS,
  shouldEnableCursorSpotlight,
  stepSpotlightPosition,
  toSectionLocalCoordinates,
} from './darkSpotlight.ts';

test('dark and light section lists stay strictly disjoint and cover all five dark sections', () => {
  assert.deepEqual(
    [...DARK_SPOTLIGHT_SELECTORS],
    ['.hero', '.sect--services', '.sect--process', '.contact', '.foot']
  );
  for (const darkSelector of DARK_SPOTLIGHT_SELECTORS) {
    assert.equal(
      (LIGHT_EXCLUDED_SELECTORS as readonly string[]).includes(darkSelector),
      false
    );
  }
});

test('shouldEnableCursorSpotlight blocks touch, reduced-motion, non-mouse pointers, and open modals', () => {
  assert.equal(
    shouldEnableCursorSpotlight({
      pointerType: 'mouse',
      prefersReducedMotion: false,
      isTouchOnlyDevice: false,
      modalOpen: false,
    }),
    true
  );

  assert.equal(
    shouldEnableCursorSpotlight({
      pointerType: 'touch',
      prefersReducedMotion: false,
      isTouchOnlyDevice: false,
      modalOpen: false,
    }),
    false
  );

  assert.equal(
    shouldEnableCursorSpotlight({
      pointerType: 'mouse',
      prefersReducedMotion: true,
      isTouchOnlyDevice: false,
      modalOpen: false,
    }),
    false
  );

  assert.equal(
    shouldEnableCursorSpotlight({
      pointerType: 'mouse',
      prefersReducedMotion: false,
      isTouchOnlyDevice: true,
      modalOpen: false,
    }),
    false
  );

  assert.equal(
    shouldEnableCursorSpotlight({
      pointerType: 'mouse',
      prefersReducedMotion: false,
      isTouchOnlyDevice: false,
      modalOpen: true,
    }),
    false
  );
});

test('toSectionLocalCoordinates calculates local coordinates and bounds accurately', () => {
  const rect = { left: 100, top: 200, width: 800, height: 500 };
  assert.deepEqual(toSectionLocalCoordinates(350, 420, rect), {
    x: 250,
    y: 220,
    inside: true,
  });
  assert.deepEqual(toSectionLocalCoordinates(50, 420, rect), {
    x: -50,
    y: 220,
    inside: false,
  });
  assert.deepEqual(toSectionLocalCoordinates(350, 750, rect), {
    x: 250,
    y: 550,
    inside: false,
  });
});

test('stepSpotlightPosition snaps on first activation and smoothly trails afterward', () => {
  const initial = stepSpotlightPosition(
    {
      currentX: 0,
      currentY: 0,
      targetX: 300,
      targetY: 200,
      active: true,
      initialized: false,
    },
    16
  );

  assert.equal(initial.settled, true);
  assert.equal(initial.state.initialized, true);
  assert.equal(initial.state.currentX, 300);
  assert.equal(initial.state.currentY, 200);

  let trailing = {
    ...initial.state,
    targetX: 500,
    targetY: 400,
  };
  const step1 = stepSpotlightPosition(trailing, 16);
  assert.equal(step1.settled, false);
  assert.ok(step1.state.currentX > 300 && step1.state.currentX < 500);
  assert.ok(step1.state.currentY > 200 && step1.state.currentY < 400);

  trailing = step1.state;
  let settled = false;
  for (let i = 0; i < 120; i++) {
    const next = stepSpotlightPosition(trailing, 16);
    trailing = next.state;
    if (next.settled) {
      settled = true;
      break;
    }
  }
  assert.equal(settled, true);
  assert.equal(trailing.currentX, 500);
  assert.equal(trailing.currentY, 400);
});
