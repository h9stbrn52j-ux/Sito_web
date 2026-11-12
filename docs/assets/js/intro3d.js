/* Cinepresa 3D dell'intro: modello costruito in codice (nessun marchio), obiettivo con iride a 9 lamelle.
   Caricato solo alla prima visita della home, da main.js. */
import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const LENS_Z = 0.575;   // faccia frontale del corpo
const GLASS_Z = 0.715;  // profondità del vetro dentro l'obiettivo (dal attacco)
const GLASS_R = 0.335;  // raggio del vetro
const LENS_X = 0.02, LENS_Y = -0.03;

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export async function createCamera(canvas, { covers = [], onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-3, 4, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb3ff, 3.2); rim.position.set(4, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xf1e9d6, 0.6); fill.position.set(2, -1, 5); scene.add(fill);

  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 60);

  // ---------- materiali ----------
  const body = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.58, metalness: 0.35 });
  const bodyDark = new THREE.MeshStandardMaterial({ color: 0x121316, roughness: 0.7, metalness: 0.2 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.92, metalness: 0.05 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.28, metalness: 1 });
  const barrel = new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.32, metalness: 0.65 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd8382e, roughness: 0.4, metalness: 0.1, emissive: 0x3a0806 });
  const knurl = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.6, metalness: 0.4,
    map: canvasTex(512, 32, (g, w, h) => { g.fillStyle = '#0d0e10'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { g.fillStyle = '#26282d'; g.fillRect(x, 0, 2, h); } }),
  });
  const marks = new THREE.MeshStandardMaterial({
    roughness: 0.4, metalness: 0.5,
    map: canvasTex(1024, 64, (g, w, h) => {
      g.fillStyle = '#101113'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8e4dc'; g.font = '600 26px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      ['∞', '10', '5', '3', '2', '1.5', '1.2', '1'].forEach((t, i) => g.fillText(t, 40 + i * 62, h / 2));
      for (let x = 0; x < 520; x += 12) g.fillRect(x + 30, 6, 1.5, x % 36 === 0 ? 12 : 7);
    }),
  });
  const carbon = new THREE.MeshStandardMaterial({
    roughness: 0.45, metalness: 0.3,
    map: canvasTex(64, 64, (g, w, h) => {
      g.fillStyle = '#16171a'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) {
        g.fillStyle = (x + y) % 16 ? '#2a2c31' : '#1d1f23';
        g.fillRect(x, y, 8, 8);
      }
    }, [8, 1]),
  });

  // ---------- modello ----------
  const model = new THREE.Group();
  scene.add(model);
  const add = (geo, mat, x, y, z, parent = model) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

  add(new RoundedBoxGeometry(1.0, 0.82, 1.15, 5, 0.07), body, 0, 0, 0);
  // fascia frontale e attacco dell'obiettivo
  add(new RoundedBoxGeometry(1.02, 0.84, 0.06, 4, 0.03), bodyDark, 0, 0, 0.56);
  const mount = add(new THREE.CylinderGeometry(0.46, 0.47, 0.06, 96), body, LENS_X, LENS_Y, LENS_Z + 0.02); mount.rotation.x = Math.PI / 2;
  const mountRing = add(new THREE.TorusGeometry(0.455, 0.008, 12, 96), metal, LENS_X, LENS_Y, LENS_Z + 0.052);
  // viti sulla fascia frontale
  [[-0.42, 0.34], [0.42, 0.34], [-0.42, -0.34], [0.42, -0.34]].forEach(([x, y]) => { const s = add(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16), metal, x, y, 0.595); s.rotation.x = Math.PI / 2; });
  // impugnatura a sinistra
  add(new RoundedBoxGeometry(0.26, 0.78, 0.5, 5, 0.1), rubber, -0.6, -0.01, 0.26);
  // monitor sul lato destro
  add(new RoundedBoxGeometry(0.04, 0.5, 0.74, 3, 0.015), bodyDark, 0.515, 0.08, -0.06);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const screen = add(new THREE.PlaneGeometry(0.64, 0.4), screenMat, 0.537, 0.08, -0.06); screen.rotation.y = Math.PI / 2;
  const glare = add(new THREE.PlaneGeometry(0.64, 0.4), new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    map: canvasTex(256, 160, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  }), 0.538, 0.08, -0.06); glare.rotation.y = Math.PI / 2;
  // tasti sotto il monitor
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    add(new RoundedBoxGeometry(0.03, 0.05, 0.075, 2, 0.01), c === 0 && r === 1 ? red : bodyDark, 0.52, -0.23 - r * 0.075, 0.22 - c * 0.095);
  }
  // prese d'aria sul tetto
  for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.5, 0.006, 0.02), bodyDark, 0.05, 0.412, -0.4 + i * 0.05);
  // piastra superiore, maniglia, aste
  add(new RoundedBoxGeometry(0.66, 0.08, 0.56, 3, 0.02), bodyDark, -0.02, 0.45, -0.05);
  const handlePath = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.06, 0.48, -0.36), new THREE.Vector3(-0.06, 0.76, -0.3), new THREE.Vector3(-0.06, 0.8, 0.12), new THREE.Vector3(-0.06, 0.62, 0.32), new THREE.Vector3(-0.06, 0.5, 0.34)]);
  add(new THREE.TubeGeometry(handlePath, 48, 0.045, 16), rubber, 0, 0, 0);
  [[-0.34, 0.6], [-0.34, 0.5]].forEach(([x, y]) => { const rod = add(new THREE.CylinderGeometry(0.036, 0.036, 1.3, 32), carbon, x, y, 0.32); rod.rotation.x = Math.PI / 2; });
  add(new RoundedBoxGeometry(0.14, 0.2, 0.12, 3, 0.02), bodyDark, -0.3, 0.55, 0.1);
  // mirino elettronico
  const evf = new THREE.Group(); evf.position.set(0.34, 0.74, -0.02); evf.rotation.set(0.12, -0.18, 0); model.add(evf);
  add(new RoundedBoxGeometry(0.12, 0.16, 0.14, 3, 0.02), bodyDark, -0.04, -0.12, 0.08, evf);
  const evfBody = add(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 48), body, 0, 0, 0, evf); evfBody.rotation.x = Math.PI / 2;
  const evfRed = add(new THREE.CylinderGeometry(0.122, 0.122, 0.025, 48), red, 0, 0, 0.12, evf); evfRed.rotation.x = Math.PI / 2;
  const cup = add(new THREE.CylinderGeometry(0.14, 0.17, 0.14, 48, 1, true), rubber, 0, 0, -0.27, evf); cup.rotation.x = Math.PI / 2;
  const cupBack = add(new THREE.CircleGeometry(0.135, 48), new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.2, metalness: 0.4 }), 0, 0, -0.3, evf); cupBack.rotation.y = Math.PI;
  // base e piastra a coda di rondine
  add(new RoundedBoxGeometry(0.78, 0.1, 0.96, 3, 0.02), bodyDark, 0, -0.47, 0);
  add(new RoundedBoxGeometry(0.98, 0.06, 1.2, 3, 0.02), bodyDark, 0, -0.55, 0.02);
  [0.22, -0.22].forEach((z) => { const k = add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 24), metal, 0.52, -0.47, z); k.rotation.z = Math.PI / 2; });

  // obiettivo: profilo ruotato (lathe) + anelli
  const lens = new THREE.Group(); lens.position.set(LENS_X, LENS_Y, LENS_Z); model.add(lens);
  const prof = [[0.3, 0], [0.3, 0.04], [0.36, 0.04], [0.36, 0.12], [0.385, 0.13], [0.385, 0.3], [0.4, 0.31], [0.4, 0.6], [0.43, 0.64], [0.445, 0.68], [0.445, 0.84], [0.43, 0.86], [0.36, 0.86], [0.345, 0.84], [0.338, GLASS_Z + 0.002]]
    .map(([r, z]) => new THREE.Vector2(r, z));
  const shell = add(new THREE.LatheGeometry(prof, 128), barrel, 0, 0, 0, lens); shell.rotation.x = Math.PI / 2;
  const focus = add(new THREE.CylinderGeometry(0.406, 0.406, 0.22, 128, 1, true), knurl, 0, 0, 0.46, lens); focus.rotation.x = Math.PI / 2;
  const aper = add(new THREE.CylinderGeometry(0.392, 0.392, 0.07, 128, 1, true), knurl, 0, 0, 0.2, lens); aper.rotation.x = Math.PI / 2;
  const mk = add(new THREE.CylinderGeometry(0.447, 0.447, 0.1, 128, 1, true), marks, 0, 0, 0.75, lens); mk.rotation.set(Math.PI / 2, 0, 0);
  add(new THREE.TorusGeometry(0.42, 0.005, 12, 128), metal, 0, 0, 0.861, lens);
  add(new THREE.TorusGeometry(0.385, 0.004, 12, 128), metal, 0, 0, 0.862, lens);

  // vetro: disco con l'iride (canvas) + calotta riflettente sopra
  const N = Math.min(2048, (window.devicePixelRatio || 1) > 1 ? 2048 : 1400);
  const irisCanvas = document.createElement('canvas'); irisCanvas.width = irisCanvas.height = N;
  const ig = irisCanvas.getContext('2d');
  const irisTex = new THREE.CanvasTexture(irisCanvas); irisTex.colorSpace = THREE.SRGBColorSpace; irisTex.anisotropy = 8;
  add(new THREE.CircleGeometry(GLASS_R, 128), new THREE.MeshBasicMaterial({ map: irisTex, toneMapped: false }), 0, 0, GLASS_Z, lens);
  const capR = 0.62, capA = Math.asin(GLASS_R / capR);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0c1424, roughness: 0.03, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.32, envMapIntensity: 2.4, depthWrite: false });
  const cap = add(new THREE.SphereGeometry(capR, 96, 24, 0, Math.PI * 2, 0, capA), glassMat, 0, 0, GLASS_Z + 0.03 - capR, lens); cap.rotation.x = Math.PI / 2;

  // ombra morbida
  const shadow = add(new THREE.PlaneGeometry(3, 2.2), new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false,
    map: canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(2,5,12,.7)'); gr.addColorStop(1, 'rgba(2,5,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  }), 0.2, -0.59, 0.2); shadow.rotation.x = -Math.PI / 2;

  // ---------- fotogrammi dei lavori ----------
  // si usano al massimo 6 lavori: bastano per la durata dell'intro e non appesantiscono il caricamento
  covers = covers.slice(0, 6);
  const imgs = covers.map((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; return im; });
  const texCache = new Map();
  let current = 0;
  let lastIris = -1;
  function screenTexture(i) {
    if (!texCache.has(i)) {
      const im = imgs[i];
      const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      if (im.complete && im.naturalWidth) t.needsUpdate = true;
      else im.addEventListener('load', () => { t.needsUpdate = true; lastIris = -1; });
      texCache.set(i, t);
    }
    return texCache.get(i);
  }
  function setFrame(i) {
    if (!covers.length) return;
    current = i % covers.length;
    screenMat.map = screenTexture(current); screenMat.needsUpdate = true;
    lastIris = -1;
  }
  setFrame(0);

  function drawIris(open) {
    const key = Math.round(open * 400);
    if (key === lastIris) return;
    lastIris = key;
    const c = N / 2, R = N / 2;
    ig.setTransform(1, 0, 0, 1, 0, 0);
    ig.fillStyle = '#000'; ig.fillRect(0, 0, N, N);
    // dentro l'apertura non si disegna nulla: lì main.js lascia vedere il sito vero, che sta sotto l'intro
    const r = R * 0.985 * open;
    // lamelle
    const n = 9, L = R * 3, tan = Math.tan(Math.PI / n);
    ig.translate(c, c);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + open * 0.9;
      const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
      const t0 = -r * tan - 2;
      ig.beginPath();
      ig.moveTo(r * ux + t0 * vx, r * uy + t0 * vy);
      ig.lineTo(r * ux + L * vx, r * uy + L * vy);
      ig.lineTo((r + L) * ux + L * vx, (r + L) * uy + L * vy);
      ig.lineTo((r + L) * ux + t0 * vx, (r + L) * uy + t0 * vy);
      ig.closePath();
      const gr = ig.createLinearGradient(r * ux, r * uy, (r + R) * ux, (r + R) * uy);
      gr.addColorStop(0, '#22262c'); gr.addColorStop(0.25, '#121418'); gr.addColorStop(1, '#08090b');
      ig.fillStyle = gr; ig.fill();
      ig.strokeStyle = 'rgba(160,175,195,.28)'; ig.lineWidth = N / 900; ig.stroke();
    }
    ig.setTransform(1, 0, 0, 1, 0, 0);
    // bordo scuro e piccolo riflesso interno
    const v = ig.createRadialGradient(c, c, R * 0.82, c, c, R);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.85)');
    ig.fillStyle = v; ig.fillRect(0, 0, N, N);
    irisTex.needsUpdate = true;
  }

  // ---------- inquadratura e animazione ----------
  let W = 1, H = 1;
  const target = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const lensCenter = new THREE.Vector3(LENS_X, LENS_Y, LENS_Z + GLASS_Z);
  const tanH = Math.tan(THREE.MathUtils.degToRad(15));
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
  }
  resize();

  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  let aperture = { x: 0, y: 0, r: 0 };
  let state = { open: 0 };

  function render(p, mx, my, now) {
    const a = W / H, mobile = W < 720;
    const seg = (s, e) => Math.max(0, Math.min(1, (p - s) / (e - s)));
    const t1 = ease(seg(0.2, 0.5));     // la cinepresa si gira di fronte
    const t2 = ease(seg(0.4, 0.84));    // la ripresa entra nell'obiettivo
    const open = 0.035 + ease(seg(0.6, 0.86)) * 0.965;
    state.open = open;

    model.rotation.y = (-0.82 + mx * 0.22) * (1 - t1);
    model.rotation.x = (0.06 - my * 0.06) * (1 - t1);
    model.position.y = Math.sin(now / 900) * 0.02 * (1 - t1);
    model.updateMatrixWorld();

    // inquadratura iniziale: cinepresa intera nella metà bassa; finale: il vetro riempie la finestra
    const fitH = mobile ? 2.3 / 0.42 : 2.0 / 0.56;
    const fitW = (mobile ? 2.5 : 2.8) / (mobile ? 0.9 : 0.62);
    const vh0 = Math.max(fitH, fitW / a);
    const d0 = vh0 / (2 * tanH);
    const vh1 = (2 * GLASS_R) / 1.12 / Math.max(1, a);
    const d1 = vh1 / (2 * tanH);
    const dist = d0 * Math.pow(d1 / d0, Math.pow(t2, 1.25));
    const lc = tmp.copy(lensCenter).applyMatrix4(model.matrixWorld);
    const start = tmp2.set(-0.2, (mobile ? 0.1 : 0.13) * vh0, 0); // x: centro del modello girato (l'obiettivo sporge a sinistra) // il centro dell'inquadratura sta sopra il modello: la cinepresa resta in basso
    target.lerpVectors(start, lc, t2);
    const elev = 0.12 * (1 - t2);
    cam.position.set(target.x, target.y + Math.sin(elev) * dist, target.z + Math.cos(elev) * dist);
    cam.lookAt(target);

    glassMat.opacity = 0.32 * (1 - ease(seg(0.52, 0.64))); // il riflesso del vetro sparisce prima che l'iride si apra
    drawIris(open);
    renderer.render(scene, cam);

    // posizione e raggio dell'apertura sullo schermo (serve per far apparire il sito attraverso l'iride)
    const ctr = tmp.copy(lensCenter).applyMatrix4(model.matrixWorld).project(cam);
    const edge = tmp2.set(LENS_X + GLASS_R * 0.985 * open, LENS_Y, LENS_Z + GLASS_Z).applyMatrix4(model.matrixWorld).project(cam);
    aperture.x = (ctr.x * 0.5 + 0.5) * W;
    aperture.y = (-ctr.y * 0.5 + 0.5) * H;
    aperture.r = Math.hypot((edge.x - ctr.x) * 0.5 * W, (edge.y - ctr.y) * 0.5 * H);
    return aperture;
  }

  function dispose() {
    renderer.dispose();
    pmrem.dispose();
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    texCache.forEach((t) => t.dispose());
  }

  // prima immagine pronta prima di mostrare il modello
  await new Promise((res) => {
    const im = imgs[0];
    if (!im || im.complete) return res();
    im.onload = im.onerror = res;
    setTimeout(res, 1500);
  });
  return { render, resize, setFrame, dispose, get open() { return state.open; } };
}
