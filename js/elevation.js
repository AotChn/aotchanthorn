/*---------------------------------
// INIT
---------------------------------*/
import * as THREE from 'https://esm.sh/three@0.161.0';
import { OrbitControls } from 'https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js';

/*---------------------------------
// GET ELEMENTS
---------------------------------*/
const sceneEl = document.getElementById('scene');
const decimationSelect = document.getElementById('decimation');
const exaggerationRange = document.getElementById('exaggeration');
const exaggerationVal = document.getElementById('exaggerationVal');
const paletteSelect = document.getElementById('palette');
const rebuildBtn = document.getElementById('rebuild');

/*---------------------------------
// INIT RENDER / THREEJS
---------------------------------*/
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0D1321");

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, -2000, 1200);

/*---------------------------------
// ORBIT CONTROLS 
---------------------------------*/

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 300);

controls.enablePan = true;
controls.keyPanSpeed = 50;          
controls.listenToKeyEvents(window);
controls.enableZoom = false;


// renderer.domElement.addEventListener('wheel', (event) => {
//   event.preventDefault();
//   const rotateStep = 0.02; 
//   controls.rotateUp(event.deltaY * rotateStep / 100);
// });

/*---------------------------------
// LIGHTING
---------------------------------*/

scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.85));
const dir = new THREE.DirectionalLight(0xffffff, 0.95);
dir.position.set(-1, -1, 2).multiplyScalar(1500);
scene.add(dir);

/*---------------------------------
// TERRAIN PARAMS
---------------------------------*/
let terrainMesh = null;
let demArray = null;
let demWidth = 0;
let demHeight = 0;
let demNoData = null;
let demMin = Infinity;
let demMax = -Infinity;
let extentMeters = { width: 0, height: 0 };

/*---------------------------------
// DEM HANDLING
---------------------------------*/
const DEM_URL = new URL('./assets/content/dem.tif', document.baseURI).href;

async function readDEM(url) {
  if (!window.GeoTIFF) throw new Error('GeoTIFF not loaded. Include the geotiff script in index.html before app.js.');
  console.log('Loading DEM from:', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`DEM fetch failed: ${res.status} ${res.statusText} @ ${url}`);

  const tiff = await window.GeoTIFF.fromArrayBuffer(await res.arrayBuffer());
  const image = await tiff.getImage();

  demWidth = image.getWidth();
  demHeight = image.getHeight();

  const bbox = image.getBoundingBox(); // [minX, minY, maxX, maxY] in projected meters 
  extentMeters.width  = Math.abs(bbox[2] - bbox[0]);
  extentMeters.height = Math.abs(bbox[3] - bbox[1]);

  demNoData = image.getGDALNoData();
  if (demNoData != null) demNoData = Number(demNoData);

  const raster = await image.readRasters({ interleave: true, samples: [0] });
  demArray = raster;

  // min/max excluding NoData
  demMin = Infinity; demMax = -Infinity;
  const N = demArray.length;
  for (let i = 0; i < N; i++) {
    const v = demArray[i];
    if (demNoData != null && v === demNoData) continue;
    if (!Number.isFinite(v)) continue;
    if (v < demMin) demMin = v;
    if (v > demMax) demMax = v;
  }
}

/*---------------------------------
// COLOR PROFILES
---------------------------------*/
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
// hex -> linear sRGB 0..1
function hex3(h) {
  const n = h.startsWith('#') ? h.slice(1) : h;
  const r = parseInt(n.slice(0,2),16)/255, g = parseInt(n.slice(2,4),16)/255, b = parseInt(n.slice(4,6),16)/255;
  return [r,g,b];
}

// “terrain” (foresty lowlands → tan → granite → white)
const TERRAIN_STOPS = [
  { t: 0.00, c: hex3('#0f2f12') },
  { t: 0.25, c: hex3('#2c6e2f') }, 
  { t: 0.50, c: hex3('#bda86a') }, 
  { t: 0.75, c: hex3('#9a9a9a') },
  { t: 1.00, c: hex3('#ffffff') }  
];

// “viridis” approximation 
const VIRIDIS_STOPS = [
  { t: 0.00, c: [0.267, 0.005, 0.329] },
  { t: 0.33, c: [0.277, 0.615, 0.481] },
  { t: 0.66, c: [0.254, 0.878, 0.612] },
  { t: 1.00, c: [0.993, 0.906, 0.144] }
];

