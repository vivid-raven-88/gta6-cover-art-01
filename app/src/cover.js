// Neon Coast Cover Studio — cover rendering engine.
// Layouts, colour grades, lettering, grain and vignette. Everything is drawn
// on a 2D canvas so the exported PNG is exactly what the preview shows.

import { drawScene, SCENES } from './scenes.js';

/** The five colour grades. Each lists wash colours painted over the cover. */
export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', washes: [['overlay', '#ff7a3c', 0.22], ['soft-light', '#ff2e88', 0.25], ['screen', '#ffd27e', 0.1]] },
  { id: 'neon', name: 'Neon Vice', washes: [['overlay', '#ff2e88', 0.3], ['soft-light', '#00e5ff', 0.28], ['multiply', '#1a0b2e', 0.12]] },
  { id: 'golden', name: 'Golden Hour', washes: [['soft-light', '#ffb347', 0.35], ['screen', '#fff1b8', 0.14], ['multiply', '#7a4a12', 0.08]] },
  { id: 'dusk', name: 'Dusk Purple', washes: [['overlay', '#7b2ff7', 0.26], ['soft-light', '#ff6b9d', 0.2], ['multiply', '#241040', 0.14]] },
  { id: 'noir', name: 'Noir Teal', washes: [['overlay', '#0affef', 0.16], ['multiply', '#062a33', 0.28], ['soft-light', '#ffffff', 0.08]] },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

/**
 * The six multi-panel layouts. Each returns panels as fractions of the cover
 * (x, y, w, h, plus an optional tilt in radians) plus where the title sits.
 */
export const LAYOUTS = [
  {
    id: 'hero3', name: 'Hero + Three',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.96, h: 0.6 },
      { x: 0.02, y: 0.64, w: 0.31, h: 0.34 },
      { x: 0.345, y: 0.64, w: 0.31, h: 0.34 },
      { x: 0.67, y: 0.64, w: 0.31, h: 0.34 },
    ],
    titleAt: 'bottom',
  },
  {
    id: 'grid4', name: 'Four Grid',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.475, h: 0.47 },
      { x: 0.505, y: 0.02, w: 0.475, h: 0.47 },
      { x: 0.02, y: 0.51, w: 0.475, h: 0.47 },
      { x: 0.505, y: 0.51, w: 0.475, h: 0.47 },
    ],
    titleAt: 'center',
  },
  {
    id: 'fullbleed', name: 'Full Bleed',
    panels: () => [{ x: 0, y: 0, w: 1, h: 1 }],
    titleAt: 'bottom',
  },
  {
    id: 'tilted', name: 'Tilted Stack',
    panels: () => [
      { x: 0.06, y: 0.04, w: 0.56, h: 0.6, rot: -0.05 },
      { x: 0.4, y: 0.34, w: 0.54, h: 0.56, rot: 0.045 },
      { x: 0.1, y: 0.62, w: 0.42, h: 0.32, rot: -0.03 },
    ],
    titleAt: 'top',
  },
  {
    id: 'nine', name: 'Nine Panel',
    panels: () => {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({ x: 0.015 + c * 0.328, y: 0.015 + r * 0.328, w: 0.318, h: 0.318 });
        }
      }
      return out;
    },
    titleAt: 'center',
  },
  {
    id: 'duo', name: 'Split Duo',
    panels: () => [
      { x: 0.02, y: 0.02, w: 0.475, h: 0.96 },
      { x: 0.505, y: 0.02, w: 0.475, h: 0.96 },
    ],
    titleAt: 'center',
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/** A fresh default state for a new cover. */
export function defaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    title: 'NEON COAST',
    subtitle: 'a Vice City story',
    badge: 'VICE CITY',
    stars: 4,
    grain: true,
    vignette: true,
    panels: [
      { photo: -1, scene: 'beach', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'boulevard', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'neon', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'pier', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'skyline', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'marina', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'beach', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'neon', ox: 0.5, oy: 0.5, zoom: 1 },
      { photo: -1, scene: 'boulevard', ox: 0.5, oy: 0.5, zoom: 1 },
    ],
  };
}

/** Panels for the current layout, padded with the state's panel settings. */
export function coverPanels(state) {
  const layout = layoutById(state.layout);
  const rects = layout.panels();
  return rects.map((rect, i) => ({ ...rect, ...(state.panels[i] || { photo: -1, scene: 'beach', ox: 0.5, oy: 0.5, zoom: 1 }) }));
}

