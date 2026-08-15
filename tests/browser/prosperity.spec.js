const path = require('node:path');
const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'mobile', width: 390, height: 844, tier: 'mobile' },
  { name: 'tablet', width: 768, height: 1024, tier: 'tablet' },
  { name: 'desktop', width: 1440, height: 900, tier: 'desktop' },
];

for (const viewport of viewports) {
  test(`${viewport.name} renders and settles a responsive 3D treasure pile`, async ({ page }) => {
    test.setTimeout(45_000);
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

    const targetPiecePixels = Number(await canvas.getAttribute('data-target-piece-pixels'));
    const bodyLimit = Number(await canvas.getAttribute('data-max-bodies'));
    await expect.poll(async () => Number(await canvas.getAttribute('data-body-count'))).toBeGreaterThan(15);
    await expect.poll(async () => Number(await canvas.getAttribute('data-spawn-pending')), { timeout: 10000 }).toBe(0);
    await expect.poll(async () => Number(await canvas.getAttribute('data-awake-bodies')), { timeout: 20000 }).toBe(0);

    expect(targetPiecePixels).toBeGreaterThanOrEqual(10);
    expect(targetPiecePixels).toBeLessThanOrEqual(22);
    expect(Number(await canvas.getAttribute('data-body-count'))).toBeLessThanOrEqual(bodyLimit);
    expect(Number(await canvas.getAttribute('data-pile90-horizontal-ratio'))).toBeLessThan(0.7);
    const renderedKinds = (await canvas.getAttribute('data-kinds')).split(',');
    for (const kind of ['gold', 'silver', 'copper', 'platinum', 'diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz']) {
      expect(renderedKinds).toContain(kind);
    }
    expect(browserErrors).toEqual([]);

    const firstCollectedCount = Number(await canvas.getAttribute('data-collected-count'));
    const firstPileLayers = Number(await canvas.getAttribute('data-pile-layers'));
    const firstPileSurfaceY = Number(await canvas.getAttribute('data-pile-surface-y'));
    expect(firstCollectedCount).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
    await expect.poll(async () => Number(await canvas.getAttribute('data-collected-count')), { timeout: 20000 })
      .toBeGreaterThan(firstCollectedCount);
    expect(Number(await canvas.getAttribute('data-body-count'))).toBeLessThanOrEqual(bodyLimit);
    expect(Number(await canvas.getAttribute('data-visible-piece-count'))).toBeGreaterThan(firstCollectedCount);
    expect(Number(await canvas.getAttribute('data-pile-layers'))).toBeGreaterThan(firstPileLayers);
    expect(Number(await canvas.getAttribute('data-pile-surface-y'))).toBeGreaterThan(firstPileSurfaceY);

    await page.screenshot({
      path: path.join('/tmp/earn-prosperity-cp017', `${viewport.name}.png`),
      fullPage: false,
    });
  });
}

test('progressive pile can retain the complete dailyCounter inventory', async ({ page }) => {
  test.setTimeout(30_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/index.html');
  await page.addStyleTag({ content: '.popup { display: none !important; }' });
  const availableCount = Number(await page.locator('#dailyCounter').textContent());
  const restoredCount = Math.max(0, availableCount - 20);

  await page.evaluate(({ count }) => {
    const metals = ['gold', 'silver', 'copper', 'platinum'];
    const gems = ['diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'topaz'];
    const pieces = Array.from({ length: count }, (_, index) => {
      const isGem = index % 3 === 1;
      const halfAngle = (index * 0.73 % (Math.PI * 2)) * 0.5;
      const quaternion = [0, 0, 0, Math.cos(halfAngle)];
      quaternion[index % 3] = Math.sin(halfAngle);
      return {
        type: isGem ? 'gem' : 'coin',
        kind: isGem ? gems[index % gems.length] : metals[index % metals.length],
        position: [0, 0, 0],
        quaternion,
      };
    });
    localStorage.setItem('earn.prosperityTreasure.v2', JSON.stringify({ version: 2, pieces }));
  }, { count: restoredCount });

  await page.getByRole('button', { name: 'Create a 3D prosperity treasure' }).click();
  const canvas = page.locator('.prosperity-canvas');
  await expect.poll(async () => Number(await canvas.getAttribute('data-collected-count')), { timeout: 20_000 })
    .toBe(availableCount);
  await expect(canvas).toHaveAttribute('data-visible-piece-count', String(availableCount));
  await expect(canvas).toHaveAttribute('data-body-count', '0');
  expect(Number(await canvas.getAttribute('data-pile-layers'))).toBeGreaterThan(1);
  await page.screenshot({ path: '/tmp/earn-prosperity-cp019/full-daily-pile.png', fullPage: false });
});
