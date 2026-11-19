// Neon Coast Cover Studio — editor.
// Owns the editor state, the photo library, undo/redo, crop controls and
// exports. The preview canvas always shows exactly what an export will be.

import { GRADES, LAYOUTS, defaultState, coverPanels, renderCover, renderExport, EXPORT_SIZES, layoutById } from './cover.js';
import { SCENES, drawScene } from './scenes.js';
import { shotParams, applyShotParams, shotSize, markReady } from './shots.js';

const SAMPLE_PHOTOS = [
  { name: 'Boulevard sample', src: 'samples/boulevard.jpg' },
  { name: 'Pier sample', src: 'samples/pier.jpg' },
];

const state = defaultState();
/** Loaded photos: { name, src, img } in library order. */
const photos = [];
let selectedPanel = 0;
let dragging = null;
const history = [];
let historyIndex = -1;

const $ = (id) => document.getElementById(id);

function snapshotState() {
  return JSON.stringify({ ...state, panels: state.panels.map((p) => ({ ...p })) });
}

function pushHistory() {
  history.length = historyIndex + 1;
  history.push(snapshotState());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}

function applySnapshot(json) {
  const saved = JSON.parse(json);
  for (const key of Object.keys(saved)) state[key] = saved[key];
  syncControls();
  renderPreview();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  applySnapshot(history[historyIndex]);
  updateUndoRedo();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  applySnapshot(history[historyIndex]);
  updateUndoRedo();
}

function updateUndoRedo() {
  $('undoBtn').disabled = historyIndex <= 0;
  $('redoBtn').disabled = historyIndex >= history.length - 1;
}

function photoImages() {
  return photos.map((p) => p.img);
}

