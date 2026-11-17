export interface CachedSectionEntry {
  id: string;
  docTop: number;
}

export interface DocumentRect {
  docLeft: number;
  docTop: number;
  width: number;
  height: number;
}

export function computeActiveNavSection(
  scrollY: number,
  sections: readonly CachedSectionEntry[],
  topThreshold = 180,
  anchorOffset = 140
): string {
  if (!sections.length || scrollY < topThreshold) {
    return '#top';
  }
  const threshold = scrollY + anchorOffset;
  let current = '#top';
  const ordered = sections
    .filter((entry) => entry.id !== '#top')
    .slice()
    .sort((a, b) => a.docTop - b.docTop);
  for (const entry of ordered) {
    if (entry.docTop <= threshold) {
      current = entry.id;
    }
  }
  return current;
}

export function computeScrollProgress(
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number,
  circumference: number
): { ratio: number; percent: number; dashOffset: number } {
  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  const ratio =
    maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
  return {
    ratio,
    percent: Math.round(ratio * 100),
    dashOffset: circumference * (1 - ratio),
  };
}

export function toCachedSpotlightCoordinates(
  clientX: number,
  clientY: number,
  scrollX: number,
  scrollY: number,
  docRect: DocumentRect
): { x: number; y: number; inside: boolean } {
  const x = clientX + scrollX - docRect.docLeft;
  const y = clientY + scrollY - docRect.docTop;
  const inside = x >= 0 && x <= docRect.width && y >= 0 && y <= docRect.height;
  return { x, y, inside };
}
