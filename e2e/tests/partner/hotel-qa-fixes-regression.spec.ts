import { test, expect } from '@playwright/test';
import { uniqueUzPhone } from '../helpers/phone';

/**
 * Regression testlari — "SAFAAR — FIX ALL HOTEL QA FINDINGS" ishi.
 * Har bir test aynan bitta BUG-00X uchun, uni qayta paydo bo'lishidan
 * himoya qiladi. Deployed environmentga qarshi ishlaydi
 * (playwright.config.ts default baseURL'lari).
 */

const APPROVED_PARTNER_PHONE = '+998901112202'; // Grand Samarkand Hotel (approved)
const ADMIN_BASE_URL =
  process.env.E2E_ADMIN_URL || 'https://web-admin-phi-beige.vercel.app';
const ADMIN_EMAIL = 'admin@safaar.uz';
const ADMIN_PASSWORD = 'Admin12345!';

async function loginAsPartner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.locator('#phone').fill(APPROVED_PARTNER_PHONE);
  await page.getByRole('button', { name: 'SMS Kodini yuborish' }).click();

  const devCodeStrong = page
    .locator('text=Dasturlash rejimi kodi:')
    .locator('..')
    .locator('strong');
  await expect(devCodeStrong).toBeVisible({ timeout: 15_000 });
  const code = (await devCodeStrong.textContent())?.trim();

  await page.locator('#code').fill(code!);
  await page.getByRole('button', { name: 'Kabinetga kirish' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
}

test.describe('Hotel QA fixes — regression', () => {
  test('BUG-001 regression: OTP resend-too-soon shows the real backend error, never a fake "code sent" success', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.locator('#phone').fill(APPROVED_PARTNER_PHONE);

    // 1st send — establishes/refreshes the server-side resend cooldown.
    await page.getByRole('button', { name: 'SMS Kodini yuborish' }).click();
    await page.waitForTimeout(1500);

    // Go back to the phone step (if the 1st send succeeded) and resend
    // immediately — this MUST land inside the 60s cooldown.
    const changeBtn = page.getByRole('button', {
      name: "Telefon raqamini o'zgartirish",
    });
    if (await changeBtn.isVisible().catch(() => false)) {
      await changeBtn.click();
    }
    await page.locator('#phone').fill(APPROVED_PARTNER_PHONE);

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/otp/request')),
      page.getByRole('button', { name: 'SMS Kodini yuborish' }).click(),
    ]);
    expect(resp.status()).toBe(400);
    const body = await resp.json().catch(() => null);
    // Backend enforces two independent guards here — a 60s per-resend
    // cooldown and a broader request-rate window — either is a valid real
    // error for this test's purpose (it must NOT be swallowed into a fake
    // demo-challenge success).
    expect(['OTP_RESEND_TOO_SOON', 'OTP_RATE_LIMITED']).toContain(body?.error?.code);

    // The real backend message must reach the user (regex avoids the
    // curly-vs-straight-apostrophe mismatch between the backend string
    // and plain ASCII source here).
    const expectedMessage =
      body?.error?.code === 'OTP_RATE_LIMITED'
        ? /OTP so.rovlar limiti oshdi/
        : /Kodni qayta so.rashdan oldin biroz kuting/;
    await expect(page.getByText(expectedMessage)).toBeVisible({ timeout: 5_000 });

    // ...and the UI must NOT silently fall into the fake "code sent" step:
    // no code input, no false "Kod ... raqamiga yuborildi" success text.
    await expect(page.locator('#code')).toHaveCount(0);
    await expect(page.getByText(/raqamiga yuborildi/i)).toHaveCount(0);
  });

  test('BUG-002 regression: contact person survives registration → API response → admin request list', async ({
    page,
  }) => {
    const stamp = Date.now();
    const companyName = `QA Regression Hotel ${stamp}`;
    const contactPerson = `Test QA Ismoilov ${stamp}`;
    const phone = uniqueUzPhone();
    const email = `qa.contact.${stamp}@example.com`;
    const taxId = String(100000000 + (stamp % 800000000));

    await page.goto('/register');
    await page.getByLabel('Obyekt turi').selectOption('hotel');
    await page.getByLabel('Obyekt yoki Kompaniya nomi').fill(companyName);
    await page.getByLabel("Mas'ul shaxs").fill(contactPerson);
    const phoneInput = page.getByLabel('Telefon');
    await phoneInput.fill('');
    await phoneInput.type(phone, { delay: 5 });
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Shahar').fill('Samarqand');
    await page.getByLabel('STIR').fill(taxId);
    await page.getByLabel('Manzil').fill('Registon ko\'chasi 10, QA regression');

    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/partners/requests') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Arizani yuborish' }).click(),
    ]);
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.data.item.contactPerson).toBe(contactPerson);
    expect(body.data.item.contactPerson).not.toBe(companyName);

    // Admin request page must show the same (real) contact person, not the
    // company name duplicated.
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.getByPlaceholder('admin').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Boshqaruv Paneliga Kirish' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto(`${ADMIN_BASE_URL}/partners/requests`);
    await page.waitForLoadState('networkidle');
    const row = page.locator('tr', { hasText: companyName });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText(contactPerson)).toBeVisible();
  });

  test('BUG-004 regression: every registration field is reachable via an accessible label (getByLabel)', async ({
    page,
  }) => {
    await page.goto('/register');
    for (const label of [
      'Obyekt turi',
      'Obyekt yoki Kompaniya nomi',
      "Mas'ul shaxs",
      'Telefon',
      'Email',
      'Shahar',
      'STIR',
      'Manzil',
      'Izoh',
    ]) {
      await expect(page.getByLabel(label), `getByLabel('${label}') topilmadi`).toBeVisible();
    }
  });

  test('BUG-005 regression: withdrawal submit is disabled for a non-positive amount', async ({
    page,
  }) => {
    await loginAsPartner(page);
    await page.goto('/reports');
    await page.getByRole('button', { name: /Moliya & Pul yechish/ }).click();

    const amountInput = page.locator('input[type="number"]').first();
    await expect(amountInput).toBeVisible({ timeout: 10_000 });
    await expect(amountInput).toHaveAttribute('min', '0');
    const bankInput = page.getByPlaceholder('Tranzit hisob yoki Uzcard');
    await bankInput.fill('Test hisob 12345');
    const submitBtn = page.getByRole('button', { name: "So'rov yuborish" });

    await amountInput.fill('-500');
    await expect(submitBtn).toBeDisabled();

    await amountInput.fill('0');
    await expect(submitBtn).toBeDisabled();

    await amountInput.fill('');
    await expect(submitBtn).toBeDisabled();

    await amountInput.fill('5000');
    await expect(submitBtn).toBeEnabled();
  });

  test('BUG-006 regression: /listing loads with zero broken image requests', async ({ page }) => {
    await loginAsPartner(page);
    const broken: string[] = [];
    page.on('response', (res) => {
      if (res.status() === 404 && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(res.url())) {
        broken.push(`${res.status()} ${res.url()}`);
      }
    });
    await page.goto('/listing', { waitUntil: 'networkidle' });
    expect(broken, `Broken image requests: ${broken.join(', ')}`).toHaveLength(0);
  });
});
