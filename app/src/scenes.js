// Neon Coast Cover Studio — procedural scenes.
// Every scene is drawn from code alone, with a seeded random generator, so the
// same scene always renders the same pixels. No photos, no outside art: the
// palm trees, streets, skylines and piers below are all original vector work.

/** A tiny deterministic random generator (mulberry32). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The scenes the app can paint: id, label and a stable seed. */
export const SCENES = [
  { id: 'beach', name: 'Sunset Beach', seed: 11 },
  { id: 'boulevard', name: 'Palm Boulevard', seed: 23 },
  { id: 'neon', name: 'Neon Street', seed: 37 },
  { id: 'skyline', name: 'City Skyline', seed: 41 },
  { id: 'pier', name: 'Wooden Pier', seed: 53 },
  { id: 'marina', name: 'Marina Dusk', seed: 67 },
];

export function sceneById(id) {
  return SCENES.find((s) => s.id === id) || SCENES[0];
}

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, color, glow) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.4);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function cloudPuff(ctx, rng, w, h, yBase, color) {
  ctx.fillStyle = color;
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const cx = rng() * w;
    const cy = yBase + rng() * h * 0.06;
    const r = h * (0.03 + rng() * 0.05);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.8, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function palmTree(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -60, -6, -120);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI / 7) * i - Math.PI * 0.15;
    const len = 52 + ((i * 37) % 20);
    ctx.beginPath();
    ctx.moveTo(-6, -120);
    ctx.quadraticCurveTo(
      -6 + Math.cos(a) * len * 0.6,
      -120 + Math.sin(a) * len * 0.6 - 14,
      -6 + Math.cos(a) * len,
      -120 + Math.sin(a) * len + 18,
    );
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(2, -118, 7, 0, Math.PI * 2);
  ctx.arc(-12, -112, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function buildingRow(ctx, rng, w, h, baseY, topMin, topMax, color, litColor) {
  let x = -10;
  while (x < w + 10) {
    const bw = w * (0.05 + rng() * 0.09);
    const bh = h * (topMin + rng() * (topMax - topMin));
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - bh, bw, bh);
    ctx.fillStyle = litColor;
    const cols = Math.max(1, Math.floor(bw / (w * 0.018)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.045)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rng() < 0.42) {
          ctx.fillRect(x + 4 + c * (w * 0.018), baseY - bh + 6 + r * (h * 0.045), w * 0.009, h * 0.02);
        }
      }
    }
    x += bw + 2;
  }
}

function seaBand(ctx, w, y, h, topColor, bottomColor) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, y, w, h);
}

function sunGlitter(ctx, rng, w, y, h, cx, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 60; i++) {
    const spread = (1 - i / 60) * w * 0.16 + 6;
    const gx = cx + (rng() - 0.5) * spread * 2;
    const gy = y + rng() * h;
    const gw = 4 + rng() * 26;
    ctx.globalAlpha = 0.12 + rng() * 0.35;
    ctx.fillRect(gx - gw / 2, gy, gw, 2.5);
  }
  ctx.globalAlpha = 1;
}

