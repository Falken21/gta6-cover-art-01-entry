// Renders the whole cover onto a canvas 2D context at any size: the panel
// photos (each cropped with its own zoom and pan), the Vice City grade, the
// halftone texture, the panel keylines and the big poster caption. The live
// preview and the PNG export call this same function, so what you see is
// exactly what you download.
import { layoutRects } from './layouts.js';
import { paintGrade, paintHalftone, paintKeylines, GRADES } from './grade.js';

/** Draws one photo to cover a panel rectangle, honouring its zoom and pan. */
export function drawPanelPhoto(ctx, rect, photo, zoom, panX, panY, filter) {
  if (!photo) return;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + panX * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panY * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Fits the caption to the cover width and draws it in poster lettering. */
export function drawCaption(ctx, w, h, caption, tagline) {
  const text = caption.trim().toUpperCase();
  if (!text) return;
  const bandY = h * 0.74;
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(0.35, 'rgba(10, 4, 18, 0.62)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.86)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.06, w, h - bandY + h * 0.06);

  let size = h * 0.115;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Black', sans-serif`; };
  setFont(size);
  while (ctx.measureText(text).width > w * 0.92 && size > 12) {
    size -= 2;
    setFont(size);
  }
  const baseline = h - h * 0.055;
  ctx.save();
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeText(text, w / 2, baseline);
  const fill = ctx.createLinearGradient(0, baseline - size, 0, baseline);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.7, '#ffe9f4');
  fill.addColorStop(1, '#ffb3d9');
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, baseline);
  ctx.restore();

  const tag = tagline.trim().toUpperCase();
  if (tag) {
    const tagSize = Math.max(10, h * 0.021);
    ctx.save();
    ctx.font = `700 ${tagSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.globalAlpha = 0.95;
    ctx.fillText(spreadLetters(tag), w / 2, h - h * 0.018);
    ctx.restore();
  }
}

/** Inserts thin spaces so a tagline reads letterspaced on the canvas. */
export function spreadLetters(text) {
  return text.split('').join('\u2009');
}

/** Draws the full cover. `state` holds layout, panels, caption, grade and effects. */
export function drawCover(ctx, w, h, state) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14091f';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout, w, h);
  const noir = state.grade === 'noir';
  const filter = noir
    ? `grayscale(1) saturate(${state.saturation}) contrast(${state.contrast})`
    : `saturate(${state.saturation}) contrast(${state.contrast})`;
  state.panels.forEach((panel, i) => {
    const rect = rects[i];
    if (!rect) return;
    drawPanelPhoto(ctx, rect, panel.photo, panel.zoom, panel.panX, panel.panY, filter);
  });
  paintGrade(ctx, state.grade, w, h);
  if (state.halftone) paintHalftone(ctx, w, h);
  paintKeylines(ctx, rects, state.keyline, w);
  drawCaption(ctx, w, h, state.caption, state.tagline);
  if (state.selectedPanel != null && state.showSelection) {
    const r = rects[state.selectedPanel];
    if (r) {
      ctx.save();
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = Math.max(3, Math.round(w / 270));
      ctx.setLineDash([Math.round(w / 90), Math.round(w / 135)]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }
  }
}
