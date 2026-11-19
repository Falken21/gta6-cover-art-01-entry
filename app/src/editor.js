// The cover's state and the photo tray: loading the built-in sample photos,
// assigning photos to panels, and filling every panel with one photo.
import { LAYOUTS } from './layouts.js';

export const SAMPLE_PHOTOS = [
  { name: 'vice-night', src: 'samples/vice-night.jpg' },
  { name: 'portrait-neon', src: 'samples/portrait-neon.jpg' },
  { name: 'sportscar', src: 'samples/sportscar.jpg' },
  { name: 'beach-sunset', src: 'samples/beach-sunset.jpg' },
];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Loads the four built-in sample photos (AI-made, free to use). */
export async function loadSamplePhotos() {
  const photos = [];
  for (const sample of SAMPLE_PHOTOS) {
    const img = await loadImage(sample.src);
    photos.push({ name: sample.name, src: sample.src, img });
  }
  return photos;
}

/** One panel's photo crop: the photo plus its zoom and pan. */
export function blankPanel(photo) {
  return { photo: photo ? photo.img : null, photoName: photo ? photo.name : '', zoom: 1, panX: 0, panY: 0 };
}

/** The starting cover: the classic layout, sample photos cycling the panels. */
export function buildDefaultState(photos) {
  const count = LAYOUTS.classic.panels.length;
  const panels = [];
  for (let i = 0; i < count; i += 1) {
    panels.push(blankPanel(photos[i % photos.length]));
  }
  return {
    layout: 'classic',
    panels,
    caption: 'VICE NIGHTS',
    tagline: 'A TROPICAL CRIME STORY',
    grade: 'sunset',
    saturation: 1.15,
    contrast: 1.08,
    halftone: true,
    keyline: 'white',
    selectedPanel: 0,
    showSelection: true,
  };
}

/** Rebuilds the panels when the layout changes, keeping photos where they fit.
    Panels a layout adds beyond the old count inherit a photo cycled from the
    panels already there, so no panel is ever left empty. */
export function resizePanelsForLayout(state) {
  const count = LAYOUTS[state.layout].panels.length;
  const old = state.panels;
  const panels = [];
  for (let i = 0; i < count; i += 1) {
    if (old[i]) {
      panels.push(old[i]);
    } else {
      const donor = old[i % old.length];
      panels.push(blankPanel(donor ? { name: donor.photoName, img: donor.photo } : null));
    }
  }
  state.panels = panels;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

/** Puts a photo into one panel, keeping that panel's crop. */
export function assignPhotoToPanel(state, panelIndex, photo) {
  const panel = state.panels[panelIndex];
  if (!panel) return;
  panel.photo = photo.img;
  panel.photoName = photo.name;
}

/** Fills every panel with the same photo, keeping each panel's crop. */
export function fillAllPanels(state, photo) {
  state.panels.forEach((panel) => {
    panel.photo = photo.img;
    panel.photoName = photo.name;
  });
}
