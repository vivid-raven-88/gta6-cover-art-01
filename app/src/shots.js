// Neon Coast Cover Studio — screenshot shot modes.
// The maker takes screenshots through URL parameters, so every screenshot is
// a real render of the app's own code: ?shot=cover renders one exported
// cover full-frame, ?shot=editor opens the editor with a photo loaded, and
// ?shot=scene paints a single procedural scene (used to make the sample photos).

/** Read the shot parameters from the page URL. */
export function shotParams() {
  const q = new URLSearchParams(window.location.search);
  return {
    shot: q.get('shot') || '',
    scene: q.get('scene') || 'beach',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    size: q.get('size') || '',
    title: q.get('title') || '',
    subtitle: q.get('subtitle') || '',
    stars: q.get('stars') || '',
  };
}

/** Apply shot parameters to a fresh editor state. Returns the mode. */
export function applyShotParams(state, params) {
  if (params.layout) state.layout = params.layout;
  if (params.grade) state.grade = params.grade;
  if (params.title) state.title = params.title;
  if (params.subtitle) state.subtitle = params.subtitle;
  if (params.stars !== '') state.stars = Math.max(0, Math.min(5, parseInt(params.stars, 10) || 0));
  if (params.shot === 'cover' || params.shot === 'scene') {
    // A cover shot uses the chosen scene in the hero panel and cycles the
    // other scenes through the rest, so no scene repeats next to itself.
    const others = ['boulevard', 'neon', 'pier', 'skyline', 'marina', 'beach'].filter((s) => s !== params.scene);
    state.panels = state.panels.map((p, i) => ({
      ...p,
      photo: -1,
      scene: i === 0 ? params.scene : others[(i - 1) % others.length],
    }));
  }
  return params.shot;
}

/** The pixel size of a shot=cover render, from the size parameter. */
export function shotSize(params) {
  const [w, h] = (params.size || '1080x1080').split('x').map((n) => parseInt(n, 10));
  if (!w || !h) return { w: 1080, h: 1080 };
  return { w, h };
}

/** Tell the screenshot driver the frame is fully painted. */
export function markReady() {
  window.__neonCoastReady = true;
  document.documentElement.setAttribute('data-ready', 'true');
}
