// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows the cover alone, full-bleed. Query params
// pick the layout, caption, tagline and grade. window.__shotReady is set
// once the fonts are loaded and the cover is painted.
import { resizePanelsForLayout } from './editor.js';

export async function runShot(shot, query, api) {
  const { state, redraw, setPreviewSize } = api;
  if (query.get('layout')) {
    state.layout = query.get('layout');
    resizePanelsForLayout(state);
  }
  if (query.get('caption')) state.caption = query.get('caption');
  if (query.get('tagline')) state.tagline = query.get('tagline');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size') && setPreviewSize) setPreviewSize(query.get('size'));
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor-alt') {
    state.layout = query.get('layout') ?? 'grid';
    resizePanelsForLayout(state);
    state.selectedPanel = 2;
    const captionInput = document.getElementById('caption');
    if (captionInput) {
      captionInput.focus();
      captionInput.setSelectionRange(captionInput.value.length, captionInput.value.length);
    }
  }
  await document.fonts.load('100px Anton');
  await document.fonts.ready;
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
