const path = require('node:path');
const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844, tier: 'mobile' },
  { name: 'tablet', width: 768, height: 1024, tier: 'tablet' },
  { name: 'desktop', width: 1440, height: 900, tier: 'desktop' },
];

for (const viewport of viewports) {
  test(`${viewport.name} renders and settles a responsive 3D treasure pile`, async ({ page }) => {
    test.setTimeout(70_000);
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/index.html');
    await page.addStyleTag({ content: '.popup { display: none !important; }' });

    await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
    const canvas = page.locator('.prosperity-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-physics', 'earth-gravity');
    await expect(canvas).toHaveAttribute('data-performance-tier', viewport.tier);
    await expect(canvas).toHaveAttribute('data-container-shape', 'flat-bottom-viewport');
    await expect(canvas).toHaveAttribute('data-release-origin', 'top-center');
    await expect(canvas).toHaveAttribute('data-bounce-profile', 'lively-contained');

    const targetPiecePixels = Number(await canvas.getAttribute('data-target-piece-pixels'));
    const bodyLimit = Number(await canvas.getAttribute('data-max-bodies'));
    await expect.poll(async () => Number(await canvas.getAttribute('data-body-count'))).toBeGreaterThan(5);
    const firstShowerSize = Number(await canvas.getAttribute('data-shower-size'));
    await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-body-count')), { timeout: 10_000 })
      .toBeGreaterThan(firstShowerSize);
    await expect.poll(async () => Number(await canvas.getAttribute('data-spawn-pending')), { timeout: 10000 }).toBe(0);
    await expect.poll(async () => Number(await canvas.getAttribute('data-awake-bodies')), { timeout: 30000 }).toBe(0);

    expect(targetPiecePixels).toBeGreaterThanOrEqual(10);
    expect(targetPiecePixels).toBeLessThanOrEqual(22);
    expect(firstShowerSize).toBeLessThanOrEqual(bodyLimit);
    expect(Number(await canvas.getAttribute('data-body-count'))).toBeGreaterThan(firstShowerSize);
    expect(Number(await canvas.getAttribute('data-floor-lift-pixels'))).toBeGreaterThan(40);
    expect(Number(await canvas.getAttribute('data-pile90-horizontal-ratio'))).toBeGreaterThan(0.25);
    expect(Number(await canvas.getAttribute('data-pile90-horizontal-ratio'))).toBeLessThan(1.05);
    expect(Number(await canvas.getAttribute('data-maximum-horizontal-ratio'))).toBeLessThan(1.05);
    const renderedKinds = (await canvas.getAttribute('data-kinds')).split(',');
    for (const kind of ['gold', 'silver', 'copper', 'platinum', 'diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']) {
      expect(renderedKinds).toContain(kind);
    }
    expect(browserErrors).toEqual([]);

    expect(Number(await canvas.getAttribute('data-shower-size'))).toBeLessThanOrEqual(bodyLimit);
    expect(Number(await canvas.getAttribute('data-visible-piece-count'))).toBeGreaterThan(firstShowerSize);

    await page.screenshot({
      path: path.join('/tmp/earn-prosperity-cp017', `${viewport.name}.png`),
      fullPage: false,
    });
  });
}

test('a reload starts a fresh relaxing treasure session', async ({ page }) => {
  test.setTimeout(70_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');
  await page.addStyleTag({ content: '.popup { display: none !important; }' });
  await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
  let canvas = page.locator('.prosperity-canvas');
  await expect.poll(async () => Number(await canvas.getAttribute('data-body-count')), { timeout: 10_000 }).toBeGreaterThan(15);
  await expect.poll(async () => Number(await canvas.getAttribute('data-awake-bodies')), { timeout: 30_000 }).toBe(0);
  const firstSessionCount = Number(await canvas.getAttribute('data-collected-count'));
  await page.reload();
  await page.addStyleTag({ content: '.popup { display: none !important; }' });
  await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
  canvas = page.locator('.prosperity-canvas');
  await expect.poll(async () => Number(await canvas.getAttribute('data-body-count')), { timeout: 10_000 }).toBeGreaterThan(15);
  await expect.poll(async () => Number(await canvas.getAttribute('data-awake-bodies')), { timeout: 30_000 }).toBe(0);
  expect(Number(await canvas.getAttribute('data-collected-count'))).toBe(firstSessionCount);
});