function gulls(ctx, rng, w, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, h * 0.003);
  for (let i = 0; i < 5; i++) {
    const x = rng() * w;
    const y = h * (0.06 + rng() * 0.16);
    const s = h * (0.012 + rng() * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

function drawBeach(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#2b1055'], [0.45, '#e85d75'], [0.62, '#ff9a5a'], [0.75, '#ffc46b'], [1, '#ffdf9e']]);
  sunDisc(ctx, w * 0.62, h * 0.52, h * 0.11, '#fff3c4', 'rgba(255,170,80,0.55)');
  cloudPuff(ctx, rng, w, h, h * 0.12, 'rgba(255,190,170,0.5)');
  cloudPuff(ctx, rng, w, h, h * 0.24, 'rgba(255,150,140,0.4)');
  seaBand(ctx, w, h * 0.58, h * 0.2, '#e8706e', '#7a2d6e');
  sunGlitter(ctx, rng, w, h * 0.58, h * 0.2, w * 0.62, '#ffd9a0');
  const sand = ctx.createLinearGradient(0, h * 0.78, 0, h);
  sand.addColorStop(0, '#e8b06a');
  sand.addColorStop(1, '#8a5a34');
  ctx.fillStyle = sand;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.strokeStyle = 'rgba(255,230,190,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (0.8 + i * 0.045));
    ctx.bezierCurveTo(w * 0.3, h * (0.79 + i * 0.045), w * 0.7, h * (0.82 + i * 0.045), w, h * (0.8 + i * 0.045));
    ctx.stroke();
  }
  palmTree(ctx, w * 0.12, h * 0.86, h * 0.0016, -0.08, '#3a1c40');
  palmTree(ctx, w * 0.88, h * 0.9, h * 0.0019, 0.1, '#2c1430');
  palmTree(ctx, w * 0.06, h * 0.98, h * 0.0012, -0.14, '#3a1c40');
  gulls(ctx, rng, w, h, 'rgba(60,20,60,0.8)');
}

function drawBoulevard(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#1d2b64'], [0.4, '#c94b7c'], [0.6, '#ff8c5a'], [0.75, '#ffb36b'], [1, '#ffd98a']]);
  sunDisc(ctx, w * 0.5, h * 0.55, h * 0.09, '#fff0b8', 'rgba(255,160,70,0.5)');
  cloudPuff(ctx, rng, w, h, h * 0.1, 'rgba(255,180,160,0.45)');
  buildingRow(ctx, rng, w, h, h * 0.72, 0.1, 0.3, '#241a3a', '#ffd28a');
  ctx.fillStyle = '#1a1230';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.fillStyle = '#3d2c56';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h);
  ctx.lineTo(w * 0.48, h * 0.72);
  ctx.lineTo(w * 0.52, h * 0.72);
  ctx.lineTo(w * 0.58, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffcf5e';
  for (let i = 0; i < 6; i++) {
    const y = h * (0.74 + i * 0.045);
    const s = 2 + i * 1.6;
    ctx.fillRect(w * 0.5 - s / 2, y, s, h * 0.012);
  }
  palmTree(ctx, w * 0.3, h * 0.78, h * 0.0013, -0.06, '#120a24');
  palmTree(ctx, w * 0.68, h * 0.76, h * 0.0012, 0.07, '#120a24');
  palmTree(ctx, w * 0.1, h * 0.82, h * 0.001, -0.1, '#120a24');
  palmTree(ctx, w * 0.92, h * 0.8, h * 0.0011, 0.09, '#120a24');
  ctx.fillStyle = '#0e0820';
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.86);
  ctx.lineTo(w * 0.4, h * 0.86);
  ctx.lineTo(w * 0.42, h * 0.8);
  ctx.lineTo(w * 0.38, h * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5e7a';
  ctx.fillRect(w * 0.365, h * 0.845, w * 0.03, h * 0.012);
}

function drawNeon(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#070312'], [0.55, '#150a33'], [0.8, '#2a0f45'], [1, '#3d1157']]);
  ctx.fillStyle = '#ffd7ef';
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.3 + rng() * 0.7;
    ctx.fillRect(rng() * w, rng() * h * 0.3, 2, 2);
  }
  ctx.globalAlpha = 1;
  buildingRow(ctx, rng, w, h, h * 0.66, 0.18, 0.5, '#0d0618', '#ff9de2');
  const signs = [
    { x: 0.06, y: 0.2, w: 0.2, h: 0.09, c: '#ff2e88', t: 'VICE' },
    { x: 0.68, y: 0.14, w: 0.24, h: 0.08, c: '#00e5ff', t: 'NEON' },
    { x: 0.4, y: 0.3, w: 0.16, h: 0.07, c: '#ffe14d', t: 'BAR' },
  ];
  for (const s of signs) {
    ctx.save();
    ctx.shadowColor = s.c;
    ctx.shadowBlur = h * 0.03;
    ctx.fillStyle = s.c;
    ctx.fillRect(w * s.x, h * s.y, w * s.w, h * s.h);
    ctx.fillStyle = '#14041f';
    ctx.font = `bold ${Math.round(h * s.h * 0.62)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.t, w * (s.x + s.w / 2), h * (s.y + s.h / 2));
    ctx.restore();
  }
  const wet = ctx.createLinearGradient(0, h * 0.66, 0, h);
  wet.addColorStop(0, '#241040');
  wet.addColorStop(1, '#0a0518');
  ctx.fillStyle = wet;
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.globalAlpha = 0.35;
  for (const s of signs) {
    const g = ctx.createLinearGradient(0, h * 0.66, 0, h);
    g.addColorStop(0, s.c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w * s.x, h * 0.66, w * s.w, h * 0.3);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 24; i++) {
    ctx.fillRect(rng() * w, h * (0.68 + rng() * 0.28), 2 + rng() * 14, 1.5);
  }
}

function drawSkyline(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#0f1e4a'], [0.42, '#7a4a8f'], [0.62, '#ff7e5f'], [0.78, '#feb47b'], [1, '#ffe29a']]);
  sunDisc(ctx, w * 0.3, h * 0.6, h * 0.08, '#fff2c0', 'rgba(255,170,90,0.5)');
  cloudPuff(ctx, rng, w, h, h * 0.14, 'rgba(255,170,150,0.4)');
  buildingRow(ctx, rng, w, h, h * 0.82, 0.14, 0.42, '#1c1430', '#ffca7a');
  buildingRow(ctx, rng, w, h, h * 0.86, 0.2, 0.55, '#120c22', '#ffe9a8');
  const water = ctx.createLinearGradient(0, h * 0.86, 0, h);
  water.addColorStop(0, '#5a3a6e');
  water.addColorStop(1, '#1a1030');
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  sunGlitter(ctx, rng, w, h * 0.86, h * 0.13, w * 0.3, '#ffcf8a');
  gulls(ctx, rng, w, h, 'rgba(40,16,50,0.8)');
}

function drawPier(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#7ec8e3'], [0.45, '#aee3ef'], [0.62, '#ffe3a3'], [0.75, '#ffd27e'], [1, '#ffc46b']]);
  sunDisc(ctx, w * 0.72, h * 0.5, h * 0.09, '#fff8d8', 'rgba(255,210,110,0.5)');
  cloudPuff(ctx, rng, w, h, h * 0.1, 'rgba(255,255,255,0.7)');
  seaBand(ctx, w, h * 0.55, h * 0.45, '#2fb3a8', '#0d6f8f');
  sunGlitter(ctx, rng, w, h * 0.55, h * 0.42, w * 0.72, '#ffe9b0');
  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h);
  ctx.lineTo(w * 0.485, h * 0.55);
  ctx.lineTo(w * 0.515, h * 0.55);
  ctx.lineTo(w * 0.56, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5d3d22';
  for (let i = 0; i < 9; i++) {
    const y = h * (0.56 + i * 0.05);
    ctx.fillRect(w * (0.478 - i * 0.004), y, w * (0.044 + i * 0.008), 2.5);
  }
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(w * 0.47, h * 0.55, w * 0.06, h * 0.02);
  ctx.strokeStyle = '#2c1a0c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.55);
  ctx.lineTo(w * 0.5, h * 0.34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.34);
  ctx.quadraticCurveTo(w * 0.62, h * 0.4, w * 0.66, h * 0.56);
  ctx.stroke();
  ctx.fillStyle = '#2c1a0c';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.52, h * 0.012, 0, Math.PI * 2);
  ctx.fill();
  palmTree(ctx, w * 0.1, h * 0.62, h * 0.0011, -0.1, '#1d4028');
  palmTree(ctx, w * 0.92, h * 0.6, h * 0.0013, 0.08, '#1d4028');
  gulls(ctx, rng, w, h, 'rgba(30,60,80,0.8)');
}

function drawMarina(ctx, w, h, rng) {
  skyGradient(ctx, w, h, [[0, '#241040'], [0.4, '#8e3b7a'], [0.6, '#ff6b6b'], [0.75, '#ffa26b'], [1, '#ffd194']]);
  sunDisc(ctx, w * 0.5, h * 0.58, h * 0.1, '#fff3c4', 'rgba(255,150,80,0.5)');
  seaBand(ctx, w, h * 0.62, h * 0.38, '#c65a7d', '#3a1c50');
  sunGlitter(ctx, rng, w, h * 0.62, h * 0.36, w * 0.5, '#ffc49a');
  for (let i = 0; i < 4; i++) {
    const bx = w * (0.12 + i * 0.22);
    const by = h * (0.66 + (i % 2) * 0.06);
    const s = h * (0.05 + ((i * 13) % 10) * 0.002);
    ctx.fillStyle = '#160a26';
    ctx.beginPath();
    ctx.moveTo(bx - s * 1.6, by);
    ctx.lineTo(bx + s * 1.6, by);
    ctx.lineTo(bx + s * 1.1, by + s * 0.5);
    ctx.lineTo(bx - s * 1.1, by + s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx, by - s * 1.4);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + s * 0.9, by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(bx - s * 0.3, by - s * 0.2, s * 0.2, s * 0.15);
  }
  buildingRow(ctx, rng, w, h, h * 0.62, 0.06, 0.16, '#1a0e30', '#ffd28a');
  palmTree(ctx, w * 0.06, h * 0.64, h * 0.0012, -0.08, '#120a24');
  palmTree(ctx, w * 0.94, h * 0.63, h * 0.0013, 0.09, '#120a24');
}

/** Paint one procedural scene into the current clip of ctx, sized w by h. */
export function drawScene(ctx, sceneId, w, h) {
  const scene = sceneById(sceneId);
  const rng = seededRandom(scene.seed * 7919 + Math.round(w) * 13 + Math.round(h) * 7);
  ctx.save();
  if (sceneId === 'beach') drawBeach(ctx, w, h, rng);
  else if (sceneId === 'boulevard') drawBoulevard(ctx, w, h, rng);
  else if (sceneId === 'neon') drawNeon(ctx, w, h, rng);
  else if (sceneId === 'skyline') drawSkyline(ctx, w, h, rng);
  else if (sceneId === 'pier') drawPier(ctx, w, h, rng);
  else drawMarina(ctx, w, h, rng);
  ctx.restore();
}
