// Vice Cover Studio — a static, offline GTA-style multi-panel cover maker.
// No network at runtime: every script, image and style lives under app/.
// Photos come from the user's machine or the bundled AI-made samples.

const SAMPLE_PHOTOS = [
  { src: 'samples/vice-night.jpg', label: 'Neon Street' },
  { src: 'samples/beach-sunset.jpg', label: 'Beach Sunset' },
  { src: 'samples/portrait-neon.jpg', label: 'Neon Portrait' },
  { src: 'samples/sportscar.jpg', label: 'Coast Drive' },
];

// Panel rectangles as fractions of the cover (x, y, w, h). Gutters stay white.
const LAYOUTS = {
  split: [
    { x: 0, y: 0, w: 0.62, h: 1 },
    { x: 0.64, y: 0, w: 0.36, h: 0.49 },
    { x: 0.64, y: 0.51, w: 0.36, h: 0.49 },
  ],
  triptych: [
    { x: 0, y: 0, w: 0.32, h: 1 },
    { x: 0.34, y: 0, w: 0.32, h: 1 },
    { x: 0.68, y: 0, w: 0.32, h: 1 },
  ],
  sunset: [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.6, w: 0.49, h: 0.4 },
    { x: 0.51, y: 0.6, w: 0.49, h: 0.4 },
  ],
};

// Colour grades: a top-to-bottom tint washed over the panels.
const GRADES = {
  sunset: { top: 'rgba(255, 122, 26, 0.34)', bottom: 'rgba(255, 46, 136, 0.34)', glow: 'rgba(255, 190, 80, 0.20)' },
  neon: { top: 'rgba(34, 211, 238, 0.30)', bottom: 'rgba(255, 46, 136, 0.36)', glow: 'rgba(168, 85, 247, 0.22)' },
  golden: { top: 'rgba(255, 196, 66, 0.36)', bottom: 'rgba(214, 116, 28, 0.30)', glow: 'rgba(255, 236, 170, 0.22)' },
  noir: { top: 'rgba(20, 20, 40, 0.30)', bottom: 'rgba(120, 40, 160, 0.26)', glow: 'rgba(90, 140, 255, 0.14)' },
};

const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: 'Square' },
  { w: 1080, h: 1350, label: 'Portrait' },
  { w: 1920, h: 1080, label: 'Wide' },
];

const state = {
  photos: [],          // { src, img, label }
  layout: 'split',
  grade: 'sunset',
  caption: 'SUNSET HEIST',
  captionScale: 1,
  captionY: 0.86,
  previewW: 1080,
  previewH: 1080,
  panels: [],          // { photo, zoom, ox, oy } — ox/oy are fractions of panel size
  selectedPanel: 0,
  panelPicked: false,  // true after the user clicks a panel: next photo goes there only
};

const canvas = document.getElementById('coverCanvas');
const ctx = canvas.getContext('2d');

function blankPanel() {
  return { photo: 0, zoom: 1.2, ox: 0, oy: 0 };
}

function resetPanelsForLayout(layoutName) {
  const count = LAYOUTS[layoutName].length;
  const kept = state.panels.slice(0, count);
  while (kept.length < count) kept.push(blankPanel());
  state.panels = kept;
  state.selectedPanel = 0;
  state.panelPicked = false;
}

function loadPhoto(src, label) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ src, img, label: label || src });
    img.onerror = () => reject(new Error('Could not load photo: ' + src));
    img.src = src;
  });
}

async function addPhoto(src, label) {
  const photo = await loadPhoto(src, label);
  state.photos.push(photo);
  return state.photos.length - 1;
}

function assignPhotoToPanels(photoIndex) {
  if (state.panelPicked) {
    state.panels[state.selectedPanel].photo = photoIndex;
    state.panelPicked = false;
  } else {
    for (const panel of state.panels) panel.photo = photoIndex;
  }
  syncPanelNote();
  renderPreview();
}

