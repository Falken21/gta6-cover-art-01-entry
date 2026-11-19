// Vice City colour grades: each grade is a pair of overlay gradients plus the
// saturation/contrast the photos get. Overlays are drawn with 'overlay' and
// 'soft-light' so the photos keep their detail while the whole cover shifts
// toward a sunset or neon palette.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    top: ['rgba(255, 46, 136, 0.20)', 'rgba(255, 122, 61, 0.05)'],
    bottom: ['rgba(255, 122, 61, 0.05)', 'rgba(123, 47, 247, 0.34)'],
  },
  neon: {
    label: 'Neon Nights',
    top: ['rgba(0, 229, 255, 0.16)', 'rgba(255, 46, 136, 0.06)'],
    bottom: ['rgba(255, 46, 136, 0.06)', 'rgba(0, 40, 90, 0.38)'],
  },
  golden: {
    label: 'Golden Hour',
    top: ['rgba(255, 190, 60, 0.16)', 'rgba(255, 140, 40, 0.04)'],
    bottom: ['rgba(255, 140, 40, 0.04)', 'rgba(120, 40, 10, 0.30)'],
  },
  noir: {
    label: 'Noir',
    top: ['rgba(255, 255, 255, 0.06)', 'rgba(0, 0, 0, 0.10)'],
    bottom: ['rgba(0, 0, 0, 0.10)', 'rgba(0, 0, 0, 0.42)'],
  },
};

/** Paints a grade's two gradients over the whole cover (ctx, w, h). */
export function paintGrade(ctx, gradeName, w, h) {
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  top.addColorStop(0, grade.top[0]);
  top.addColorStop(1, grade.top[1]);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.55);
  const bottom = ctx.createLinearGradient(0, h * 0.45, 0, h);
  bottom.addColorStop(0, grade.bottom[0]);
  bottom.addColorStop(1, grade.bottom[1]);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
  ctx.restore();
}

/** A reusable halftone dot pattern, drawn once and tiled over the cover. */
export function halftonePattern(spacing) {
  const tile = document.createElement('canvas');
  tile.width = spacing;
  tile.height = spacing;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  tctx.beginPath();
  tctx.arc(spacing / 2, spacing / 2, spacing * 0.16, 0, Math.PI * 2);
  tctx.fill();
  return tile;
}

/** Drapes the halftone pattern over the cover at low strength. */
export function paintHalftone(ctx, w, h) {
  const spacing = Math.max(6, Math.round(w / 160));
  const pattern = ctx.createPattern(halftonePattern(spacing), 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Strokes the white or black keyline around every panel rectangle. */
export function paintKeylines(ctx, rects, keyline, w) {
  if (keyline === 'none') return;
  ctx.save();
  ctx.strokeStyle = keyline === 'black' ? '#0b0612' : '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(w / 360));
  for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.restore();
}
