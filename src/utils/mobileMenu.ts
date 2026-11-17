export const MOBILE_NAV_BREAKPOINT_PX = 820;

export interface OutsideInteractionParams {
  isMenuOpen: boolean;
  targetInsideMenu: boolean;
  targetInsideToggle: boolean;
}

export function shouldCloseMobileMenuOnOutsideInteraction({
  isMenuOpen,
  targetInsideMenu,
  targetInsideToggle,
}: OutsideInteractionParams): boolean {
  if (!isMenuOpen) return false;
  if (targetInsideMenu || targetInsideToggle) return false;
  return true;
}

export function shouldCloseMobileMenuOnKeyDown(isMenuOpen: boolean, key: string): boolean {
  return isMenuOpen && key === 'Escape';
}

export function shouldLockScrollForMobileMenu(
  isMenuOpen: boolean,
  viewportWidth: number
): boolean {
  return isMenuOpen && viewportWidth <= MOBILE_NAV_BREAKPOINT_PX;
}

export function shouldUnlockScrollOnMobileMenuClose(isModalOpen: boolean): boolean {
  return !isModalOpen;
}
