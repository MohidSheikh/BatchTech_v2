export interface SpotlightEligibilityInput {
  pointerType?: string;
  prefersReducedMotion: boolean;
  isTouchOnlyDevice: boolean;
  modalOpen: boolean;
}

export interface SpotlightState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  active: boolean;
  initialized: boolean;
}

export const DARK_SPOTLIGHT_SELECTORS = [
  '.hero',
  '.sect--services',
  '.sect--process',
  '.contact',
  '.foot',
] as const;

export const LIGHT_EXCLUDED_SELECTORS = [
  '.statstrip',
  '.marquee',
  '.sect--work',
  '.diff',
  '.collab',
  '.faq',
] as const;

export function shouldEnableCursorSpotlight(input: SpotlightEligibilityInput): boolean {
  if (input.prefersReducedMotion) return false;
  if (input.isTouchOnlyDevice) return false;
  if (input.modalOpen) return false;
  if (input.pointerType && input.pointerType !== 'mouse') return false;
  return true;
}

export function toSectionLocalCoordinates(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number; inside: boolean } {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
  return { x, y, inside };
}

export function stepSpotlightPosition(
  state: SpotlightState,
  dtMs: number,
  smoothingRate = 0.009
): { state: SpotlightState; settled: boolean } {
  const clampedDt = Math.min(64, Math.max(1, dtMs));
  if (!state.initialized) {
    return {
      state: {
        ...state,
        currentX: state.targetX,
        currentY: state.targetY,
        initialized: true,
      },
      settled: true,
    };
  }

  const dx = state.targetX - state.currentX;
  const dy = state.targetY - state.currentY;
  if (Math.hypot(dx, dy) < 0.25) {
    return {
      state: {
        ...state,
        currentX: state.targetX,
        currentY: state.targetY,
      },
      settled: true,
    };
  }

  const alpha = 1 - Math.exp(-clampedDt * smoothingRate);
  return {
    state: {
      ...state,
      currentX: state.currentX + dx * alpha,
      currentY: state.currentY + dy * alpha,
    },
    settled: false,
  };
}
