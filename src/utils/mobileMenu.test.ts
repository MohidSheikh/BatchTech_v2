import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOBILE_NAV_BREAKPOINT_PX,
  shouldCloseMobileMenuOnKeyDown,
  shouldCloseMobileMenuOnOutsideInteraction,
  shouldLockScrollForMobileMenu,
  shouldUnlockScrollOnMobileMenuClose,
} from './mobileMenu.ts';

test('shouldCloseMobileMenuOnOutsideInteraction closes only when open and target is outside menu and toggle', () => {
  assert.equal(
    shouldCloseMobileMenuOnOutsideInteraction({
      isMenuOpen: true,
      targetInsideMenu: false,
      targetInsideToggle: false,
    }),
    true
  );

  assert.equal(
    shouldCloseMobileMenuOnOutsideInteraction({
      isMenuOpen: true,
      targetInsideMenu: true,
      targetInsideToggle: false,
    }),
    false
  );

  assert.equal(
    shouldCloseMobileMenuOnOutsideInteraction({
      isMenuOpen: true,
      targetInsideMenu: false,
      targetInsideToggle: true,
    }),
    false
  );

  assert.equal(
    shouldCloseMobileMenuOnOutsideInteraction({
      isMenuOpen: false,
      targetInsideMenu: false,
      targetInsideToggle: false,
    }),
    false
  );
});

test('shouldCloseMobileMenuOnKeyDown closes open menu on Escape only', () => {
  assert.equal(shouldCloseMobileMenuOnKeyDown(true, 'Escape'), true);
  assert.equal(shouldCloseMobileMenuOnKeyDown(true, 'Enter'), false);
  assert.equal(shouldCloseMobileMenuOnKeyDown(false, 'Escape'), false);
});

test('shouldLockScrollForMobileMenu locks only on mobile widths when open', () => {
  assert.equal(shouldLockScrollForMobileMenu(true, 390), true);
  assert.equal(shouldLockScrollForMobileMenu(true, MOBILE_NAV_BREAKPOINT_PX), true);
  assert.equal(shouldLockScrollForMobileMenu(true, MOBILE_NAV_BREAKPOINT_PX + 1), false);
  assert.equal(shouldLockScrollForMobileMenu(false, 390), false);
});

test('shouldUnlockScrollOnMobileMenuClose unlocks unless modal is open', () => {
  assert.equal(shouldUnlockScrollOnMobileMenuClose(false), true);
  assert.equal(shouldUnlockScrollOnMobileMenuClose(true), false);
});
