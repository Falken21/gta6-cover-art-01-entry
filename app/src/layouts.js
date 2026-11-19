// Panel layouts for the cover: each template is a set of rectangles in
// normalised cover coordinates (x, y, width, height, each 0..1), so the same
// layout fits the square, portrait and wide export sizes.
export const LAYOUTS = {
  classic: {
    label: 'Vice Classic',
    panels: [
      [0.00, 0.00, 0.58, 0.62],
      [0.58, 0.00, 0.42, 0.31],
      [0.58, 0.31, 0.42, 0.31],
      [0.00, 0.62, 0.29, 0.38],
      [0.29, 0.62, 0.29, 0.38],
      [0.58, 0.62, 0.42, 0.38],
    ],
  },
  grid: {
    label: 'Neon Grid',
    panels: [
      [0.00, 0.00, 0.50, 0.50],
      [0.50, 0.00, 0.25, 0.25],
      [0.75, 0.00, 0.25, 0.25],
      [0.50, 0.25, 0.50, 0.25],
      [0.00, 0.50, 0.34, 0.50],
      [0.34, 0.50, 0.33, 0.50],
      [0.67, 0.50, 0.33, 0.50],
    ],
  },
  strip: {
    label: 'Sunset Strip',
    panels: [
      [0.00, 0.00, 1.00, 0.55],
      [0.00, 0.55, 0.34, 0.45],
      [0.34, 0.55, 0.33, 0.45],
      [0.67, 0.55, 0.33, 0.45],
    ],
  },
};

/** Returns the panel rectangles of a layout, in pixels for a cover of size w x h. */
export function layoutRects(layoutName, w, h) {
  const layout = LAYOUTS[layoutName] ?? LAYOUTS.classic;
  return layout.panels.map(([x, y, pw, ph]) => ({
    x: x * w, y: y * h, w: pw * w, h: ph * h,
  }));
}

/** Finds which panel (index) contains point (px, py) in a cover of size w x h. */
export function panelAt(layoutName, w, h, px, py) {
  const rects = layoutRects(layoutName, w, h);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) return i;
  }
  return 0;
}
