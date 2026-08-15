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
  assert.deepEqual([mobile.targetPiecePixels, tablet.targetPiecePixels, desktop.targetPiecePixels], [10.92, 21.504, 22]);
  assert.deepEqual([mobile.maxBodies, tablet.maxBodies, desktop.maxBodies], [28, 36, 44]);
  assert.deepEqual([mobile.pixelRatio, tablet.pixelRatio, desktop.pixelRatio], [1.5, 2, 2]);
});

test('each click doubles the shower count and caps the last batch at the daily total', async () => {
  const { getShowerPieceCount } = await modulePromise;
  assert.equal(getShowerPieceCount(0, 1), 0);
  assert.equal(getShowerPieceCount(461, 1), 2);
  assert.equal(getShowerPieceCount(459, 2), 4);

  const batches = [];
  let collected = 0;
  let exponent = 1;
  while (collected < 461) {
    const batch = getShowerPieceCount(461 - collected, exponent);
    batches.push(batch);
    collected += batch;
    exponent += 1;
  }
  assert.deepEqual(batches, [2, 4, 8, 16, 32, 64, 128, 207]);
  assert.equal(collected, 461);
});

test('3D scene includes realistic materials and a flat transparent viewport container', () => {
  const scene = fs.readFileSync('js/prosperity-3d.mjs', 'utf8');

  for (const metal of ['gold', 'silver', 'copper', 'platinum']) {
    assert.match(scene, new RegExp(`name: '${metal}'`));
  }
  for (const gem of ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']) {
    assert.match(scene, new RegExp(`name: '${gem}'`));
  }
  assert.match(scene, /transmission:/);
  assert.match(scene, /tablePercentage: 57/);
  assert.match(scene, /crownAngle: 34/);
  assert.match(scene, /pavilionAngle: 41/);
  assert.match(scene, /iridescence:/);
  assert.match(scene, /EquirectangularReflectionMapping/);
  assert.match(scene, /new CANNON\.Cylinder/);
  assert.match(scene, /new CANNON\.Sphere/);
  assert.match(scene, /createBoundaries\(\)/);
  assert.match(scene, /flat-bottom-viewport/);
  assert.match(scene, /releaseOrigin = 'full-width-top'/);
  assert.match(scene, /bounceProfile = 'lively-contained'/);
  assert.match(scene, /obstacleModel = 'dom-elements'/);
  assert.match(scene, /ELEMENT_OBSTACLE_SELECTOR/);
  assert.match(scene, /getBoundingClientRect\(\)/);
  assert.match(scene, /createElementObstacles\(\)/);
  assert.match(scene, /friction: 0\.035/);
  assert.match(scene, /restitution: 0\.48/);
  assert.match(scene, /setFromEuler\(obstacleIndex % 2 \? 0\.065 : -0\.065/);
  assert.match(scene, /handleElementCollision\(body, otherBody\)/);
  assert.match(scene, /keepRollingOffElement\(body, time\)/);
  assert.match(scene, /elementCollisionCount/);
  assert.match(scene, /restitution: 0\.42/);
  assert.match(scene, /restitution: 0\.3/);
  assert.match(scene, /releaseHalfWidth = Math\.max\(this\.pieceRadius, this\.visibleWidth \* 0\.5/);
  assert.match(scene, /new THREE\.LineSegments/);
  assert.match(scene, /opacity: 0\.055/);
  assert.doesNotMatch(scene, /rampMaterial|rampAngle|basinHalfWidth/);
  assert.match(scene, /sleepState !== CANNON\.Body\.SLEEPING/);
  assert.match(scene, /callback\?\.\(this\.entries\.length\)/);
  assert.match(scene, /this\.batchBodies\.has\(body\)/);
  assert.match(scene, /this\.entries\.length \+ this\.spawnTimers\.size/);
  assert.doesNotMatch(scene, /if \(this\.batchActive \|\| this\.spawnTimers\.size\)/);
  assert.doesNotMatch(scene, /new THREE\.InstancedMesh/);
  assert.doesNotMatch(scene, /getPilePosition|updatePileSurface|staticPieces/);
});

test('landing page exposes an accessible prosperity trigger and offline 3D modules', () => {
  const page = fs.readFileSync('index.html', 'utf8');
  const serviceWorker = fs.readFileSync('js/sw.js', 'utf8');

  assert.match(page, /class="prosperity-container" role="button" tabindex="0"/);
  assert.match(page, /id="prosperityStatus"[^>]+aria-live="polite"/);
  assert.match(serviceWorker, /earn-app-v36/);
  assert.match(serviceWorker, /prosperity-3d\.mjs/);
  assert.match(serviceWorker, /three\.module\.min\.mjs/);
  assert.match(serviceWorker, /three\.core\.min\.js/);
  assert.match(serviceWorker, /cannon-es\.mjs/);
  assert.doesNotMatch(serviceWorker, /assets\/coins\//);
  assert.match(serviceWorker, /coin_drop\.mp3/);
});

test('prosperity controller keeps piles session-only and bounds the original coin sound', () => {
  const controller = fs.readFileSync('js/prosperity.js', 'utf8');

  assert.doesNotMatch(controller, /prosperityTreasure|localStorage/);
  assert.match(controller, /new Audio\('assets\/sounds\/coin_drop\.mp3'\)/);
  assert.match(controller, /setTimeout\(stopCoinDropSound, 3200\)/);
  assert.match(controller, /Minting and polishing/);
  assert.match(controller, /Prosperity treasure complete/);
  assert.doesNotMatch(controller, /AudioContext|beginMagicalWhoosh|createBiquadFilter/);
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