function drawPhotoCover(targetCtx, photo, rect, zoom, ox, oy) {
  const img = photo.img;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  targetCtx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(targetCtx, width, height) {
  const grade = GRADES[state.grade];
  const wash = targetCtx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  targetCtx.save();
  targetCtx.globalCompositeOperation = 'overlay';
  targetCtx.fillStyle = wash;
  targetCtx.fillRect(0, 0, width, height);
  targetCtx.globalCompositeOperation = 'soft-light';
  targetCtx.fillStyle = grade.glow;
  targetCtx.fillRect(0, 0, width, height);
  targetCtx.restore();

  // Vignette: darken the corners so the caption pops.
  const vignette = targetCtx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.42,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,4,20,0.38)');
  targetCtx.fillStyle = vignette;
  targetCtx.fillRect(0, 0, width, height);
}

function drawCaption(targetCtx, width, height) {
  const text = (state.caption || '').trim().toUpperCase();
  if (!text) return;
  let size = Math.round(width * 0.105 * state.captionScale);
  targetCtx.save();
  targetCtx.font = `${size}px Impact, "Arial Black", "Franklin Gothic Medium", sans-serif`;
  // Shrink long captions until they fit inside the cover instead of clipping.
  const maxTextWidth = width * 0.92;
  while (size > 12 && targetCtx.measureText(text).width > maxTextWidth) {
    size = Math.round(size * 0.94);
    targetCtx.font = `${size}px Impact, "Arial Black", "Franklin Gothic Medium", sans-serif`;
  }
  try { targetCtx.letterSpacing = `${Math.round(size * 0.045)}px`; } catch (e) { /* older canvas: ignore */ }
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  const y = height * state.captionY;
  // Dark band behind the letters for legibility on any photo.
  const bandH = size * 1.5;
  const band = targetCtx.createLinearGradient(0, y - bandH / 2, 0, y + bandH / 2);
  band.addColorStop(0, 'rgba(10,4,20,0)');
  band.addColorStop(0.5, 'rgba(10,4,20,0.55)');
  band.addColorStop(1, 'rgba(10,4,20,0)');
  targetCtx.fillStyle = band;
  targetCtx.fillRect(0, y - bandH / 2, width, bandH);
  targetCtx.lineWidth = Math.max(4, size * 0.16);
  targetCtx.lineJoin = 'round';
  targetCtx.strokeStyle = '#160826';
  targetCtx.strokeText(text, width / 2, y);
  const fill = targetCtx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(1, '#ffd166');
  targetCtx.fillStyle = fill;
  targetCtx.fillText(text, width / 2, y);
  targetCtx.restore();
}

function drawBrandTag(targetCtx, width) {
  const size = Math.max(14, Math.round(width * 0.02));
  targetCtx.save();
  targetCtx.font = `700 ${size}px "Segoe UI", Arial, sans-serif`;
  try { targetCtx.letterSpacing = `${Math.round(size * 0.32)}px`; } catch (e) { /* ignore */ }
  targetCtx.textAlign = 'left';
  targetCtx.textBaseline = 'top';
  targetCtx.fillStyle = 'rgba(255,255,255,0.92)';
  targetCtx.shadowColor = 'rgba(0,0,0,0.7)';
  targetCtx.shadowBlur = size * 0.4;
  targetCtx.fillText('VICE COVER STUDIO', Math.round(width * 0.025), Math.round(width * 0.025));
  targetCtx.restore();
}

// Draw the whole cover at any exact size. Used for the preview and the exports.
function renderCover(targetCtx, width, height) {
  targetCtx.save();
  targetCtx.clearRect(0, 0, width, height);
  targetCtx.fillStyle = '#ffffff'; // gutters + outer frame
  targetCtx.fillRect(0, 0, width, height);
  const gutter = Math.max(2, Math.round(width * 0.006));
  const rects = LAYOUTS[state.layout];
  rects.forEach((frac, i) => {
    const panel = state.panels[i] || blankPanel();
    const photo = state.photos[panel.photo];
    if (!photo) return;
    const rect = {
      x: Math.round(frac.x * width) + gutter,
      y: Math.round(frac.y * height) + gutter,
      w: Math.round(frac.w * width) - gutter * 2,
      h: Math.round(frac.h * height) - gutter * 2,
    };
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.rect(rect.x, rect.y, rect.w, rect.h);
    targetCtx.clip();
    drawPhotoCover(targetCtx, photo, rect, panel.zoom, panel.ox, panel.oy);
    targetCtx.restore();
  });
  applyGrade(targetCtx, width, height);
  drawCaption(targetCtx, width, height);
  drawBrandTag(targetCtx, width);
  targetCtx.restore();
}