function drawPhotoCover(ctx, img, x, y, w, h, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const base = Math.max(w / iw, h / ih) * (crop.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = x + w / 2 - dw * (crop.ox ?? 0.5);
  const dy = y + h / 2 - dh * (crop.oy ?? 0.5);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(ctx, w, h, gradeId) {
  const grade = gradeById(gradeId);
  for (const [mode, color, alpha] of grade.washes) {
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

function drawGrain(ctx, w, h, seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  ctx.save();
  const n = Math.floor((w * h) / 900);
  for (let i = 0; i < n; i++) {
    const v = next();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(next() * w, next() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,4,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, w, h, state, where) {
  const title = (state.title || 'UNTITLED').toUpperCase();
  const sub = state.subtitle || '';
  const pad = w * 0.03;
  let ty;
  if (where === 'top') ty = h * 0.14;
  else if (where === 'center') ty = h * 0.44;
  else ty = h * 0.8;
  // Title with a sunset gradient fill and a dark outline.
  const size = fitFont(ctx, title, w - pad * 2, Math.round(w * 0.115), 'Anton, "Arial Black", sans-serif', '');
  const grad = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.25);
  grad.addColorStop(0, '#fff7ae');
  grad.addColorStop(0.45, '#ffb347');
  grad.addColorStop(0.75, '#ff5e7a');
  grad.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,4,24,0.9)';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(title, w / 2, ty);
  ctx.fillStyle = grad;
  ctx.fillText(title, w / 2, ty);
  ctx.restore();
  if (sub) {
    const subSize = Math.round(w * 0.038);
    ctx.save();
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,46,136,0.9)';
    ctx.shadowBlur = size * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, w / 2, ty + size * 0.62);
    ctx.restore();
  }
  return ty;
}

function drawBadge(ctx, w, h, state) {
  const label = state.badge || 'VICE CITY';
  const px = Math.round(w * 0.028);
  ctx.save();
  ctx.font = `${px}px Anton, "Arial Black", sans-serif`;
  const tw = ctx.measureText(label).width;
  const bw = tw + px * 1.4;
  const bh = px * 1.9;
  const x = w * 0.03;
  const y = h * 0.03;
  ctx.fillStyle = 'rgba(16,4,24,0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = Math.max(2, px * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + bw / 2, y + bh / 2 + 1);
  ctx.restore();
}

function drawStars(ctx, w, h, state) {
  const n = Math.max(0, Math.min(5, state.stars || 0));
  const r = w * 0.02;
  const gap = r * 2.4;
  const total = gap * 5;
  const x0 = w - total - w * 0.03;
  const y = h * 0.055;
  for (let i = 0; i < 5; i++) {
    const cx = x0 + i * gap + r;
    ctx.save();
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? r : r * 0.45;
      const px = cx + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < n ? '#ffd94d' : 'rgba(255,255,255,0.25)';
    ctx.strokeStyle = 'rgba(16,4,24,0.85)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Render the whole cover into ctx at w by h pixels.
 * state: the editor state; photos: array of loaded Image elements.
 */
export function renderCover(ctx, w, h, state, photos) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  const panels = coverPanels(state);
  for (const panel of panels) {
    const px = panel.x * w;
    const py = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;
    ctx.save();
    ctx.beginPath();
    if (panel.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-pw / 2, -ph / 2);
      ctx.rect(0, 0, pw, ph);
    } else {
      ctx.rect(px, py, pw, ph);
    }
    ctx.clip();
    if (panel.photo >= 0 && photos[panel.photo]) {
      const ox = panel.rot ? 0 : px;
      const oy = panel.rot ? 0 : py;
      drawPhotoCover(ctx, photos[panel.photo], ox, oy, pw, ph, panel);
    } else {
      ctx.save();
      if (panel.rot) ctx.translate(0, 0);
      else ctx.translate(px, py);
      drawScene(ctx, panel.scene || 'beach', pw, ph);
      ctx.restore();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(2, pw * 0.008);
    ctx.beginPath();
    if (panel.rot) {
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(panel.rot);
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
    } else {
      ctx.strokeRect(px, py, pw, ph);
    }
    ctx.restore();
  }
  applyGrade(ctx, w, h, state.grade);
  const layout = layoutById(state.layout);
  drawTitleBlock(ctx, w, h, state, layout.titleAt);
  drawBadge(ctx, w, h, state);
  drawStars(ctx, w, h, state);
  if (state.grain) drawGrain(ctx, w, h, 1234567);
  if (state.vignette) drawVignette(ctx, w, h);
  ctx.restore();
}

/** The four export sizes, in pixels. */
export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1920', label: 'Story 1080 × 1920', w: 1080, h: 1920 },
];

/** Render the cover at an export size and return the canvas. */
export function renderExport(state, photos, sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state, photos);
  return canvas;
}

export { SCENES };