function sampleStops(stops, t) {
  if (t <= 0) return stops[0].c;
  if (t >= 1) return stops[stops.length-1].c;
  for (let i = 0; i < stops.length-1; i++) {
    const a = stops[i], b = stops[i+1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / (b.t - a.t);
      return lerp3(a.c, b.c, u);
    }
  }
  return stops[stops.length-1].c;
}

function rampColor(t, palette) {
  if (palette === 'viridis') return sampleStops(VIRIDIS_STOPS, t);
  if (palette === 'grayscale') return [t, t, t];
  return sampleStops(TERRAIN_STOPS, t);
}

/*---------------------------------
// TERRAIN CREATION
---------------------------------*/
function buildTerrain(decimate = 2, exaggeration = 1.3, palette = 'terrain') {
  if (!demArray) return;

  if (terrainMesh) {
    terrainMesh.geometry.dispose();
    terrainMesh.material.dispose();
    scene.remove(terrainMesh);
    terrainMesh = null;
  }

  const segX = Math.max(1, Math.floor(demWidth  / decimate) - 1);
  const segY = Math.max(1, Math.floor(demHeight / decimate) - 1);
  const sizeX = extentMeters.width;
  const sizeY = extentMeters.height;

  const geometry = new THREE.PlaneGeometry(sizeX, sizeY, segX, segY);

  const pos = geometry.attributes.position;
  const vertsX = segX + 1;
  const vertsY = segY + 1;

  const colors = new Float32Array(vertsX * vertsY * 3);

  for (let y = 0; y < vertsY; y++) {
    const srcY = Math.min(demHeight - 1, y * decimate);
    for (let x = 0; x < vertsX; x++) {
      const srcX = Math.min(demWidth - 1, x * decimate);
      const srcIdx = srcY * demWidth + srcX;
      let elev = demArray[srcIdx];

      if (demNoData != null && elev === demNoData) elev = demMin;
      if (!Number.isFinite(elev)) elev = demMin;

      const norm = (elev - demMin) / Math.max(1e-9, demMax - demMin); // 0..1
      const z = (elev - demMin) * exaggeration;

      const i = (y * vertsX + x) * 3;
      pos.array[i + 2] = z;

      const [r,g,b] = rampColor(norm, palette);
      colors[i + 0] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }
  }
  pos.needsUpdate = true;
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    metalness: 0.0,
    roughness: 0.95,
    vertexColors: true   // << use the per-vertex colors
  });

  terrainMesh = new THREE.Mesh(geometry, material);
  scene.add(terrainMesh);

  // frame camera
  const diag = Math.hypot(sizeX, sizeY);
  const fitDist = diag * 0.9;
  camera.position.set(0, -fitDist, diag * 0.45 + (demMax - demMin) * exaggeration * 0.6);
  controls.target.set(0, 0, (demMax - demMin) * exaggeration * 0.35);
  controls.update();
}

// UI
exaggerationRange?.addEventListener('input', () => {
  exaggerationVal.textContent = `${Number(exaggerationRange.value).toFixed(1)}×`;
});
rebuildBtn?.addEventListener('click', () => {
  const dec = Number(decimationSelect.value || 2);
  const ex  = Number(exaggerationRange.value || 1.3);
  const pal = paletteSelect?.value || 'terrain';
  buildTerrain(dec, ex, pal);
});
paletteSelect?.addEventListener('change', () => {
  const dec = Number(decimationSelect.value || 2);
  const ex  = Number(exaggerationRange.value || 1.3);
  const pal = paletteSelect.value || 'terrain';
  buildTerrain(dec, ex, pal);
});

/*---------------------------------
// WINDOW RESIZING
---------------------------------*/
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);

/*---------------------------------
// ANIMATION LOOP 
---------------------------------*/

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/*---------------------------------
// MAIN LOOP 
---------------------------------*/
(async function main() {
  try {
    await readDEM(DEM_URL);
    const dec = Number(decimationSelect?.value || 2);
    const ex  = Number(exaggerationRange?.value || 1.3);
    const pal = paletteSelect?.value || 'terrain';
    buildTerrain(dec, ex, pal);
    animate();
  } catch (err) {
    console.error('Failed to load DEM:', err);
    const msg = document.createElement('div');
    msg.textContent = 'Failed to load DEM. Check the console and the path to your .tif.';
    Object.assign(msg.style, {
      position: 'fixed', top: '60px', left: '12px',
      padding: '8px 10px', background: 'rgba(160,0,0,.7)', borderRadius: '6px'
    });
    document.body.appendChild(msg);
  }
})();

