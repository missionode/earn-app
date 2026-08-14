const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const modulePromise = import('../js/prosperity-3d.mjs');

test('prosperity physics uses normal Earth gravity', async () => {
  const { EARTH_GRAVITY } = await modulePromise;

  assert.deepEqual(EARTH_GRAVITY, { x: 0, y: -9.82, z: 0 });
});

test('prosperity pieces and simulation limits respond to device size', async () => {
  const { getResponsiveProsperityConfig } = await modulePromise;
  const mobile = getResponsiveProsperityConfig(390, 844, 3);
  const tablet = getResponsiveProsperityConfig(768, 1024, 3);
  const desktop = getResponsiveProsperityConfig(1440, 900, 3);

  assert.equal(mobile.performanceTier, 'mobile');
  assert.equal(tablet.performanceTier, 'tablet');
  assert.equal(desktop.performanceTier, 'desktop');
  assert.ok(mobile.targetPiecePixels < tablet.targetPiecePixels);
  assert.ok(tablet.targetPiecePixels < desktop.targetPiecePixels);
  assert.deepEqual([mobile.maxBodies, tablet.maxBodies, desktop.maxBodies], [36, 48, 64]);
  assert.deepEqual([mobile.pixelRatio, tablet.pixelRatio, desktop.pixelRatio], [1.5, 2, 2]);
});

test('each shower is bounded independently of the daily counter', async () => {
  const { getResponsiveProsperityConfig, getShowerPieceCount } = await modulePromise;
  const mobile = getResponsiveProsperityConfig(390, 844, 2);

  assert.equal(getShowerPieceCount(0, mobile), 16);
  assert.equal(getShowerPieceCount(100000, mobile), mobile.showerSize);
  assert.ok(getShowerPieceCount(460, mobile) <= mobile.maxBodies);
});

test('3D scene includes realistic metals, transparent gems, reflections and pile boundaries', () => {
  const scene = fs.readFileSync('js/prosperity-3d.mjs', 'utf8');

  for (const metal of ['gold', 'silver', 'copper', 'platinum']) {
    assert.match(scene, new RegExp(`name: '${metal}'`));
  }
  for (const gem of ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']) {
    assert.match(scene, new RegExp(`name: '${gem}'`));
  }
  assert.match(scene, /transmission:/);
  assert.match(scene, /EquirectangularReflectionMapping/);
  assert.match(scene, /new CANNON\.Cylinder/);
  assert.match(scene, /new CANNON\.Sphere/);
  assert.match(scene, /createBoundaries\(\)/);
  assert.match(scene, /sleepState !== CANNON\.Body\.SLEEPING/);
});

test('landing page exposes an accessible prosperity trigger and offline 3D modules', () => {
  const page = fs.readFileSync('index.html', 'utf8');
  const serviceWorker = fs.readFileSync('js/sw.js', 'utf8');

  assert.match(page, /class="prosperity-container" role="button" tabindex="0"/);
  assert.match(page, /id="prosperityStatus"[^>]+aria-live="polite"/);
  assert.match(serviceWorker, /earn-app-v27/);
  assert.match(serviceWorker, /prosperity-3d\.mjs/);
  assert.match(serviceWorker, /three\.module\.min\.mjs/);
  assert.match(serviceWorker, /three\.core\.min\.js/);
  assert.match(serviceWorker, /cannon-es\.mjs/);
  assert.doesNotMatch(serviceWorker, /assets\/coins\//);
});

test('3D dependencies are pinned exactly and have no transitive packages', () => {
  const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const lockfile = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

  assert.deepEqual(manifest.dependencies, {
    'cannon-es': '0.20.0',
    three: '0.185.1',
  });
  assert.equal(lockfile.packages['node_modules/cannon-es'].version, '0.20.0');
  assert.equal(lockfile.packages['node_modules/three'].version, '0.185.1');
  assert.equal(lockfile.packages['node_modules/cannon-es'].dependencies, undefined);
  assert.equal(lockfile.packages['node_modules/three'].dependencies, undefined);
});
