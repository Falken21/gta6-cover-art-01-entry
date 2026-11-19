// Wires the page: loads the sample photos, builds the cover state, binds every
// control, and redraws the live preview. A `?shot=` query sets up a fixed scene
// for a screenshot instead (./shots.js).
import { drawCover } from './cover.js';
import { layoutRects, panelAt, LAYOUTS } from './layouts.js';
import {
  loadImage, loadSamplePhotos, buildDefaultState, resizePanelsForLayout,
  assignPhotoToPanel, fillAllPanels,
} from './editor.js';
import { exportCover, EXPORT_SIZES } from './exporter.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const tray = document.getElementById('tray');
const hint = document.getElementById('panelHint');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panX');
const panYInput = document.getElementById('panY');

let photos = [];
let state = null;
let selectedPhoto = null;

function redraw() {
  if (!state) return;
  drawCover(ctx, canvas.width, canvas.height, state);
}

function syncCropControls() {
  const panel = state.panels[state.selectedPanel];
  if (!panel) return;
  zoomInput.value = String(panel.zoom);
  panXInput.value = String(panel.panX);
  panYInput.value = String(panel.panY);
  hint.textContent = `Panel ${state.selectedPanel + 1} of ${state.panels.length} selected — drag on the cover to pan, scroll to zoom.`;
}

/** Reflects the whole cover state in the controls (used after a shot scene
    changes the state behind the controls' backs). */
function syncAllControls() {
  document.querySelectorAll('#templates button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.getElementById('caption').value = state.caption;
  document.getElementById('tagline').value = state.tagline;
  document.getElementById('grade').value = state.grade;
  document.getElementById('saturation').value = String(state.saturation);
  document.getElementById('contrast').value = String(state.contrast);
  document.getElementById('halftone').checked = state.halftone;
  document.getElementById('keyline').value = state.keyline;
  syncCropControls();
}

function selectPanel(index) {
  state.selectedPanel = index;
  syncCropControls();
  redraw();
}

function buildTemplateButtons() {
  const wrap = document.getElementById('templates');
  for (const [key, layout] of Object.entries(LAYOUTS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = layout.label;
    button.dataset.layout = key;
    if (key === state.layout) button.classList.add('active');
    button.addEventListener('click', () => {
      state.layout = key;
      resizePanelsForLayout(state);
      wrap.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
      syncCropControls();
      redraw();
    });
    wrap.appendChild(button);
  }
}

function buildTray() {
  tray.innerHTML = '';
  for (const photo of photos) {
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = photo.name;
    thumb.title = photo.name;
    if (photo === selectedPhoto) thumb.classList.add('selected');
    thumb.addEventListener('click', () => {
      selectedPhoto = photo;
      assignPhotoToPanel(state, state.selectedPanel, photo);
      buildTray();
      redraw();
    });
    tray.appendChild(thumb);
  }
}

async function addUploadedFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const photo = { name: file.name.replace(/\.[^.]+$/, ''), src: url, img };
      photos.push(photo);
      selectedPhoto = photo;
      assignPhotoToPanel(state, state.selectedPanel, photo);
    } catch {
      status.textContent = `Could not read ${file.name}.`;
    }
  }
  buildTray();
  redraw();
}

function setPreviewSize(sizeKey) {
  const size = EXPORT_SIZES[sizeKey] ?? EXPORT_SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function bindCanvasGestures() {
  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const index = panelAt(state.layout, canvas.width, canvas.height, point.x, point.y);
    selectPanel(index);
    dragging = { x: point.x, y: point.y };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const point = canvasPoint(event);
    const panel = state.panels[state.selectedPanel];
    const rects = layoutRects(state.layout, canvas.width, canvas.height);
    const rect = rects[state.selectedPanel];
    panel.panX = clamp(panel.panX + (point.x - dragging.x) / rect.w, -0.5, 0.5);
    panel.panY = clamp(panel.panY + (point.y - dragging.y) / rect.h, -0.5, 0.5);
    dragging = { x: point.x, y: point.y };
    syncCropControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const panel = state.panels[state.selectedPanel];
    panel.zoom = clamp(panel.zoom * (event.deltaY < 0 ? 1.08 : 0.92), 1, 3);
    syncCropControls();
    redraw();
  }, { passive: false });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function bindControls() {
  document.getElementById('photo').addEventListener('change', (e) => {
    addUploadedFiles([...e.target.files]);
    e.target.value = '';
  });
  document.getElementById('fillAll').addEventListener('click', () => {
    if (!selectedPhoto) return;
    fillAllPanels(state, selectedPhoto);
    redraw();
    status.textContent = `All panels now use ${selectedPhoto.name}.`;
  });
  zoomInput.addEventListener('input', () => {
    state.panels[state.selectedPanel].zoom = Number(zoomInput.value);
    redraw();
  });
  panXInput.addEventListener('input', () => {
    state.panels[state.selectedPanel].panX = Number(panXInput.value);
    redraw();
  });
  panYInput.addEventListener('input', () => {
    state.panels[state.selectedPanel].panY = Number(panYInput.value);
    redraw();
  });
  document.getElementById('caption').addEventListener('input', (e) => {
    state.caption = e.target.value;
    redraw();
  });
  document.getElementById('tagline').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    redraw();
  });
  document.getElementById('grade').addEventListener('change', (e) => {
    state.grade = e.target.value;
    redraw();
  });
  document.getElementById('saturation').addEventListener('input', (e) => {
    state.saturation = Number(e.target.value);
    redraw();
  });
  document.getElementById('contrast').addEventListener('input', (e) => {
    state.contrast = Number(e.target.value);
    redraw();
  });
  document.getElementById('halftone').addEventListener('change', (e) => {
    state.halftone = e.target.checked;
    redraw();
  });
  document.getElementById('keyline').addEventListener('change', (e) => {
    state.keyline = e.target.value;
    redraw();
  });
  document.getElementById('previewSize').addEventListener('change', (e) => {
    setPreviewSize(e.target.value);
  });
  for (const [key, buttonId] of [['square', 'exportSquare'], ['portrait', 'exportPortrait'], ['wide', 'exportWide']]) {
    document.getElementById(buttonId).addEventListener('click', async () => {
      try {
        const result = await exportCover(state, key);
        status.textContent = `Saved ${result.file} (${result.w} x ${result.h}, ${(result.bytes / 1024).toFixed(0)} KiB).`;
      } catch (error) {
        status.textContent = `Export failed: ${error.message}`;
      }
    });
  }
  const dropzone = document.getElementById('dropzone');
  dropzone.addEventListener('dragover', (e) => e.preventDefault());
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    addUploadedFiles([...e.dataTransfer.files]);
  });
}

async function start() {
  photos = await loadSamplePhotos();
  state = buildDefaultState(photos);
  selectedPhoto = photos[0];
  buildTemplateButtons();
  buildTray();
  bindControls();
  bindCanvasGestures();
  syncCropControls();
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch {
    // The caption falls back to a heavy sans-serif if the font cannot load.
  }
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query.get('shot'), query, { state, redraw, setPreviewSize });
    syncAllControls();
    if (query.get('shot') === 'editor-alt') {
      const captionInput = document.getElementById('caption');
      captionInput.focus();
      captionInput.setSelectionRange(captionInput.value.length, captionInput.value.length);
    }
    redraw();
  } else {
    redraw();
  }
}

start();