function renderPreview() {
  canvas.width = state.previewW;
  canvas.height = state.previewH;
  renderCover(ctx, state.previewW, state.previewH);
  const note = document.getElementById('emptyNote');
  if (note) note.style.display = state.photos.length ? 'none' : '';
  syncCropSliders();
}

function exportDataURL(width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  renderCover(off.getContext('2d'), width, height);
  return off.toDataURL('image/png');
}

function exportPNG(width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  renderCover(off.getContext('2d'), width, height);
  off.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-cover-${width}x${height}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function syncCropSliders() {
  const panel = state.panels[state.selectedPanel] || blankPanel();
  const zoom = document.getElementById('zoomSlider');
  const panX = document.getElementById('panXSlider');
  const panY = document.getElementById('panYSlider');
  zoom.value = panel.zoom;
  panX.value = Math.round(panel.ox * 100);
  panY.value = Math.round(panel.oy * 100);
  document.getElementById('zoomOut').textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById('panXOut').textContent = String(Math.round(panel.ox * 100));
  document.getElementById('panYOut').textContent = String(Math.round(panel.oy * 100));
}

function syncPanelNote() {
  const note = document.getElementById('panelNote');
  if (note) {
    note.textContent = `Panel ${state.selectedPanel + 1} selected — drag on the cover to move it, sliders below to zoom and nudge.`;
  }
  document.querySelectorAll('.sample-thumb').forEach((button) => {
    button.classList.toggle('is-active', false);
  });
}

function panelAtPoint(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const fx = (clientX - box.left) / box.width;
  const fy = (clientY - box.top) / box.height;
  const rects = LAYOUTS[state.layout];
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvasDragging() {
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  let dragPanel = -1;

  canvas.addEventListener('pointerdown', (event) => {
    const index = panelAtPoint(event.clientX, event.clientY);
    if (index < 0 || !state.photos.length) return;
    dragging = true;
    moved = false;
    dragPanel = index;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!dragging || dragPanel < 0) return;
    const box = canvas.getBoundingClientRect();
    const panel = state.panels[dragPanel];
    const rect = LAYOUTS[state.layout][dragPanel];
    const dx = (event.clientX - lastX) / box.width / Math.max(rect.w, 0.01);
    const dy = (event.clientY - lastY) / box.height / Math.max(rect.h, 0.01);
    if (Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY) > 3) moved = true;
    panel.ox = Math.max(-1, Math.min(1, panel.ox + dx));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + dy));
    lastX = event.clientX;
    lastY = event.clientY;
    state.selectedPanel = dragPanel;
    state.panelPicked = true;
    syncPanelNote();
    renderPreview();
  });

  canvas.addEventListener('pointerup', () => {
    if (dragging && !moved && dragPanel >= 0) {
      state.selectedPanel = dragPanel;
      state.panelPicked = true;
      syncPanelNote();
      renderPreview();
    }
    dragging = false;
    dragPanel = -1;
  });
}

