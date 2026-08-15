const { test, expect } = require('@playwright/test');

test('setup and settings keep one opening-balance income transaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html');

  const popup = page.locator('#upiSetupPopup');
  await expect(popup).toBeVisible();
  await page.getByLabel('UPI ID:').fill(`opening.balance${String.fromCharCode(64)}oksbi`);
  await page.getByLabel('Name:').fill('Opening Balance Test');
  await page.getByLabel('Standard service charge per client (₹):').fill('500');
  await page.getByLabel('Opening balance (₹):').fill('1250.50');
  await page.getByRole('button', { name: 'Start Earn' }).click();

  await expect(popup).toBeHidden();
  await expect(page.locator('#totalIncome')).toHaveText('₹1,250.5');
  await expect(page.locator('#adsSpaceaption')).toHaveText('🪷 1,250.5 ₹');
  await expect(page.locator('#transactionsTable tbody tr')).toHaveCount(1);
  await expect(page.locator('#transactionsTable tbody tr')).toContainText('Opening balance');
  await expect(page.locator('#transactionsTable tbody tr')).toContainText('+ ₹1,250.5');

  await page.goto('/index.html?triggerUPIPopUp=true');
  await expect(popup).toBeVisible();
  await expect(page.getByLabel('Opening balance (₹):')).toHaveValue('1250.5');
  await page.getByLabel('Opening balance (₹):').fill('1800');
  await page.getByRole('button', { name: 'Start Earn' }).click();

  await expect(page.locator('#totalIncome')).toHaveText('₹1,800');
  await expect(page.locator('#adsSpaceaption')).toHaveText('🪷 1,800 ₹');
  await expect(page.locator('#transactionsTable tbody tr')).toHaveCount(1);
  await expect(page.locator('#transactionsTable tbody tr')).toContainText('+ ₹1,800');
  const stored = await page.evaluate(() => ({
    openingBalance: localStorage.getItem('earn_openingBalance'),
    transactions: JSON.parse(localStorage.getItem('earn_transactions')),
  }));
  expect(stored.openingBalance).toBe('1800');
  expect(stored.transactions).toHaveLength(1);
  expect(stored.transactions[0]).toMatchObject({
    id: 'earn-opening-balance',
    type: 'income',
    amount: 1800,
    description: 'Opening balance',
    status: 'success',
  });
});
