// PNG export: renders the cover off-screen at an exact post size and saves it
// as a download. The preview is never exported — the pixels come from the
// same drawCover the preview uses, at the requested size.
import { drawCover } from './cover.js';

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, file: 'vice-cover-1080x1080.png' },
  portrait: { w: 1080, h: 1350, file: 'vice-cover-1080x1350.png' },
  wide: { w: 1920, h: 1080, file: 'vice-cover-1920x1080.png' },
};

/** Renders the cover at width x height and returns the PNG blob. */
export function renderCoverBlob(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const still = { ...state, selectedPanel: null, showSelection: false };
  drawCover(ctx, w, h, still);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('could not encode the PNG'));
    }, 'image/png');
  });
}

/** Renders and downloads the cover at one of the EXPORT_SIZES keys. */
export async function exportCover(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey];
  if (!size) throw new Error(`unknown export size ${sizeKey}`);
  const blob = await renderCoverBlob(state, size.w, size.h);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = size.file;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { file: size.file, w: size.w, h: size.h, bytes: blob.size };
}