function wireControls() {
  document.getElementById('sampleStrip').addEventListener('click', async (event) => {
    const button = event.target.closest('.sample-thumb');
    if (!button) return;
    const index = await addPhoto(button.dataset.sample, button.querySelector('span').textContent);
    assignPhotoToPanels(index);
  });

  document.getElementById('photoUpload').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const index = await addPhoto(dataUrl, file.name);
      assignPhotoToPanels(index);
    }
    event.target.value = '';
  });

  document.getElementById('layoutRow').addEventListener('click', (event) => {
    const button = event.target.closest('[data-layout]');
    if (!button) return;
    state.layout = button.dataset.layout;
    resetPanelsForLayout(state.layout);
    document.querySelectorAll('#layoutRow .choice').forEach((b) => {
      b.classList.toggle('is-active', b === button);
    });
    syncPanelNote();
    renderPreview();
  });

  document.getElementById('gradeRow').addEventListener('click', (event) => {
    const button = event.target.closest('[data-grade]');
    if (!button) return;
    state.grade = button.dataset.grade;
    document.querySelectorAll('#gradeRow .choice').forEach((b) => {
      b.classList.toggle('is-active', b === button);
    });
    renderPreview();
  });

  document.querySelectorAll('.size-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const [w, h] = button.dataset.preview.split('x').map(Number);
      state.previewW = w;
      state.previewH = h;
      document.querySelectorAll('.size-btn').forEach((b) => {
        b.classList.toggle('is-active', b === button);
      });
      renderPreview();
    });
  });

  document.getElementById('zoomSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].zoom = Number(event.target.value);
    renderPreview();
  });
  document.getElementById('panXSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].ox = Number(event.target.value) / 100;
    renderPreview();
  });
  document.getElementById('panYSlider').addEventListener('input', (event) => {
    state.panels[state.selectedPanel].oy = Number(event.target.value) / 100;
    renderPreview();
  });
  document.getElementById('resetCropBtn').addEventListener('click', () => {
    state.panels[state.selectedPanel] = blankPanel();
    state.panels[state.selectedPanel].photo = state.photos.length - 1;
    renderPreview();
  });

  document.getElementById('captionInput').addEventListener('input', (event) => {
    state.caption = event.target.value;
    renderPreview();
  });
  document.getElementById('captionSizeSlider').addEventListener('input', (event) => {
    state.captionScale = Number(event.target.value) / 100;
    document.getElementById('captionSizeOut').textContent = `${event.target.value}%`;
    renderPreview();
  });
  document.getElementById('captionYSlider').addEventListener('input', (event) => {
    state.captionY = Number(event.target.value) / 100;
    document.getElementById('captionYOut').textContent = `${event.target.value}%`;
    renderPreview();
  });

  document.querySelectorAll('[data-export]').forEach((button) => {
    button.addEventListener('click', () => {
      const [w, h] = button.dataset.export.split('x').map(Number);
      exportPNG(w, h);
    });
  });
}

// Screenshot mode (?shot=cover or ?shot=editor), used to take the entry's
// screenshots deterministically: ?photo=<sample file>&caption=...&layout=...
// &grade=...&w=...&h=...
async function applyShotParams() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('shot')) return false;
  const shot = params.get('shot');
  const photo = params.get('photo');
  const caption = params.get('caption');
  const layout = params.get('layout');
  const grade = params.get('grade');
  if (caption !== null) {
    state.caption = caption;
    document.getElementById('captionInput').value = caption;
  }
  if (layout && LAYOUTS[layout]) {
    state.layout = layout;
    document.querySelectorAll('#layoutRow .choice').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.layout === layout);
    });
  }
  if (grade && GRADES[grade]) {
    state.grade = grade;
    document.querySelectorAll('#gradeRow .choice').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.grade === grade);
    });
  }
  resetPanelsForLayout(state.layout);
  const wanted = photo ? `samples/${photo}` : SAMPLE_PHOTOS[0].src;
  const index = await addPhoto(wanted, 'shot photo');
  for (const panel of state.panels) panel.photo = index;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(params.get('w') || 1920);
    const h = Number(params.get('h') || 1080);
    state.previewW = w;
    state.previewH = h;
  }
  renderPreview();
  return true;
}

async function boot() {
  wireControls();
  wireCanvasDragging();
  resetPanelsForLayout(state.layout);
  const shotMode = await applyShotParams();
  if (!shotMode) {
    const index = await addPhoto(SAMPLE_PHOTOS[0].src, SAMPLE_PHOTOS[0].label);
    for (const panel of state.panels) panel.photo = index;
    renderPreview();
  }
  window.ViceCover = {
    state,
    renderCover,
    exportDataURL,
    exportPNG,
    loadSample: addPhoto,
    setLayout(name) { state.layout = name; resetPanelsForLayout(name); renderPreview(); },
    setGrade(name) { state.grade = name; renderPreview(); },
    ready: true,
  };
}

boot().catch((error) => {
  console.error(error);
  const note = document.getElementById('emptyNote');
  if (note) note.textContent = 'Could not start the studio: ' + error.message;
});