function renderPreview() {
  const canvas = $('preview');
  const layout = layoutById(state.layout);
  const wide = state.layout === 'duo' || layout.titleAt === 'center';
  canvas.width = wide ? 1080 : 1080;
  canvas.height = wide ? 1080 : 1350;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, canvas.width, canvas.height, state, photoImages());
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${coverPanels(state).length} — ${layout.name}`;
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  document.querySelectorAll('[data-star]').forEach((b) => b.classList.toggle('lit', Number(b.dataset.star) <= state.stars));
  $('starCount').textContent = `${state.stars} / 5`;
  const panel = state.panels[selectedPanel] || { photo: -1, scene: 'beach', ox: 0.5, oy: 0.5, zoom: 1 };
  $('zoomRange').value = panel.zoom;
  $('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('offsetX').value = panel.ox;
  $('offsetY').value = panel.oy;
  renderFillChoices();
  renderPhotoSlots();
}

function renderFillChoices() {
  const box = $('fillChoices');
  box.innerHTML = '';
  const panel = state.panels[selectedPanel];
  for (const scene of SCENES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (panel.photo < 0 && panel.scene === scene.id ? ' active' : '');
    b.textContent = scene.name;
    b.addEventListener('click', () => {
      panel.photo = -1;
      panel.scene = scene.id;
      pushHistory();
      renderPreview();
      syncControls();
    });
    box.appendChild(b);
  }
  photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (panel.photo === i ? ' active' : '');
    b.textContent = `Photo ${i + 1}`;
    b.addEventListener('click', () => {
      panel.photo = i;
      pushHistory();
      renderPreview();
      syncControls();
    });
    box.appendChild(b);
  });
}

function renderPhotoSlots() {
  const box = $('photoSlots');
  box.innerHTML = '';
  photos.forEach((photo, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'slot';
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.name;
    slot.appendChild(img);
    const label = document.createElement('span');
    label.textContent = photo.name;
    slot.appendChild(label);
    slot.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      pushHistory();
      renderPreview();
      syncControls();
    });
    box.appendChild(slot);
  });
  const count = document.createElement('p');
  count.className = 'hint';
  count.textContent = `${photos.length} of 8 photos loaded. Photos stay on this machine.`;
  box.appendChild(count);
}

function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ name: file.name, src: String(reader.result), img });
      img.onerror = () => reject(new Error(`Could not read ${file.name} as an image`));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function loadSamplePhotos() {
  const jobs = SAMPLE_PHOTOS.map((sample) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ name: sample.name, src: sample.src, img });
    img.onerror = () => resolve(null);
    img.src = sample.src;
  }));
  return Promise.all(jobs).then((loaded) => loaded.filter(Boolean));
}

function exportCover(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = renderExport(state, photoImages(), size.id);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('exportNote').textContent = `Exported ${size.label} PNG.`;
  }, 'image/png');
}

function buildToolbar() {
  const layoutBox = $('layoutPicker');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = layout.id;
    b.textContent = layout.name;
    b.addEventListener('click', () => {
      state.layout = layout.id;
      selectedPanel = 0;
      pushHistory();
      renderPreview();
      syncControls();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = $('gradePicker');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.grade = grade.id;
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      state.grade = grade.id;
      pushHistory();
      renderPreview();
      syncControls();
    });
    gradeBox.appendChild(b);
  }
  const exportBox = $('exportPicker');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = size.label;
    b.addEventListener('click', () => exportCover(size.id));
    exportBox.appendChild(b);
  }
}

function bindControls() {
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
  });
  $('titleInput').addEventListener('change', pushHistory);
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  $('subtitleInput').addEventListener('change', pushHistory);
  $('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value;
    renderPreview();
  });
  $('badgeInput').addEventListener('change', pushHistory);
  $('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    pushHistory();
    renderPreview();
  });
  $('vignetteToggle').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    pushHistory();
    renderPreview();
  });
  document.querySelectorAll('[data-star]').forEach((b) => {
    b.addEventListener('click', () => {
      state.stars = Number(b.dataset.star);
      pushHistory();
      renderPreview();
      syncControls();
    });
  });
  $('zoomRange').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    $('zoomValue').textContent = `${Math.round(Number(e.target.value) * 100)}%`;
    renderPreview();
  });
  $('zoomRange').addEventListener('change', pushHistory);
  $('offsetX').addEventListener('input', (e) => {
    state.panels[selectedPanel].ox = Number(e.target.value);
    renderPreview();
  });
  $('offsetX').addEventListener('change', pushHistory);
  $('offsetY').addEventListener('input', (e) => {
    state.panels[selectedPanel].oy = Number(e.target.value);
    renderPreview();
  });
  $('offsetY').addEventListener('change', pushHistory);
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('uploadInput').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 8 - photos.length);
    for (const file of files) {
      try {
        photos.push(await loadPhotoFile(file));
      } catch (err) {
        $('exportNote').textContent = err.message;
      }
    }
    e.target.value = '';
    pushHistory();
    renderPreview();
    syncControls();
  });
  $('sampleBtn').addEventListener('click', async () => {
    const loaded = await loadSamplePhotos();
    for (const photo of loaded) {
      if (photos.length < 8 && !photos.some((p) => p.name === photo.name)) photos.push(photo);
    }
    if (photos.length > 0) state.panels[0].photo = 0;
    pushHistory();
    renderPreview();
    syncControls();
  });
  const canvas = $('preview');
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const panels = coverPanels(state);
    const hit = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
      canvas.setPointerCapture(e.pointerId);
      syncControls();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const panel = state.panels[selectedPanel];
    panel.ox = Math.max(0, Math.min(1, dragging.ox + (x - dragging.x)));
    panel.oy = Math.max(0, Math.min(1, dragging.oy + (y - dragging.y)));
    $('offsetX').value = panel.ox;
    $('offsetY').value = panel.oy;
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) {
      dragging = null;
      pushHistory();
    }
  });
}

async function bootEditor() {
  buildToolbar();
  bindControls();
  pushHistory();
  syncControls();
  renderPreview();
  await document.fonts.ready;
  renderPreview();
}

async function bootShot(params) {
  const mode = applyShotParams(state, params);
  if (mode === 'scene' || mode === 'cover') document.body.classList.add('shot-mode');
  if (mode === 'scene') {
    // Paint one procedural scene edge to edge; used to make sample photos.
    const { w, h } = shotSize(params);
    const canvas = $('preview');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawScene(ctx, params.scene, w, h);
    document.body.classList.add('scene-only');
    markReady();
    return;
  }
  if (mode === 'cover') {
    const { w, h } = shotSize(params);
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
    const canvas = $('preview');
    canvas.width = w;
    canvas.height = h;
    renderCover(canvas.getContext('2d'), w, h, state, photoImages());
    document.body.classList.add('cover-only');
    markReady();
    return;
  }
  // Editor shot: open the editor with a sample photo loaded in the hero panel.
  const loaded = await loadSamplePhotos();
  for (const photo of loaded) photos.push(photo);
  if (photos.length > 0) state.panels[0].photo = 0;
  await bootEditor();
  markReady();
}

async function boot() {
  const params = shotParams();
  if (params.shot) {
    await bootShot(params);
    return;
  }
  await bootEditor();
}

boot();
